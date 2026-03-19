# Getting Started

A 5-minute path to your first reactive UI with ztools.

## 1) Install

```bash
npm install @ztools.org/runtime
```

## 2) Create a simple app

```js
import { signal, computed, createTags, mount } from "@ztools.org/runtime";

const [div, p, button] = createTags("div", "p", "button");

function App() {
  const count = signal(0);
  const doubled = computed(() => count() * 2);

  return div(
    p("count: ", () => count(), " | doubled: ", () => doubled()),
    button({ onClick: () => count.set(count() + 1) }, "Increment")
  );
}

mount(App, document.getElementById("app"));
```

## 3) Understand the core idea

- `signal()` stores reactive state
- `computed()` derives values from signals
- Functions in children/props (e.g. `() => count()`) re-render reactively
- `mount()` renders your component into the DOM

## 4) Next steps

- Read [Philosophy](./philosophy.html)
- Open [Examples](./demo/) and inspect source code
- Try `Show` and `For` for conditional and list rendering
