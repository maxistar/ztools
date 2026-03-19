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

```js
const node = h("h1", null, "Hello SSR");
```

## `tag(name)` / `tags`

Tag helpers for SSR trees.

```js
const { html, head, body, h1, p } = tags;

const page = html(
  head(),
  body(
    h1("ztools SSR"),
    p("Generated on server/build step")
  )
);
```

## `renderToString(node)`

Renders SSR tree to HTML string.

```js
const htmlText = "<!doctype html>\n" + renderToString(page);
```

## `rawHtml(html)`

Injects trusted raw HTML without escaping.
Use carefully (only trusted content).

```js
const page = h("div", null,
  h("h2", null, "Embed trusted snippet"),
  rawHtml("<p><strong>Trusted HTML</strong> injected as-is.</p>")
);
```


## Examples

- [SSR page demo](./demo/ssr/)
- [SSR counter → enhance](./demo/ssr-counter-refs/)
- [SSR table → enhance with refs](./demo/enhance-refs/)

## Related APIs

- [`core.js`](./core.js.html)
- [`dom.js`](./dom.js.html)
- [`ztools.ssr.js`](./ztools.ssr.js.html)
