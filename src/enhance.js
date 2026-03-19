// src/enhance.js
// DOM-first lifecycle:
// - enhance(root, setup): do NOT clear DOM, just attach effects/handlers under an owner
// - mount(Component, container): implemented via enhance (clear + append)

import { __createOwner, __cleanupOwner, __getActiveOwner, __setActiveOwner } from "./core.js";

export function enhance(root, setup) {
  if (!root) throw new Error("enhance(root, setup): root is required");
  if (typeof setup !== "function") throw new Error("enhance(root, setup): setup must be a function");

  const refs = collectRefs(root);
  const owner = __createOwner(null);

  const prevOwner = __getActiveOwner();
  __setActiveOwner(owner);
  try {
    setup({ root, refs });
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

function addRef(refs, name, el) {
  if (refs[name] == null) {
    refs[name] = el;
  } else if (Array.isArray(refs[name])) {
    refs[name].push(el);
  } else {
    refs[name] = [refs[name], el];
  }
}

function collectRefs(root) {
  const refs = Object.create(null);

  if (root.hasAttribute && root.hasAttribute("data-ref")) {
    const n = root.getAttribute("data-ref");
    if (n) addRef(refs, n, root);
  }

  const all = root.querySelectorAll("[data-ref]");

  for (const el of all) {
    const name = el.getAttribute("data-ref");
    if (!name) continue;
    addRef(refs, name, el);
  }

  return refs;
}

export const enhanceWithRefs = enhance;

export function mount(Component, container) {
  if (!container) throw new Error("mount(Component, container): container is required");
  if (typeof Component !== "function") throw new Error("mount(Component, container): Component must be a function");

  // dispose previous mount on same container
  if (container.__ztoolsDispose) {
    try { container.__ztoolsDispose(); } catch {}
    container.__ztoolsDispose = null;
  }

  const ownerDispose = enhance(container, ({ root }) => {
    const node = Component();
    if (!(node instanceof Node)) throw new Error("mount(): Component must return a DOM Node");

    root.innerHTML = "";
    root.appendChild(node);
  });

  const dispose = function () {
    ownerDispose();
    container.innerHTML = "";
    if (container.__ztoolsDispose === dispose) container.__ztoolsDispose = null;
  };

  container.__ztoolsDispose = dispose;
  return dispose;
}
