# dom.js

DOM-first rendering primitives.

## Import example

```js
import { h, tag, createTags, tags, Show, If, For } from "@ztools.org/runtime";
```

## When to use

Use `dom.js` when building client-side UI directly with DOM nodes and reactive values.

## `h(target, ...args)`

Universal node factory:
- string tag name
- existing `Node` (enhance)
- component function

```js
const node = h("button", { onClick: () => console.log("click") }, "Save");
document.body.appendChild(node);
```

## `tag(name)` and `createTags(...names)`

Tag factory helpers.

```js
const div = tag("div");
const [p, button] = createTags("p", "button");

const ui = div(
  p("Hello"),
  button({ onClick: () => alert("Hi") }, "Click")
);
```

## `tags`

Dual-mode API:
- Proxy getters: `tags.div(...)`
- Callable factory: `tags("div", "a")` → `{ div, a }`

```js
const { section, h2, ul, li } = tags;

const block = section(
  h2("Items"),
  ul(li("A"), li("B"), li("C"))
);

const t = tags("div", "a");
const link = t.div(t.a({ href: "#" }, "Open"));
```

## Props model

Supports legacy and explicit channels:

```js
div({
  attrs: { "data-id": "123" },
  props: { textContent: "hello" },
  on: { click: () => {} },
  onChange: () => {}
});
```

## `Show(when, render, fallback?)`

Conditional branch rendering.

`If` is provided as an alias for `Show`.

```js
const visible = signal(true);

const view = Show(
  () => visible(),
  () => div("Visible content"),
  () => div("Hidden content")
);

// same behavior:
const view2 = If(
  () => visible(),
  () => div("Visible content"),
  () => div("Hidden content")
);
```

## `For(listSignal, renderItem, keyFn?)`

Keyed list rendering with efficient node reuse/reorder.

```js
const rows = signal([
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" }
]);

const listNode = For(
  rows,
  (row) => li(() => row.name),
  (row) => row.id
);
```


## Examples

- [DOM-first table](./demo/table/)
- [For + If](./demo/for-if/)
- [Tabs](./demo/tabs/)
- [Todo list](./demo/todo/)

## Related APIs

- [`core.js`](./core.js.html)
- [`enhance.js`](./enhance.js.html)
- [`wc.js`](./wc.js.html)
