// src/wc.js
// Web Components adapter for ztools (client-only)

import { signal, batch } from "./core.js";
import { mount } from "./enhance.js";

/**
 * defineComponent(name, Component, options?)
 *
 * Component signature:
 *   (props, host) => Node
 *
 * - props: plain object with:
 *   - attrs: { [name]: string|null }        // current attributes
 *   - $:     { [name]: signal(value) }      // reactive attribute signals (only for observed attrs)
 *   - setAttr(name, value)                  // helper
 *   - emit(type, detail, opts?)             // CustomEvent helper (bubbles+composed by default)
 *
 * - host: the custom element instance (HTMLElement)
 */
export function defineComponent(name, Component, options) {
    options = options || {};
    const useShadow = options.shadow !== false; // default true
    const mode = options.mode || "open";
    const observed = options.observedAttributes || [];
    const mapAttr = options.mapAttr || defaultMapAttr;
    const initialProps = options.props || {};

    class ZToolsElement extends HTMLElement {
        static get observedAttributes() {
            return observed;
        }

        constructor() {
            super();
            this.__dispose = null;

            // Root where ztools mounts (shadowRoot or host itself)
            this.__root = null;

            // Reactive attribute signals: { attrName: signal(string|null) }
            this.$ = {};
            for (let i = 0; i < observed.length; i++) {
                const k = observed[i];
                this.$[k] = signal(this.getAttribute(k));
            }

            // Plain attrs snapshot (non-reactive)
            this.attrs = {};
        }

        connectedCallback() {
            // create root
            this.__root = useShadow ? this.attachShadow({ mode }) : this;

            // snapshot attrs (all current attributes)
            this.attrs = readAllAttrs(this);

            // mount component
            const host = this;

            const props = {
                ...initialProps,
                attrs: host.attrs,
                $: host.$,

                setAttr(attrName, value) {
                    if (value == null) host.removeAttribute(attrName);
                    else host.setAttribute(attrName, String(value));
                },

                emit(type, detail, opts) {
                    host.dispatchEvent(new CustomEvent(type, {
                        detail,
                        bubbles: true,
                        composed: true,
                        ...opts
                    }));
                }
            };

            // Wrap Component so it can read latest attrs on each mount (but it mounts once)
            this.__dispose = mount(() => Component(props, host), this.__root);
        }

        disconnectedCallback() {
            if (this.__dispose) {
                this.__dispose();
                this.__dispose = null;
            }
        }

        attributeChangedCallback(name, oldValue, newValue) {
            // update snapshot (all attrs)
            this.attrs = readAllAttrs(this);

            // update reactive attr signal if observed
            const s = this.$[name];
            if (s) s.set(mapAttr(name, newValue, oldValue));

            // optional hook
            if (typeof options.onAttributeChanged === "function") {
                options.onAttributeChanged(this, name, oldValue, newValue);
            }
        }
    }

    customElements.define(name, ZToolsElement);
    return ZToolsElement;
}

// --- helpers

function readAllAttrs(el) {
    const out = {};
    for (let i = 0; i < el.attributes.length; i++) {
        const a = el.attributes[i];
        out[a.name] = a.value;
    }
    return out;
}

function defaultMapAttr(_name, newValue /*, oldValue */) {
    // keep as string|null (you can override to parse numbers/bools/json)
    return newValue;
}
