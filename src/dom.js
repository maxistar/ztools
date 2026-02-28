// src/dom.js
// DOM builder: h/tag (DOM-first: create OR enhance existing Node OR call component)
// + Show/For (optional helpers)

import { effect, signal, onCleanup } from "./core.js";

function isPlainObject(x) {
  if (!x || typeof x !== "object") return false;
  if (x instanceof Node) return false;
  if (Array.isArray(x)) return false;
  return Object.getPrototypeOf(x) === Object.prototype;
}

function setProp(el, key, val) {
  if (key === "className") {
    el.className = val || "";
    return;
  }
  if (key === "textContent") {
    el.textContent = val == null ? "" : String(val);
    return;
  }

  if (key === "style" && val && typeof val === "object") {
    for (const s in val) el.style[s] = val[s];
    return;
  }

  if (typeof val === "boolean") {
    if (val) el.setAttribute(key, "");
    else el.removeAttribute(key);
    return;
  }

  if (key in el) {
    try {
      el[key] = val;
      return;
    } catch {}
  }

  if (val == null) el.removeAttribute(key);
  else el.setAttribute(key, String(val));
}

function applyProps(el, props) {
  for (const k in props) {
    const v = props[k];

    if (k === "ref" && typeof v === "function") {
      v(el);
      continue;
    }

    if (k.slice(0, 2) === "on" && typeof v === "function") {
      el.addEventListener(k.slice(2).toLowerCase(), v);
      continue;
    }

    // reactive prop/attr
    if (typeof v === "function") {
      ((key, getter) => {
        effect(() => setProp(el, key, getter()));
      })(k, v);
      continue;
    }

    setProp(el, k, v);
  }
}

function appendChild(el, child) {
  if (child == null || child === false) return;

  if (Array.isArray(child)) {
    for (let i = 0; i < child.length; i++) appendChild(el, child[i]);
    return;
  }

  // reactive text: () => ...
  if (typeof child === "function") {
    const tn = document.createTextNode("");
    el.appendChild(tn);
    effect(() => {
      const v = child();
      tn.nodeValue = v == null ? "" : String(v);
    });
    return;
  }

  if (typeof child === "string" || typeof child === "number") {
    el.appendChild(document.createTextNode(String(child)));
    return;
  }

  if (child instanceof Node) {
    el.appendChild(child);
    return;
  }

  el.appendChild(document.createTextNode(String(child)));
}

/**
 * h(target, ...args)
 * target:
 *  - "div" (string) => create element
 *  - Node => enhance existing node
 *  - function => component: (props, ...children) => Node
 */
export function h(target /* ...args */) {
  let el;

  if (typeof target === "string") {
    el = document.createElement(target);
  } else if (target instanceof Node) {
    el = target; // enhance existing
  } else if (typeof target === "function") {
    let props = {};
    let start = 1;

    if (arguments.length > 1 && isPlainObject(arguments[1])) {
      props = arguments[1];
      start = 2;
    }

    const children = [];
    for (let i = start; i < arguments.length; i++) children.push(arguments[i]);

    return target(props, ...children);
  } else {
    throw new Error(
      "h(): first argument must be tagName|string, Node, or component function",
    );
  }

  for (let i = 1; i < arguments.length; i++) {
    const arg = arguments[i];
    if (isPlainObject(arg)) applyProps(el, arg);
    else appendChild(el, arg);
  }

  return el;
}

export function tag(name) {
  return function () {
    const args = [name];
    for (let i = 0; i < arguments.length; i++) args.push(arguments[i]);
    return h.apply(null, args);
  };
}

export function createTags() {
  const out = new Array(arguments.length);
  for (let i = 0; i < arguments.length; i++) {
    out[i] = tag(arguments[i]);
  }
  return out;
}

export const tags = new Proxy(
  {},
  {
    get(_, name) {
      return tag(name);
    },
  },
);

// Optional: Show / For (handy for SPA mode)

export function Show(when, render, fallback) {
  const anchor = document.createComment("show");
  let current = null;
  let trueNode = null;
  let falseNode = null;

  const attached = signal(false);
  let attachObs = null;

  effect(() => {
    // Ensure we re-evaluate once the anchor is attached to the DOM.
    attached();

    const cond = typeof when === "function" ? when() : when;
    const parent = anchor.parentNode;

    if (!parent) {
      if (!attachObs) {
        attachObs = new MutationObserver(() => {
          if (anchor.parentNode) {
            attachObs.disconnect();
            attachObs = null;
            attached.set(!attached());
          }
        });
        attachObs.observe(document, { childList: true, subtree: true });
      }
      onCleanup(() => {
        if (attachObs) {
          attachObs.disconnect();
          attachObs = null;
        }
      });
      return;
    }

    let next = null;

    if (cond) {
      if (!trueNode) trueNode = render(cond);
      next = trueNode;
    } else if (fallback) {
      if (!falseNode) falseNode = fallback();
      next = falseNode;
    }

    if (current === next) return;

    if (current && current.parentNode === parent) parent.removeChild(current);
    if (next) parent.insertBefore(next, anchor.nextSibling);

    current = next;
  });

  return anchor;
}

export function For(listSignal, renderItem, keyFn) {
  keyFn =
    keyFn ||
    function (item, idx) {
      if (item && typeof item === "object") {
        if ("id" in item) return item.id;
        if ("key" in item) return item.key;
        if ("_id" in item) return item._id;
      }
      return idx;
    };

  const host = document.createElement("span");
  host.setAttribute("data-for", "");

  const keyed = new Map(); // key -> Node
  const indexSignals = new Map(); // key -> signal(index)
  let prevKeys = [];

  effect(() => {
    const items = listSignal() || [];
    const nextKeys = new Array(items.length);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let key = keyFn(item, i);
      if (key == null)
        throw new Error("For(): key is null/undefined at index " + i);
      key = String(key);
      nextKeys[i] = key;

      let idxSig = indexSignals.get(key);
      if (!idxSig) {
        idxSig = signal(i);
        indexSignals.set(key, idxSig);
      } else {
        idxSig.set(i);
      }

      if (!keyed.has(key)) {
        const node = renderItem(item, idxSig);
        if (!(node instanceof Node))
          throw new Error("For(): renderItem must return a DOM Node");
        keyed.set(key, node);
      }
    }

    // remove missing
    for (let p = 0; p < prevKeys.length; p++) {
      const k = prevKeys[p];
      if (nextKeys.indexOf(k) === -1) {
        const oldNode = keyed.get(k);
        if (oldNode && oldNode.parentNode === host) host.removeChild(oldNode);
        keyed.delete(k);
        indexSignals.delete(k);
      }
    }

    // reorder from end
    let anchor = null;
    for (let j = nextKeys.length - 1; j >= 0; j--) {
      const nodeJ = keyed.get(nextKeys[j]);

      if (anchor === null) {
        if (nodeJ.parentNode !== host || nodeJ.nextSibling !== null)
          host.appendChild(nodeJ);
      } else {
        if (nodeJ.parentNode !== host || nodeJ.nextSibling !== anchor)
          host.insertBefore(nodeJ, anchor);
      }
      anchor = nodeJ;
    }

    prevKeys = nextKeys;
  });

  return host;
}
