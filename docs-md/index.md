# ztools

**Zero-dependencies reactive runtime**

DOM-first. AI-ready. No framework.

## Features

- Fine-grained reactivity with `signal`, `computed`, `effect`, and `batch`
- DOM-first rendering via `h`, `tag`, `createTags`, and dynamic `tags` proxy
- Declarative conditional/list rendering with `Show` and keyed `For`
- Component mount and progressive enhancement with `mount` and `enhance`
- Server-side rendering with `ztools.ssr.js` and `renderToString`
- Web Components support via `defineComponent` (`wc.js`)
- SVG-friendly rendering (custom SVG elements + reactive attributes)
- Zero runtime dependencies in the browser + optional full standalone bundles (`ztools.client.full.js` ≈ 16.3 KB, `ztools.ssr.full.js` ≈ 2.9 KB — honest raw size, uncompressed, not minified)

## Install

```bash
npm install @ztools.org/runtime
```

## Quick start

```js
import { signal, computed, createTags, mount } from "@ztools.org/runtime";

const [div, p, button] = createTags("div", "p", "button");

function App() {
  const count = signal(0);
  const doubled = computed(() => count() * 2);

  return div(
    p("count: ", () => count(), " x2=", () => doubled()),
    button({ onClick: () => count.set(count() + 1) }, "+1")
  );
}

mount(App, document.body);
```

## API

- `signal`, `effect`, `computed`, `batch`, `onCleanup`
- `h`, `tag`, `createTags`, `tags`
- `Show`, `For`
- `mount`, `enhance`

## Examples

Examples are published here: [/demo/](./demo/)

## Source

[github.com/maxistar/ztools](https://github.com/maxistar/ztools)
