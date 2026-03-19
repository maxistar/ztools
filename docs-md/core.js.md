# core.js

Reactive core primitives.

## Import example

```js
import { signal, computed, effect, batch, onCleanup } from "@ztools.org/runtime";
```

## When to use

Use `core.js` primitives whenever you need state, derivations, and reactive effects independent of rendering strategy.

## `signal(initialValue)`

Creates reactive state:

```js
const count = signal(0);
count();      // read
count.set(1); // write
```

## `computed(fn)`

Derived value based on signals.

```js
const doubled = computed(() => count() * 2);
```

## `effect(fn)`

Runs immediately and re-runs when tracked signals change.

## `batch(fn)`

Batches multiple writes into one flush.

## `onCleanup(fn)`

Registers effect cleanup callback.

## Related APIs

- [`dom.js`](./dom.js.html)
- [`enhance.js`](./enhance.js.html)
- [`ssr.js`](./ssr.js.html)
