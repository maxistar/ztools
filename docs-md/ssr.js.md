# ssr.js

Server-side rendering utilities.

## Import example

```js
import { h, tags, renderToString, rawHtml } from "@ztools.org/runtime/ztools.ssr.js";
```

## When to use

Use `ssr.js` in Node/server build steps to produce deterministic HTML strings before shipping pages.

## `h(tag, props?, ...children)`

Creates SSR node objects.

## `tag(name)` / `tags`

Tag helpers for SSR trees.

## `renderToString(node)`

Renders SSR tree to HTML string.

## `rawHtml(html)`

Injects trusted raw HTML without escaping.
Use carefully (only trusted content).

## Related APIs

- [`core.js`](./core.js.html)
- [`dom.js`](./dom.js.html)
- [`ztools.ssr.js`](./ztools.ssr.js.html)
