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

export function renderToString(node) {
  return render(node);

  function render(n) {
    if (n == null || n === false) return "";
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

function renderAttrs(props) {
  if (!props) return "";
  let out = "";

  for (const k in props) {
    const v = props[k];
    if (v == null || v === false) continue;

    // never SSR events
    if (k.startsWith("on") && typeof v === "function") continue;

    const attr = (k === "className") ? "class" : k;

    if (v === true) {
      out += ` ${attr}`;
      continue;
    }

    if (attr === "style" && typeof v === "object") {
      out += ` style="${escAttr(styleObjToCss(v))}"`;
      continue;
    }

    out += ` ${attr}="${escAttr(String(v))}"`;
  }

  return out;
}