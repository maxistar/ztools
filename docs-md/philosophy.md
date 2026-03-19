# Philosophy

What ztools is trying to optimize for.

```js
import { signal, tags, mount } from "@ztools.org/runtime";

const { div, button } = tags;

function App() {
  const count = signal(0);

  return div(
    div(() => `Count: ${count()}`),
    button({ onClick: () => count.set(count() + 1) }, "+1")
  );
}

mount(App, document.body);
```

## 1) Reactivity should not be hard

We believe reactivity should be approachable. If a framework requires weeks of study before you can build simple interfaces, it may be solving the wrong problem for many teams.

## 2) Learn in minutes, not weeks

The core idea behind ztools is that a developer should be able to understand the mental model in minutes, not weeks, and start applying it right away.

## 3) Simple primitives, practical results

ztools intentionally focuses on a small API surface: signals, effects, and straightforward DOM helpers. Small building blocks are easier to reason about, test, and maintain.

## See more

- [Getting Started](./getting-started.html)
- [API](./api.html)
- [Examples](./demo/)
