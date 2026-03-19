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

## `enhance(root, fn)`

Enhances already existing DOM nodes (SSR/static HTML upgrade scenario).

Use this when HTML is pre-rendered and you want to attach behavior/reactivity without full rerender.

## Related APIs

- [`dom.js`](./dom.js.html)
- [`core.js`](./core.js.html)
- [`ssr.js`](./ssr.js.html)
