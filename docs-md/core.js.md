# core.js

Reactive core primitives.

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
