# ssr.js

Server-side rendering utilities.

## `h(tag, props?, ...children)`

Creates SSR node objects.

## `tag(name)` / `tags`

Tag helpers for SSR trees.

## `renderToString(node)`

Renders SSR tree to HTML string.

## `rawHtml(html)`

Injects trusted raw HTML without escaping.
Use carefully (only trusted content).
