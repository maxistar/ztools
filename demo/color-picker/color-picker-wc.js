import {
  defineComponent,
  computed,
  tags as t,
  css,
} from "../../dist/ztools.client.full.js";

export function normalizeHex(value) {
  if (!value) return "#000000";
  let v = String(value).trim();
  if (!v.startsWith("#")) v = "#" + v;
  if (/^#[0-9a-fA-F]{3}$/.test(v))
    v = "#" + v.slice(1).split("").map((ch) => ch + ch).join("");
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) return "#000000";
  return v.toLowerCase();
}

export function isValidHex(value) {
  const v = String(value || "").trim();
  return /^#[0-9a-fA-F]{3}$/.test(v) || /^#[0-9a-fA-F]{6}$/.test(v);
}

defineComponent(
  "color-picker",
  (props) => {
    const value = computed(() => normalizeHex(props.$["value"]() || "#ef6b2d"));
    const label = computed(() => props.$["label"]() || "Pick a color");

    function update(next) {
      const v = normalizeHex(next);
      if (v === value()) return;
      props.setAttr("value", v);
      props.emit("colorchange", { value: v });
    }

    return t.div(
      { className: "picker" },

      t.style(css`
        :host { display: grid; gap: 10px; font-family: "Fira Sans", "Trebuchet MS", sans-serif; }
        .picker { display: grid; gap: 10px; padding: 14px; border-radius: 14px;
                  background: rgba(255,255,255,.75); border: 1px solid rgba(26,26,26,.12); }
        .picker-label { font-size: 14px; text-transform: uppercase;
                        letter-spacing: .4px; color: #6d6761; }
        .picker-preview { height: 48px; border-radius: 12px;
                          border: 1px solid rgba(26,26,26,.12); }
        .picker-input { width: 100%; height: 40px; padding: 0; border: none;
                        border-radius: 10px; background: transparent; cursor: pointer; }
        .picker-input::-webkit-color-swatch-wrapper { padding: 0; }
        .picker-input::-webkit-color-swatch { border: none; border-radius: 10px; }
        .picker-text { width: 100%; height: 40px; border-radius: 10px;
                       border: 1px solid rgba(26,26,26,.12); padding: 0 12px;
                       font-size: 14px; letter-spacing: .4px; box-sizing: border-box; }
        .picker-text:focus { outline: 2px solid rgba(26,26,26,.18); }
        .picker-hint { font-size: 12px; color: #6d6761; }
      `),

      t.div({ className: "picker-label" }, label),

      t.div({
        className: "picker-preview",
        style: () => ({ background: value() }),
      }),

      t.input({
        type: "color",
        className: "picker-input",
        value: () => value(),
        onInput: (e) => update(e.target.value),
      }),

      t.input({
        type: "text",
        className: "picker-text",
        maxLength: 7,
        placeholder: "#rrggbb",
        value: () => value(),
        onInput: (e) => { if (isValidHex(e.target.value)) update(e.target.value); },
      }),

      t.div({ className: "picker-hint" }, () => "Current: " + value().toUpperCase()),
    );
  },
  {
    shadow: true,
    observedAttributes: ["value", "label"],
  },
);
