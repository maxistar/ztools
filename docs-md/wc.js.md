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

## Minimal example

```js
import { defineComponent, tags as t } from "@ztools.org/runtime/ztools.client.js";

defineComponent("x-hello", (props) => {
  return t.div(
    t.strong("Hello, "),
    () => props.$["name"]() || "world"
  );
}, {
  shadow: true,
  observedAttributes: ["name"]
});
```

```html
<x-hello name="Max"></x-hello>
```

## Event example (`props.emit`)

```js
defineComponent("x-counter", (props) => {
  let value = Number(props.$["value"]() || 0);

  return t.button({
    onClick: () => {
      value += 1;
      props.setAttr("value", String(value));
      props.emit("change", { value });
    }
  }, () => `Count: ${props.$["value"]() || 0}`);
}, {
  shadow: true,
  observedAttributes: ["value"]
});
```

```js
document.querySelector("x-counter")
  .addEventListener("change", (e) => {
    console.log("new value", e.detail.value);
  });
```

## Examples

- [Contacts table Web Component](./demo/contacts-table/)
- [Donut chart Web Component](./demo/donutchart-wc/)
- [Color picker component demo](./demo/color-picker/)

## Related APIs

- [`dom.js`](./dom.js.html)
- [`core.js`](./core.js.html)
- [`ztools.client.js`](./ztools.client.js.html)
