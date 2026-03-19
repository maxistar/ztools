import {
  defineComponent,
  tags as t,
  css,
  computed,
} from "../../dist/ztools.client.full.js";

function normalizeHex(value) {
  if (!value) return "#000000";
  let v = String(value).trim();
  if (!v.startsWith("#")) v = "#" + v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    v = "#" + v.slice(1).split("").map((ch) => ch + ch).join("");
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) return "#000000";
  return v.toLowerCase();
}

function isValidHex(v) {
  v = String(v || "").trim();
  return /^#[0-9a-fA-F]{3}$/.test(v) || /^#[0-9a-fA-F]{6}$/.test(v);
}

export { normalizeHex };

export function ensureColorPickerWc() {
  if (customElements.get("color-picker")) return;

  defineComponent(
    "color-picker",
    (props) => {
      const value = computed(() => normalizeHex(props.$["value"]() || "#000000"));
      const label = computed(() => props.$["label"]() || "Color");

      function update(next) {
        const v = normalizeHex(next);
        if (v === value()) return;
        props.setAttr("value", v);
        props.emit("colorchange", { value: v });
      }

      return t.div(
        { className: "cp" },
        t.style(css`
          :host { display: contents; }
          .cp { display: flex; align-items: center; gap: 6px; }
          .cp-swatch { width: 28px; height: 28px; border-radius: 6px;
                       border: 1px solid rgba(0,0,0,.18); cursor: pointer;
                       flex-shrink: 0; position: relative; overflow: hidden; }
          .cp-swatch input[type=color] { opacity: 0; position: absolute;
                                          inset: 0; width: 100%; height: 100%;
                                          cursor: pointer; border: none; padding: 0; }
          .cp-text { width: 78px; height: 28px; border-radius: 6px; padding: 0 6px;
                     border: 1px solid rgba(0,0,0,.18); font-size: 13px;
                     letter-spacing: .04em; font-family: monospace; }
        `),
        t.span({ className: "cp-label" }, label),
        t.div(
          { className: "cp-swatch", style: () => ({ background: value() }) },
          t.input({
            type: "color",
            value: () => value(),
            onInput: (e) => update(e.target.value),
          }),
        ),
        t.input({
          type: "text",
          className: "cp-text",
          maxLength: 7,
          placeholder: "#rrggbb",
          value: () => value(),
          onInput: (e) => { if (isValidHex(e.target.value)) update(e.target.value); },
        }),
      );
    },
    { shadow: true, observedAttributes: ["value", "label"] },
  );
}
