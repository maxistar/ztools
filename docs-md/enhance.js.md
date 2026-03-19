# enhance.js

Progressive enhancement helpers.

## `mount(component, root)`

Mounts a component into a DOM root.
Returns a dispose function.

## `enhance(root, fn)`

Enhances already existing DOM nodes (SSR/static HTML upgrade scenario).

Use this when HTML is pre-rendered and you want to attach behavior/reactivity without full rerender.
