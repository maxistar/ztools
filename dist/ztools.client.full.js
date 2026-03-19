// src/core.js
var _activeEffect = null;
var _activeOwner = null;
var _batchDepth = 0;
var _queuedEffects = /* @__PURE__ */ new Set();
function __getActiveOwner() {
  return _activeOwner;
}
function __setActiveOwner(o) {
  _activeOwner = o;
}
function __createOwner(parent) {
  return { parent: parent || null, effects: [], cleanups: [] };
}
function cleanupEffect(eff) {
  const deps = eff.deps;
  for (let i = 0; i < deps.length; i++) deps[i].delete(eff);
  deps.length = 0;
  const cs = eff.cleanups;
  for (let j = 0; j < cs.length; j++) {
    try {
      cs[j]();
    } catch {
    }
  }
  cs.length = 0;
}
function __cleanupOwner(owner) {
  if (!owner) return;
  for (let i = 0; i < owner.effects.length; i++) cleanupEffect(owner.effects[i]);
  owner.effects.length = 0;
  for (let j = 0; j < owner.cleanups.length; j++) {
    try {
      owner.cleanups[j]();
    } catch {
    }
  }
  owner.cleanups.length = 0;
}
function flushEffects() {
  if (_batchDepth > 0) return;
  if (_queuedEffects.size === 0) return;
  const q = Array.from(_queuedEffects);
  _queuedEffects.clear();
  for (let i = 0; i < q.length; i++) q[i]();
}
function scheduleEffect(eff) {
  if (_batchDepth > 0) {
    _queuedEffects.add(eff);
    return;
  }
  eff();
}
function batch(fn) {
  _batchDepth++;
  try {
    return fn();
  } finally {
    _batchDepth--;
    if (_batchDepth === 0) flushEffects();
  }
}
function onCleanup(fn) {
  if (_activeEffect) _activeEffect.cleanups.push(fn);
  if (_activeOwner) _activeOwner.cleanups.push(fn);
}
function createEffect(fn, owner) {
  function run() {
    cleanupEffect(run);
    const prevEffect = _activeEffect;
    const prevOwner = _activeOwner;
    _activeEffect = run;
    _activeOwner = owner || prevOwner || null;
    try {
      fn();
    } finally {
      _activeEffect = prevEffect;
      _activeOwner = prevOwner;
    }
  }
  run.deps = [];
  run.cleanups = [];
  run.owner = owner || null;
  run();
  return run;
}
function effect(fn) {
  const owner = _activeOwner;
  const eff = createEffect(fn, owner);
  if (owner) owner.effects.push(eff);
  return eff;
}
function signal(initial) {
  let value = initial;
  const subs = /* @__PURE__ */ new Set();
  function read() {
    if (_activeEffect) {
      subs.add(_activeEffect);
      _activeEffect.deps.push(subs);
    }
    return value;
  }
  read.set = function(next) {
    if (Object.is(value, next)) return;
    value = next;
    const effects = Array.from(subs);
    for (let i = 0; i < effects.length; i++) scheduleEffect(effects[i]);
    flushEffects();
  };
  return read;
}
function computed(fn) {
  const s = signal(void 0);
  effect(() => {
    s.set(fn());
  });
  return s;
}

