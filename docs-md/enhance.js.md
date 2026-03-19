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

```html
<div id="counter">
  <button id="inc">+1</button>
  <strong id="value">0</strong>
</div>
```

```js
import { signal, effect, enhance } from "@ztools.org/runtime";

enhance(document.getElementById("counter"), (root) => {
  const valueEl = root.querySelector("#value");
  const incBtn = root.querySelector("#inc");
  const count = signal(Number(valueEl.textContent || 0));

  incBtn.addEventListener("click", () => count.set(count() + 1));
  effect(() => {
    valueEl.textContent = String(count());
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
