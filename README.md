# ztools

Tiny JavaScript-first reactive UI runtime (no virtual DOM, no compile step).

## Features

- Reactive primitives: `signal`, `effect`, `computed`, `batch`, `onCleanup`
- DOM helpers: `h`, `tag`, `createTags`
- Control flow: `Show`, `For` (keyed)
- App mounting: `mount(Component, container)` with cleanup

## Install

```bash
npm install ztools
```

## Quick start

```js
import { signal, computed, createTags, Show, For, mount } from "ztools";

const [div, h1, p, button] = createTags("div", "h1", "p", "button");

function App() {
  const count = signal(0);
  const doubled = computed(() => count() * 2);
  const items = signal([{ id: 1, title: "A" }, { id: 2, title: "B" }]);

  return div(
    h1("ztools demo"),
    p("count: ", () => count(), " x2=", () => doubled()),
    button({ onClick: () => count.set(count() + 1) }, "+1"),
    Show(() => count() % 2 === 0, () => div("even"), () => div("odd")),
    For(items, (it, idx) => div(() => `${idx() + 1}. ${it.title}`), (it) => it.id)
  );
}

mount(App, document.body);
```

## API

### Reactivity
- `signal(initial)` -> getter function with `.set(next)`
- `effect(fn)` -> runs reactively when signal dependencies change
- `computed(fn)` -> derived signal
- `batch(fn)` -> coalesce updates
- `onCleanup(fn)` -> register cleanup in current effect/owner

### DOM
- `h(tag, ...args)` -> create element
- `tag(name)` / `createTags(...names)` -> ergonomic tag factories

### Control flow
- `Show(when, render, fallback?)`
- `For(listSignal, renderItem, keyFn?)`

### Mounting
- `mount(Component, container)` -> returns `dispose()`

## Development

```bash
npm install
npm test
```

Demos are in `demo/`.
