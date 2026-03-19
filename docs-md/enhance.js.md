# enhance.js

Progressive enhancement helpers.

## Import example

```js
import { mount, enhance, enhanceWithRefs } from "@ztools.org/runtime";
```

## When to use

Use `enhance.js` when you already have DOM (SSR/static/server-rendered) and want to attach behavior without rebuilding markup.

## `mount(component, root)`

Mounts a component into a DOM root.
Returns a dispose function.

```js
import { signal, createTags, mount } from "@ztools.org/runtime";

const [div, button] = createTags("div", "button");

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

## `enhanceWithRefs(root, fn)`

Like `enhance`, but also collects `[data-ref]` nodes and passes them to setup as `{ refs }`.
If multiple elements share the same `data-ref`, `refs[name]` becomes an array.

```html
<div id="counter" data-ref="root">
  <button data-ref="inc">+1</button>
  <strong data-ref="value">0</strong>
</div>
```

```js
import { signal, effect, enhanceWithRefs } from "@ztools.org/runtime";

enhanceWithRefs(document.getElementById("counter"), ({ refs }) => {
  const count = signal(Number(refs.value.textContent || 0));

  refs.inc.addEventListener("click", () => count.set(count() + 1));

  effect(() => {
    refs.value.textContent = String(count());
  });
});
```

## Examples

- [SSR counter with refs](./demo/ssr-counter-refs/)
- [SSR table + refs + sorting/filtering](./demo/enhance-refs/)

## Related APIs

- [`dom.js`](./dom.js.html)
- [`core.js`](./core.js.html)
- [`ssr.js`](./ssr.js.html)
