# css.js

Optional helper for CSS template literals.

## Import example

```js
import { css } from "@ztools.org/runtime/client";
```

## When to use

Use `css` only as optional sugar when composing style text in component files.
In most cases, plain template strings are enough.

## `css\`...\``

Concatenates template strings/values into one CSS string.

> Note: this is mostly equivalent to a plain template string. It exists as optional semantic sugar and future extension point.

```js
const base = "#0b57d0";

const styles = css`
  .btn {
    border: 1px solid ${base};
    color: ${base};
    padding: 8px 12px;
    border-radius: 8px;
  }
`;
```

### Typical usage with `t.style(...)`

```js
import { tags as t, css } from "@ztools.org/runtime/client";

const node = t.div(
  t.style(css`
    .card { border: 1px solid #ddd; border-radius: 10px; padding: 12px; }
  `),
  t.div({ className: "card" }, "Hello")
);
```

## Examples

- [Contacts table Web Component](./demo/contacts-table/)
- [Color picker](./demo/color-picker/)
- [Sketch](./demo/sketch/)

## Related APIs

- [`wc.js`](./wc.js.html)
- [`dom.js`](./dom.js.html)
- [`ztools.client.js`](./ztools.client.js.html)
