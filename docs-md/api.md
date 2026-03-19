# API

API entry page for sub-pages.

## Core runtime files

- [`core.js`](./core.js.html) — reactive primitives: `signal`, `computed`, `effect`, `batch`, `onCleanup`
- [`dom.js`](./dom.js.html) — DOM builder, props/attrs/events, `Show`, `For`
- [`enhance.js`](./enhance.js.html) — progressive enhancement and mounting helpers

## Platform files

- [`ssr.js`](./ssr.js.html) — server-side rendering helpers (`h`, `tags`, `renderToString`, `rawHtml`)
- [`wc.js`](./wc.js.html) — Web Components adapter (`defineComponent`)
- [`css.js`](./css.js.html) — optional css template helper

## Entry points

- [`ztools.js`](./ztools.js.html) — default exports
- [`ztools.client.js`](./ztools.client.js.html) — client-oriented entry
- [`ztools.ssr.js`](./ztools.ssr.js.html) — SSR-only entry
