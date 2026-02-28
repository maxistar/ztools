import { signal, computed, tags, For, mount } from "../../ztools.js";

const { div, h1, p, span, section, colorPicker } = tags;

function normalizeHex(value) {
  if (!value) return "#000000";
  let v = String(value).trim();
  if (!v.startsWith("#")) v = "#" + v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    v =
      "#" +
      v
        .slice(1)
        .split("")
        .map((ch) => ch + ch)
        .join("");
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) return "#000000";
  return v.toLowerCase();
}

function isValidHex(value) {
  if (!value) return false;
  let v = String(value).trim();
  if (!v.startsWith("#")) v = "#" + v;
  return /^#[0-9a-fA-F]{3}$/.test(v) || /^#[0-9a-fA-F]{6}$/.test(v);
}

class ColorPicker extends HTMLElement {
  static get observedAttributes() {
    return ["value", "label"];
  }

  constructor() {
    super();
    this._value = normalizeHex(this.getAttribute("value") || "#ef6b2d");
    this._label = this.getAttribute("label") || "Pick a color";

    this.attachShadow({ mode: "open" });
    this._root = document.createElement("div");
    this._root.className = "picker";

    this._labelEl = document.createElement("div");
    this._labelEl.className = "picker-label";

    this._preview = document.createElement("div");
    this._preview.className = "picker-preview";

    this._input = document.createElement("input");
    this._input.type = "color";
    this._input.className = "picker-input";

    this._text = document.createElement("input");
    this._text.type = "text";
    this._text.inputMode = "text";
    this._text.maxLength = 7;
    this._text.placeholder = "#rrggbb";
    this._text.className = "picker-text";

    this._hint = document.createElement("div");
    this._hint.className = "picker-hint";

    this._root.append(
      this._labelEl,
      this._preview,
      this._input,
      this._text,
      this._hint,
    );

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: grid;
        gap: 10px;
        font-family: "Fira Sans", "Trebuchet MS", sans-serif;
      }

      .picker {
        display: grid;
        gap: 10px;
        padding: 14px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.75);
        border: 1px solid rgba(26, 26, 26, 0.12);
      }

      .picker-label {
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: #6d6761;
      }

      .picker-preview {
        height: 48px;
        border-radius: 12px;
        border: 1px solid rgba(26, 26, 26, 0.12);
        background: ${this._value};
      }

      .picker-input {
        width: 100%;
        height: 40px;
        padding: 0;
        border: none;
        border-radius: 10px;
        background: transparent;
        cursor: pointer;
      }

      .picker-input::-webkit-color-swatch-wrapper {
        padding: 0;
      }

      .picker-input::-webkit-color-swatch {
        border: none;
        border-radius: 10px;
      }

      .picker-text {
        width: 100%;
        height: 40px;
        border-radius: 10px;
        border: 1px solid rgba(26, 26, 26, 0.12);
        padding: 0 12px;
        font-size: 14px;
        letter-spacing: 0.4px;
      }

      .picker-text:focus {
        outline: 2px solid rgba(26, 26, 26, 0.18);
      }

      .picker-hint {
        font-size: 12px;
        color: #6d6761;
      }
    `;

    this.shadowRoot.append(style, this._root);
  }

  connectedCallback() {
    this._sync();

    this._input.addEventListener("input", () => {
      this.value = this._input.value;
    });

    this._text.addEventListener("input", () => {
      if (!isValidHex(this._text.value)) return;
      const next = normalizeHex(this._text.value);
      if (next !== this._value) this.value = next;
    });
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === "value") this._value = normalizeHex(newValue);
    if (name === "label") this._label = newValue || "Pick a color";
    this._sync();
  }

  get value() {
    return this._value;
  }
  set value(next) {
    const v = normalizeHex(next);
    if (v === this._value) return;
    this._value = v;
    this.setAttribute("value", v);
    this._emit();
    this._sync();
  }

  get label() {
    return this._label;
  }
  set label(next) {
    this._label = next || "Pick a color";
    this.setAttribute("label", this._label);
    this._sync();
  }

  _emit() {
    this.dispatchEvent(
      new CustomEvent("colorchange", {
        detail: { value: this._value },
        bubbles: true,
      }),
    );
  }

  _sync() {
    if (!this.shadowRoot) return;
    this._labelEl.textContent = this._label;
    this._preview.style.background = this._value;
    this._input.value = this._value;
    this._text.value = this._value;
    this._hint.textContent = "Current: " + this._value.toUpperCase();
  }
}

if (!customElements.get("color-picker")) {
  customElements.define("color-picker", ColorPicker);
}

function App() {
  const selected = signal("#ef6b2d");
  const history = signal(["#ef6b2d", "#2b8a78", "#2e3a55", "#ffd166"]);

  const previewText = computed(() => selected().toUpperCase());

  function onPick(event) {
    const value = normalizeHex(event.detail?.value || event.target?.value);
    selected.set(value);

    const next = [value, ...history().filter((v) => v !== value)].slice(0, 8);
    history.set(next);
  }

  return div(
    { className: "app" },
    div(
      { className: "header" },
      h1({ className: "title" }, "Color Picker"),
      p(
        { className: "subtitle" },
        "A small web component demo with a reactive preview and history.",
      ),
    ),

    section(
      { className: "panel" },
      div(
        { className: "row" },
        div(
          { className: "preview", style: () => ({ background: selected() }) },
          span({ className: "preview-label" }, () => previewText()),
        ),
        div(
          { className: "swatches" },
          colorPicker({
            label: "Primary Color",
            value: () => selected(),
            onColorchange: onPick,
          }),
          div({
            className: "color-chip",
            style: () => ({ background: selected() }),
          }),
        ),
      ),
      div(
        { className: "notice" },
        "Tip: type a hex code directly or tap a recent swatch.",
      ),
    ),

    section(
      { className: "panel" },
      div(
        { className: "swatches" },
        div(null, "Recent swatches"),
        div(
          { className: "swatch-grid" },
          For(history, (hex) =>
            div(
              {
                className: "swatch",
                onClick: () => onPick({ detail: { value: hex } }),
              },
              div({ className: "swatch-chip", style: { background: hex } }),
              div({ className: "swatch-code" }, hex.toUpperCase()),
            ),
          ),
        ),
      ),
    ),
  );
}

mount(App, document.body);