// src/dom.js
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
    } catch {
    }
  }
  if (val == null) el.removeAttribute(key);
  else el.setAttribute(key, String(val));
}
function setAttrForced(el, key, val) {
  if (val == null || val === false) {
    el.removeAttribute(key);
    return;
  }
  if (val === true) {
    el.setAttribute(key, "");
    return;
  }
  if (typeof val === "function") {
    effect(() => setAttrForced(el, key, val()));
    return;
  }
  el.setAttribute(key, String(val));
}
function setPropForced(el, key, val) {
  if (typeof val === "function") {
    effect(() => {
      try {
        el[key] = val();
      } catch {
      }
    });
    return;
  }
  try {
    el[key] = val;
  } catch {
    if (val == null) el.removeAttribute(key);
    else el.setAttribute(key, String(val));
  }
}
function applySingleProp(el, k, v) {
  if (k === "ref" && typeof v === "function") {
    v(el);
    return;
  }
  if (k.slice(0, 2) === "on" && typeof v === "function") {
    el.addEventListener(k.slice(2).toLowerCase(), v);
    return;
  }
  if (typeof v === "function") {
    ((key, getter) => {
      effect(() => setProp(el, key, getter()));
    })(k, v);
    return;
  }
  setProp(el, k, v);
}
function applyProps(el, props) {
  for (const k in props) {
    const v = props[k];
    if (k === "attrs" && v && typeof v === "object") {
      for (const attrName in v) {
        setAttrForced(el, attrName, v[attrName]);
      }
      continue;
    }
    if (k === "props" && v && typeof v === "object") {
      for (const propName in v) {
        setPropForced(el, propName, v[propName]);
      }
      continue;
    }
    if (k === "on" && v && typeof v === "object") {
      for (const eventName in v) {
        const handler = v[eventName];
        if (typeof handler !== "function") continue;
        const normalized = eventName.slice(0, 2) === "on" ? eventName.slice(2).toLowerCase() : eventName.toLowerCase();
        el.addEventListener(normalized, handler);
      }
      continue;
    }
    applySingleProp(el, k, v);
  }
}
function appendChild(el, child) {
  if (child == null || child === false) return;
  if (Array.isArray(child)) {
    for (let i = 0; i < child.length; i++) appendChild(el, child[i]);
    return;
  }
  if (typeof child === "function") {
    let normalizeToNodes = function(v) {
      if (v == null || v === false) return [];
      if (Array.isArray(v)) {
        const out = [];
        for (let i = 0; i < v.length; i++) {
          const part = normalizeToNodes(v[i]);
          for (let j = 0; j < part.length; j++) out.push(part[j]);
        }
        return out;
      }
      if (v instanceof Node) return [v];
      if (typeof v === "string" || typeof v === "number") {
        return [document.createTextNode(String(v))];
      }
      return [document.createTextNode(String(v))];
    }, clearRange = function() {
      for (let i = 0; i < current.length; i++) {
        const n = current[i];
        if (n && n.parentNode) n.parentNode.removeChild(n);
      }
      current = [];
    }, insertAfterStart = function(nodes) {
      const parent = start.parentNode;
      if (!parent) return;
      let ref = end;
      for (let i = nodes.length - 1; i >= 0; i--) {
        parent.insertBefore(nodes[i], ref);
        ref = nodes[i];
      }
      current = nodes;
    };
    const start = document.createComment("z:expr");
    const end = document.createComment("z:/expr");
    el.appendChild(start);
    el.appendChild(end);
    let current = [];
    effect(() => {
      const v = child();
      const next = normalizeToNodes(v);
      if (next.length === current.length) {
        let same = true;
        for (let i = 0; i < next.length; i++) {
          if (next[i] !== current[i]) {
            same = false;
            break;
          }
        }
        if (same) return;
      }
      clearRange();
      insertAfterStart(next);
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
function h(target) {
  let el;
  if (typeof target === "string") {
    el = document.createElement(target);
  } else if (target instanceof Node) {
    el = target;
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
      "h(): first argument must be tagName|string, Node, or component function"
    );
  }
  for (let i = 1; i < arguments.length; i++) {
    const arg = arguments[i];
    if (isPlainObject(arg)) applyProps(el, arg);
    else appendChild(el, arg);
  }
  return el;
}
function tag(name) {
  return function() {
    const args = [name];
    for (let i = 0; i < arguments.length; i++) args.push(arguments[i]);
    return h.apply(null, args);
  };
}
function createTags() {
  const out = new Array(arguments.length);
  for (let i = 0; i < arguments.length; i++) {
    out[i] = tag(arguments[i]);
  }
  return out;
}
var tags = new Proxy(
  {},
  {
    get(_, name) {
      return tag(name);
    }
  }
);
function Show(when, render, fallback) {
  const anchor = document.createComment("show");
  let current = null;
  let trueNode = null;
  let falseNode = null;
  const attached = signal(false);
  let attachObs = null;
  effect(() => {
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
function For(listSignal, renderItem, keyFn) {
  keyFn = keyFn || function(item, idx) {
    if (item && typeof item === "object") {
      if ("id" in item) return item.id;
      if ("key" in item) return item.key;
      if ("_id" in item) return item._id;
    }
    return idx;
  };
  const host = document.createElement("span");
  host.setAttribute("data-for", "");
  const keyed = /* @__PURE__ */ new Map();
  const indexSignals = /* @__PURE__ */ new Map();
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
    const nextKeySet = new Set(nextKeys);
    for (let p = 0; p < prevKeys.length; p++) {
      const k = prevKeys[p];
      if (!nextKeySet.has(k)) {
        const oldNode = keyed.get(k);
        if (oldNode && oldNode.parentNode === host) host.removeChild(oldNode);
        keyed.delete(k);
        indexSignals.delete(k);
      }
    }
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

// src/css.js
function css(strings, ...values) {
  let out = "";
  for (let i = 0; i < strings.length; i++) {
    out += strings[i];
    if (i < values.length) out += String(values[i]);
  }
  return out;
}

// src/enhance.js
function enhance(root, setup) {
  if (!root) throw new Error("enhance(root, setup): root is required");
  if (typeof setup !== "function") throw new Error("enhance(root, setup): setup must be a function");
  const owner = __createOwner(null);
  const prevOwner = __getActiveOwner();
  __setActiveOwner(owner);
  try {
    setup(root);
  } finally {
    __setActiveOwner(prevOwner);
  }
  const obs = new MutationObserver(() => {
    if (!root.isConnected) {
      obs.disconnect();
      __cleanupOwner(owner);
    }
  });
  obs.observe(document, { childList: true, subtree: true });
  return function dispose() {
    obs.disconnect();
    __cleanupOwner(owner);
  };
}
function collectRefs(root) {
  const refs = /* @__PURE__ */ Object.create(null);
  const all = root.querySelectorAll("[data-ref]");
  for (const el of all) {
    const name = el.getAttribute("data-ref");
    if (!name) continue;
    if (refs[name] == null) {
      refs[name] = el;
    } else if (Array.isArray(refs[name])) {
      refs[name].push(el);
    } else {
      refs[name] = [refs[name], el];
    }
  }
  return refs;
}
function enhanceWithRefs(root, setup) {
  if (!root) throw new Error("enhanceWithRefs(root, setup): root is required");
  if (typeof setup !== "function") throw new Error("enhanceWithRefs(root, setup): setup must be a function");
  const refs = collectRefs(root);
  return enhance(root, () => setup({ root, refs }));
}
function mount(Component, container) {
  if (!container) throw new Error("mount(Component, container): container is required");
  if (typeof Component !== "function") throw new Error("mount(Component, container): Component must be a function");
  if (container.__ztoolsDispose) {
    try {
      container.__ztoolsDispose();
    } catch {
    }
    container.__ztoolsDispose = null;
  }
  const ownerDispose = enhance(container, (root) => {
    const node = Component();
    if (!(node instanceof Node)) throw new Error("mount(): Component must return a DOM Node");
    root.innerHTML = "";
    root.appendChild(node);
  });
  const dispose = function() {
    ownerDispose();
    container.innerHTML = "";
    if (container.__ztoolsDispose === dispose) container.__ztoolsDispose = null;
  };
  container.__ztoolsDispose = dispose;
  return dispose;
}

// src/wc.js
function defineComponent(name, Component, options) {
  options = options || {};
  const useShadow = options.shadow !== false;
  const mode = options.mode || "open";
  const observed = options.observedAttributes || [];
  const mapAttr = options.mapAttr || defaultMapAttr;
  const initialProps = options.props || {};
  class ZToolsElement extends HTMLElement {
    static get observedAttributes() {
      return observed;
    }
    constructor() {
      super();
      this.__dispose = null;
      this.__root = null;
      this.$ = {};
      for (let i = 0; i < observed.length; i++) {
        const k = observed[i];
        this.$[k] = signal(this.getAttribute(k));
      }
      this.attrs = {};
    }
    connectedCallback() {
      this.__root = useShadow ? this.attachShadow({ mode }) : this;
      this.attrs = readAllAttrs(this);
      const host = this;
      const props = {
        ...initialProps,
        attrs: host.attrs,
        $: host.$,
        setAttr(attrName, value) {
          if (value == null) host.removeAttribute(attrName);
          else host.setAttribute(attrName, String(value));
        },
        emit(type, detail, opts) {
          host.dispatchEvent(new CustomEvent(type, {
            detail,
            bubbles: true,
            composed: true,
            ...opts
          }));
        }
      };
      this.__dispose = mount(() => Component(props, host), this.__root);
    }
    disconnectedCallback() {
      if (this.__dispose) {
        this.__dispose();
        this.__dispose = null;
      }
    }
    attributeChangedCallback(name2, oldValue, newValue) {
      this.attrs = readAllAttrs(this);
      const s = this.$[name2];
      if (s) s.set(mapAttr(name2, newValue, oldValue));
      if (typeof options.onAttributeChanged === "function") {
        options.onAttributeChanged(this, name2, oldValue, newValue);
      }
    }
  }
  customElements.define(name, ZToolsElement);
  return ZToolsElement;
}
function readAllAttrs(el) {
  const out = {};
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    out[a.name] = a.value;
  }
  return out;
}
function defaultMapAttr(_name, newValue) {
  return newValue;
}
export {
  For,
  Show,
  __cleanupOwner,
  __createOwner,
  __getActiveOwner,
  __setActiveOwner,
  batch,
  computed,
  createTags,
  css,
  defineComponent,
  effect,
  enhance,
  enhanceWithRefs,
  h,
  mount,
  onCleanup,
  signal,
  tag,
  tags
};
