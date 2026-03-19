# ztools.ssr.js

SSR-only entry point.

## Import example

```js
import { h, tags, renderToString } from "@ztools.org/runtime/ztools.ssr.js";
```

## When to use

Use this entry in Node/build pipelines when you only need SSR helpers and no browser runtime.

Re-exports `./src/ssr.js`.

Use this on Node/server build steps to generate HTML with:
- `h`
- `tag` / `tags`
- `renderToString`
- `rawHtml`

## Examples

- [SSR page demo](./demo/ssr/)
- [SSR counter refs](./demo/ssr-counter-refs/)
- [Enhance refs table](./demo/enhance-refs/)

## Related APIs

- [`ssr.js`](./ssr.js.html)
- [`ztools.js`](./ztools.js.html)
- [`ztools.client.js`](./ztools.client.js.html)
