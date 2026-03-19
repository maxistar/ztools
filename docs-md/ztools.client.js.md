# ztools.client.js

Client-oriented entry point.

## Import example

```js
import { signal, tags, defineComponent, css } from "@ztools.org/runtime/client";
```

## When to use

Use this entry when you need client-side extras (`wc.js`, `css.js`) in addition to core/dom helpers.

Re-exports:
- `core.js`
- `dom.js`
- `css.js`
- `enhance.js`
- `wc.js`

## Examples

- [Contacts table (wc + css)](./demo/contacts-table/)
- [Donut chart Web Component](./demo/donutchart-wc/)
- [SSR counter refs (enhance)](./demo/ssr-counter-refs/)

## Related APIs

- [`core.js`](./core.js.html)
- [`dom.js`](./dom.js.html)
- [`wc.js`](./wc.js.html)
- [`css.js`](./css.js.html)
- [`ztools.js`](./ztools.js.html)
