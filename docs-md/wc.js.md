# wc.js

Web Components adapter.

## Import example

```js
import { defineComponent } from "@ztools.org/runtime/ztools.client.js";
```

## When to use

Use `wc.js` when you want framework-agnostic custom elements with reactive internals and plain HTML usage.

## `defineComponent(name, Component, options?)`

Defines a custom element and mounts ztools content inside it.

Component receives:
- `props.attrs` — current attributes snapshot
- `props.$` — reactive attribute signals (for observed attrs)
- `props.setAttr(name, value)`
- `props.emit(type, detail, opts?)`

Common options:
- `shadow` (default true)
- `mode` (`open`/`closed`)
- `observedAttributes`
- `mapAttr`

## Related APIs

- [`dom.js`](./dom.js.html)
- [`core.js`](./core.js.html)
- [`ztools.client.js`](./ztools.client.js.html)
