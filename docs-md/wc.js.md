# wc.js

Web Components adapter.

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
