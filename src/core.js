// src/core.js
// Tiny reactivity core: signal/effect/computed/batch + owner cleanup

let _activeEffect = null;
let _activeOwner = null;

let _batchDepth = 0;
const _queuedEffects = new Set();

export function __getActiveOwner() { return _activeOwner; }
export function __setActiveOwner(o) { _activeOwner = o; }

export function __createOwner(parent) {
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

export function __cleanupOwner(owner) {
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
      _activeEffect = prevEffect; // ✅ restore previous
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

    // ✅ snapshot subscribers before notifying
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