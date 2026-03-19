# enhance.js

Progressive enhancement helpers.

## Import example

```js
import { mount, enhance } from "@ztools.org/runtime";
```

## When to use

Use `enhance.js` when you already have DOM (SSR/static/server-rendered) and want to attach behavior without rebuilding markup.

## `mount(component, root)`

Mounts a component into a DOM root.
Returns a dispose function.

```js
import { signal, tags, mount } from "@ztools.org/runtime";

const { div, button } = tags;

function App() {
  const n = signal(0);
  return div(
    button({ onClick: () => n.set(n() + 1) }, "+1"),
    div(() => `Count: ${n()}`)
  );
}

const root = document.getElementById("app");
const dispose = mount(App, root);

// later
// dispose();
```

## `enhance(root, fn)`

Enhances already existing DOM nodes (SSR/static HTML upgrade scenario).

Use this when HTML is pre-rendered and you want to attach behavior/reactivity without full rerender.

`fn` receives `{ root, refs }`, where `refs` are collected from `[data-ref]` nodes.

```html
<div id="counter-basic">
  <button data-ref="dec">-1</button>
  <strong data-ref="value">0</strong>
  <button data-ref="inc">+1</button>
</div>
```

```js
import { signal, effect, enhance } from "@ztools.org/runtime";

enhance(document.getElementById("counter-basic"), ({ refs }) => {
  const count = signal(Number(refs.value.textContent || 0));

  refs.inc.addEventListener("click", () => count.set(count() + 1));
  refs.dec.addEventListener("click", () => count.set(count() - 1));

  effect(() => {
    refs.value.textContent = String(count());
  });
});
```

## `enhanceWithRefs(root, fn)`

Legacy alias for `enhance(root, fn)`.
Prefer `enhance` in new code.
If multiple elements share the same `data-ref`, `refs[name]` becomes an array.

## Examples

- [SSR counter with refs](./demo/ssr-counter-refs/)
- [SSR table + refs + sorting/filtering](./demo/enhance-refs/)

## Related APIs

- [`dom.js`](./dom.js.html)
- [`core.js`](./core.js.html)
- [`ssr.js`](./ssr.js.html)
