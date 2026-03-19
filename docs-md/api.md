# API Reference

Complete quick reference for the core runtime.

## Reactive core

### `signal(initialValue)`

Creates a reactive signal function.

```js
const count = signal(0);
count();      // read
count.set(1); // write
```

### `computed(fn)`

Creates a derived reactive value based on other signals.

```js
const doubled = computed(() => count() * 2);
```

### `effect(fn)`

Runs `fn` immediately and re-runs when accessed signals change.

```js
effect(() => {
  console.log("count:", count());
});
```

### `batch(fn)`

Groups multiple writes into one reactive flush.

```js
batch(() => {
  a.set(1);
  b.set(2);
});
```

### `onCleanup(fn)`

Registers cleanup logic for the current effect scope.

---

## DOM builder

### `h(target, ...args)`

Universal DOM factory:
- tag name string (`"div"`)
- existing `Node` (enhance mode)
- component function

### `tag(name)`

Returns a tag factory function.

```js
const div = tag("div");
```

### `createTags(...names)`

Returns array of tag factories.

```js
const [div, button] = createTags("div", "button");
```

### `tags`

Proxy-based dynamic tag factory.

```js
const { div, button } = tags;
```

### Explicit prop channels

You can separate attrs/props/events explicitly:

```js
div({
  attrs: { "data-id": "123" },
  props: { textContent: "Hello" },
  on: { click: () => console.log("click") }
});
```

Legacy syntax still works (`onClick`, `className`, `style`, etc.).

---

## Render helpers

### `Show(when, render, fallback?)`

Conditional rendering helper.

```js
Show(
  () => visible(),
  () => div("Visible"),
  () => div("Hidden")
)
```

### `For(listSignal, renderItem, keyFn?)`

Keyed list renderer with efficient DOM reuse/reorder.

```js
For(items, (item) => li(item.title), (item) => item.id)
```

---

## Mount / enhance

### `mount(component, root)`

Mounts a component into a DOM node.
Returns a dispose function.

```js
const dispose = mount(App, document.body);
```

### `enhance(root, fn)`

Enhances server-rendered or pre-existing DOM.

---

## SSR API (`ztools.ssr.js`)

### `h(tag, props?, ...children)`

Creates an SSR node object.

### `renderToString(node)`

Renders SSR node tree to HTML string.

### `tag(name)` / `tags`

SSR tag helpers.

### `rawHtml(htmlString)`

Inject trusted raw HTML without escaping.
Use carefully.

---

## Client extras

### `css` (from `src/css.js`)

Template literal helper for style text.

### `defineComponent(name, Component, options?)` (from `src/wc.js`)

Web Components adapter with reactive attrs and helper API.

---

## Bundle entry points

- `ztools.js` — default runtime exports
- `ztools.client.js` — client-oriented exports (`wc`, `css`, DOM/reactive)
- `ztools.ssr.js` — SSR-only exports
- `dist/ztools.client.full.js` — full standalone browser bundle
- `dist/ztools.ssr.full.js` — full standalone SSR bundle
