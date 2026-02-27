/* ztools.js (ESM)
 * Tiny JS-first UI runtime: signals + DOM builders (no globals)
 *
 * Features:
 * - signal, effect, computed, batch
 * - onCleanup (effect + owner)
 * - h(), tag()
 * - Show(), For() (keyed)
 * - mount()
 *
 * Fixes included:
 * - restore previous _activeEffect for nested effects
 * - snapshot subscribers before notifying
 */

// =========================
// Reactive core (signals)
// =========================
let _activeEffect = null;
let _activeOwner = null;

let _batchDepth = 0;
const _queuedEffects = new Set();

function createOwner(parent) {
  return { parent: parent || null, effects: [], cleanups: [] };
}

function cleanupEffect(eff) {
  // unsubscribe from deps
  const deps = eff.deps;
  for (let i = 0; i < deps.length; i++) deps[i].delete(eff);
  deps.length = 0;

  // effect-local cleanups
  const cs = eff.cleanups;
  for (let j = 0; j < cs.length; j++) {
    try { cs[j](); } catch {}
  }
  cs.length = 0;
}

function cleanupOwner(owner) {
  if (!owner) return;

  for (let i = 0; i < owner.effects.length; i++) cleanupEffect(owner.effects[i]);
  owner.effects.length = 0;

  for (let j = 0; j < owner.cleanups.length; j++) {
    try { owner.cleanups[j](); } catch {}
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

export function batch(fn) {
  _batchDepth++;
  try { return fn(); }
  finally {
    _batchDepth--;
    if (_batchDepth === 0) flushEffects();
  }
}

export function onCleanup(fn) {
  if (_activeEffect) _activeEffect.cleanups.push(fn);
  if (_activeOwner) _activeOwner.cleanups.push(fn);
}

function createEffect(fn, owner) {
  function run() {
    cleanupEffect(run);

    const prevEffect = _activeEffect; // ✅ nested effects safe
    const prevOwner = _activeOwner;

    _activeEffect = run;
    _activeOwner = owner || prevOwner || null;

    try { fn(); }
    finally {
      _activeEffect = prevEffect;     // ✅ restore previous
      _activeOwner = prevOwner;
    }
  }

  run.deps = [];
  run.cleanups = [];
  run.owner = owner || null;

  run();
  return run;
}

export function effect(fn) {
  const owner = _activeOwner;
  const eff = createEffect(fn, owner);
  if (owner) owner.effects.push(eff);
  return eff;
}

export function signal(initial) {
  let value = initial;
  const subs = new Set();

  function read() {
    if (_activeEffect) {
      subs.add(_activeEffect);
      _activeEffect.deps.push(subs);
    }
    return value;
  }

  read.set = function (next) {
    if (Object.is(value, next)) return;
    value = next;

    // ✅ snapshot subscribers before notifying (stable iteration)
    const effects = Array.from(subs);
    for (let i = 0; i < effects.length; i++) scheduleEffect(effects[i]);

    flushEffects();
  };

  return read;
}

export function computed(fn) {
  const s = signal(undefined);
  effect(() => { s.set(fn()); });
  return s;
}

// =========================
// DOM builder (h/tag)
// =========================
function isPlainObject(x) {
  if (!x || typeof x !== "object") return false;
  if (x instanceof Node) return false;
  if (Array.isArray(x)) return false;
  return Object.getPrototypeOf(x) === Object.prototype;
}

function setProp(el, key, val) {
  if (key === "className") { el.className = val || ""; return; }
  if (key === "textContent") { el.textContent = val == null ? "" : String(val); return; }

  if (key === "style" && val && typeof val === "object") {
    for (const s in val) el.style[s] = val[s];
    return;
  }

  if (typeof val === "boolean") {
    if (val) el.setAttribute(key, "");
    else el.removeAttribute(key);
    return;
  }

  // Prefer DOM property when available
  if (key in el) {
    try { el[key] = val; return; } catch {}
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

    // onClick / onInput / ...
    if (k.slice(0, 2) === "on" && typeof v === "function") {
      el.addEventListener(k.slice(2).toLowerCase(), v);
      continue;
    }

    // reactive prop/attr: { value: () => ... }
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

export function h(tag /* ...args */) {
  const el = document.createElement(tag);

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

export function createTags(...tagNames) {
  return tagNames.map((tagName) => tag(tagName));
}

// =========================
// Control flow: Show, For
// =========================

// Show(when, render, fallback?)
// - lazy: caches both branches, preserving DOM state
export function Show(when, render, fallback) {
  const anchor = document.createComment("show");
  let current = null;
  let trueNode = null;
  let falseNode = null;

  effect(() => {
    const cond = (typeof when === "function") ? when() : when;
    const parent = anchor.parentNode;
    if (!parent) return;

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

// For(listSignal, renderItem, keyFn?)
// - keyed diff + reorder via insertBefore from the end
// - renderItem(item, indexSignalGetter) => Node
export function For(listSignal, renderItem, keyFn) {
  keyFn = keyFn || function (item, idx) {
    if (item && typeof item === "object") {
      if ("id" in item) return item.id;
      if ("key" in item) return item.key;
      if ("_id" in item) return item._id;
    }
    return idx; // fallback (unsafe for reorder)
  };

  const host = document.createElement("span");
  host.setAttribute("data-for", "");

  const keyed = new Map();        // key -> Node
  const indexSignals = new Map(); // key -> signal(index)
  let prevKeys = [];

  effect(() => {
    const items = listSignal() || [];
    const nextKeys = new Array(items.length);

    // Build / reuse nodes
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let key = keyFn(item, i);
      if (key == null) throw new Error("For(): key is null/undefined at index " + i);
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
        if (!(node instanceof Node)) throw new Error("For(): renderItem must return a DOM Node");
        keyed.set(key, node);
      }
    }

    // Remove missing
    for (let p = 0; p < prevKeys.length; p++) {
      const k = prevKeys[p];
      if (nextKeys.indexOf(k) === -1) {
        const oldNode = keyed.get(k);
        if (oldNode && oldNode.parentNode === host) host.removeChild(oldNode);
        keyed.delete(k);
        indexSignals.delete(k);
      }
    }

    // Reorder/insert with a single pass from the end
    let anchor = null; // node to insert before
    for (let j = nextKeys.length - 1; j >= 0; j--) {
      const nodeJ = keyed.get(nextKeys[j]);

      if (anchor === null) {
        if (nodeJ.parentNode !== host || nodeJ.nextSibling !== null) host.appendChild(nodeJ);
      } else {
        if (nodeJ.parentNode !== host || nodeJ.nextSibling !== anchor) host.insertBefore(nodeJ, anchor);
      }
      anchor = nodeJ;
    }

    prevKeys = nextKeys;
  });

  return host;
}

// =========================
// mount()
// =========================
export function mount(Component, container) {
  if (!container) throw new Error("mount(Component, container): container is required");

  // cleanup previous mount on this container
  if (container.__ztoolsOwner) {
    cleanupOwner(container.__ztoolsOwner);
    container.__ztoolsOwner = null;
  }

  const owner = createOwner(null);
  container.__ztoolsOwner = owner;

  const prevOwner = _activeOwner;
  _activeOwner = owner;

  let node;
  try {
    node = Component();
    if (!(node instanceof Node)) {
      throw new Error("mount(): Component must return a DOM Node");
    }
  } finally {
    _activeOwner = prevOwner;
  }

  container.innerHTML = "";
  container.appendChild(node);

  // auto-dispose when container removed from DOM
  const obs = new MutationObserver(() => {
    if (!container.isConnected) {
      obs.disconnect();
      cleanupOwner(owner);
    }
  });
  obs.observe(document, { childList: true, subtree: true });

  return function dispose() {
    obs.disconnect();
    cleanupOwner(owner);
    if (container.isConnected) container.innerHTML = "";
    if (container.__ztoolsOwner === owner) container.__ztoolsOwner = null;
  };
}

/* =========================
Quick usage example:

import { signal, tag, mount, Show, For, computed } from "./ztools.js";

const div = tag("div"), h1 = tag("h1"), p = tag("p"), button = tag("button");

function App(){
  const count = signal(0);
  const doubled = computed(() => count() * 2);
  const show = computed(() => count() % 2 === 0);
  const items = signal([{id:1,title:"A"},{id:2,title:"B"}]);

  return div(
    h1("ztools demo"),
    p("count: ", () => count(), " (x2=", () => doubled(), ")"),
    button({ onClick: () => count.set(count() + 1) }, "+1"),
    Show(show, () => div("even"), () => div("odd")),
    For(items, (it, idx) => div(() => (idx()+1)+". "+it.title))
  );
}

mount(App, document.body);

========================= */
