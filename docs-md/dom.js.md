# dom.js

DOM-first rendering primitives.

## `h(target, ...args)`

Universal node factory:
- string tag name
- existing `Node` (enhance)
- component function

## `tag(name)` and `createTags(...names)`

Tag factory helpers.

## `tags`

Proxy-based dynamic tag creators.

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

## `For(listSignal, renderItem, keyFn?)`

Keyed list rendering with efficient node reuse/reorder.
