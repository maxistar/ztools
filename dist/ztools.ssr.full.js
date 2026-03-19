// src/ssr.js
var VOID_TAGS = /* @__PURE__ */ new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);
function isPlainObject(x) {
  return x && typeof x === "object" && !Array.isArray(x) && x.__ssrNode !== true;
}
function h(tag2, props, ...children) {
  if (props != null && !isPlainObject(props)) {
    children = [props, ...children];
    props = null;
  }
  return { __ssrNode: true, tag: tag2, props, children };
}
function tag(name) {
  return (props, ...children) => h(name, props, ...children);
}
var tags = new Proxy(
  {},
  {
    get(_, name) {
      return tag(name);
    }
  }
);
function rawHtml(content) {
  return { __rawHtml: true, content: String(content) };
}
function renderToString(node) {
  return render(node);
  function render(n) {
    if (n == null || n === false) return "";
    if (n && n.__rawHtml) return n.content;
    if (typeof n === "string" || typeof n === "number") return escText(String(n));
    if (Array.isArray(n)) return n.map(render).join("");
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
function escText(s) {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function escAttr(s) {
  return escText(s).replaceAll('"', "&quot;");
}
function styleObjToCss(obj) {
  let s = "";
  for (const k in obj) {
    const cssKey = k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
    s += `${cssKey}:${obj[k]};`;
  }
  return s;
}
function renderSingleAttrLike(k, v) {
  if (typeof v === "function") v = v();
  if (v == null || v === false) return "";
  if (k.startsWith("on") && typeof v === "function") return "";
  const attr = k === "className" ? "class" : k;
  if (v === true) return ` ${attr}`;
  if (attr === "style" && typeof v === "object") {
    return ` style="${escAttr(styleObjToCss(v))}"`;
  }
  return ` ${attr}="${escAttr(String(v))}"`;
}
function renderAttrs(props) {
  if (!props) return "";
  let out = "";
  if (props.attrs && typeof props.attrs === "object") {
    for (const k in props.attrs) {
      out += renderSingleAttrLike(k, props.attrs[k]);
    }
  }
  if (props.props && typeof props.props === "object") {
    for (const k in props.props) {
      out += renderSingleAttrLike(k, props.props[k]);
    }
  }
  for (const k in props) {
    if (k === "attrs" || k === "props" || k === "on") continue;
    out += renderSingleAttrLike(k, props[k]);
  }
  return out;
}
export {
  escText,
  h,
  rawHtml,
  renderToString,
  tag,
  tags
};
