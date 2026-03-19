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

## Related APIs

- [`wc.js`](./wc.js.html)
- [`dom.js`](./dom.js.html)
- [`ztools.client.js`](./ztools.client.js.html)
