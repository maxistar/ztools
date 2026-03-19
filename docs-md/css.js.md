# css.js

Tiny helper for css template literals.

## Import example

```js
import { css } from "@ztools.org/runtime/ztools.client.js";
```

## When to use

Use `css` when composing style text in component files (especially together with `t.style(...)`).

## `css\`...\``

Concatenates template strings/values into one CSS string.
Often used with `t.style(css\`...\`)` in components.

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
import { tags as t, css } from "@ztools.org/runtime/ztools.client.js";

const node = t.div(
  t.style(css`
    .card { border: 1px solid #ddd; border-radius: 10px; padding: 12px; }
  `),
  t.div({ className: "card" }, "Hello")
);
```

## Related APIs

- [`wc.js`](./wc.js.html)
- [`dom.js`](./dom.js.html)
- [`ztools.client.js`](./ztools.client.js.html)
