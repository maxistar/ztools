// src/ssr.js
// Lightweight SSR builder: h/tag + renderToString
// No signals, no effects, no DOM.

const VOID_TAGS = new Set([
  "area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"
]);

function isPlainObject(x) {
  return x && typeof x === "object" && !Array.isArray(x) && x.__ssrNode !== true;
}

export function h(tag, props, ...children) {
  // allow omitting props:
  // h("div", "text") => props treated as child
  if (props != null && !isPlainObject(props)) {
    children = [props, ...children];
    props = null;
  }
  return { __ssrNode: true, tag, props, children };
}

export function tag(name) {
  return (props, ...children) => h(name, props, ...children);
}

function tagsFactory(...names) {
  const out = Object.create(null);
  for (let i = 0; i < names.length; i++) {
    out[names[i]] = tag(names[i]);
  }
  return out;
}

export const tags = new Proxy(tagsFactory, {
  get(target, name) {
    if (name in target) return target[name];
    if (typeof name !== "string") return undefined;
    return tag(name);
  },
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, argArray);
  },
});

/**
 * rawHtml(content) — embed raw HTML without escaping.
 * Use only for trusted content (script/style bodies etc.)
 */
export function rawHtml(content) {
  return { __rawHtml: true, content: String(content) };
}

export function renderToString(node) {
  return render(node);

  function render(n) {
    if (n == null || n === false) return "";
    if (n && n.__rawHtml) return n.content;
    if (typeof n === "string" || typeof n === "number") return escText(String(n));
    if (Array.isArray(n)) return n.map(render).join("");

    // allow "component functions" on server too
    if (typeof n === "function") return render(n());

    if (n && n.__ssrNode) {
      const t = String(n.tag);
      const attrs = renderAttrs(n.props);
      if (VOID_TAGS.has(t)) return `<${t}${attrs}>`;
      const inner = (n.children || []).map(render).join("");
      return `<${t}${attrs}>${inner}</${t}>`;
    }

    return escText(String(n));
  }
}

export function escText(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escAttr(s) {
  return escText(s).replaceAll('"', "&quot;");
}

function styleObjToCss(obj) {
  let s = "";
  for (const k in obj) {
    const cssKey = k.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
    s += `${cssKey}:${obj[k]};`;
  }
  return s;
}

function renderSingleAttrLike(k, v) {
  if (typeof v === "function") v = v();
  if (v == null || v === false) return "";

  // never SSR events
  if (k.startsWith("on") && typeof v === "function") return "";

  const attr = (k === "className") ? "class" : k;

  if (v === true) return ` ${attr}`;

  if (attr === "style" && typeof v === "object") {
    return ` style="${escAttr(styleObjToCss(v))}"`;
  }

  return ` ${attr}="${escAttr(String(v))}"`;
}

function renderAttrs(props) {
  if (!props) return "";
  let out = "";

  // explicit attrs bag
  if (props.attrs && typeof props.attrs === "object") {
    for (const k in props.attrs) {
      out += renderSingleAttrLike(k, props.attrs[k]);
    }
  }

  // explicit props bag (SSR fallback to attributes for compatibility)
  if (props.props && typeof props.props === "object") {
    for (const k in props.props) {
      out += renderSingleAttrLike(k, props.props[k]);
    }
  }

  // explicit event bag is intentionally ignored on SSR

  // legacy / regular props still supported
  for (const k in props) {
    if (k === "attrs" || k === "props" || k === "on") continue;
    out += renderSingleAttrLike(k, props[k]);
  }

  return out;
}
