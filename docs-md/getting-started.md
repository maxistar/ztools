# Getting Started

A 5-minute path to your first reactive UI with ztools.

## 1) Create a Vite project

```bash
npm create vite@latest my-ztools-app -- --template vanilla
cd my-ztools-app
npm install
npm install @ztools.org/runtime
```

## 2) Replace `main.js` with a simple app

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

## 3) Run the project

```bash
npm run dev
```

Then open the local URL shown by Vite (usually `http://localhost:5173`).

## 4) Understand the core idea

- `signal()` stores reactive state
- `computed()` derives values from signals
- Functions in children/props (e.g. `() => count()`) re-render reactively
- `mount()` renders your component into the DOM

## 5) Next steps

- Read [Philosophy](./philosophy.html)
- Open [Examples](./demo/) and inspect source code
- Try `Show` and `For` for conditional and list rendering
