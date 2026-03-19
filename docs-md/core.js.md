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

```js
const count = signal(0);

effect(() => {
  console.log("count changed:", count());
});

count.set(1); // triggers effect again
```

## `batch(fn)`

Batches multiple writes into one flush.

```js
const a = signal(0);
const b = signal(0);

let runs = 0;
effect(() => {
  // both tracked in one effect
  a();
  b();
  runs++;
});

batch(() => {
  a.set(1);
  b.set(2);
});

// `runs` increments once for the batched update,
// not once per .set()
```

## `onCleanup(fn)`

Registers effect cleanup callback.

```js
const enabled = signal(true);

effect(() => {
  if (!enabled()) return;

  const id = setInterval(() => {
    console.log("tick");
  }, 1000);

  onCleanup(() => clearInterval(id));
});

enabled.set(false); // interval is cleaned up
```

## Related APIs

- [`dom.js`](./dom.js.html)
- [`enhance.js`](./enhance.js.html)
- [`ssr.js`](./ssr.js.html)
