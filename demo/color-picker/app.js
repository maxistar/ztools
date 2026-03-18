import {
  defineComponent,
  signal,
  computed,
  tags as t,
  For,
  mount,
  css,
} from "../../ztools.client.js";

// ── helpers ──────────────────────────────────────────────────────────────────

function normalizeHex(value) {
  if (!value) return "#000000";
  let v = String(value).trim();
  if (!v.startsWith("#")) v = "#" + v;
  if (/^#[0-9a-fA-F]{3}$/.test(v))
    v = "#" + v.slice(1).split("").map((ch) => ch + ch).join("");
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) return "#000000";
  return v.toLowerCase();
}

function isValidHex(value) {
  const v = String(value || "").trim();
  return /^#[0-9a-fA-F]{3}$/.test(v) || /^#[0-9a-fA-F]{6}$/.test(v);
}

// ── <color-picker> Web Component via wc.js ───────────────────────────────────

defineComponent(
  "color-picker",
  (props) => {
    const value  = computed(() => normalizeHex(props.$["value"]()  || "#ef6b2d"));
    const label  = computed(() => props.$["label"]() || "Pick a color");

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

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const selected = signal("#ef6b2d");
  const history  = signal(["#ef6b2d", "#2b8a78", "#2e3a55", "#ffd166"]);

  function onPick(e) {
    const value = normalizeHex(e.detail?.value || e.target?.value);
    selected.set(value);
    history.set([value, ...history().filter((v) => v !== value)].slice(0, 8));
  }

  return t.div(
    { className: "app" },

    t.div(
      { className: "header" },
      t.h1({ className: "title" }, "Color Picker"),
      t.p({ className: "subtitle" },
        "A small web component demo with a reactive preview and history.",
      ),
    ),

    t.section(
      { className: "panel" },
      t.div(
        { className: "row" },
        t.div(
          { className: "preview", style: () => ({ background: selected() }) },
          t.span({ className: "preview-label" }, () => selected().toUpperCase()),
        ),
        t.div(
          { className: "swatches" },
          t["color-picker"]({
            label: "Primary Color",
            value: () => selected(),
            onColorchange: onPick,
          }),
        ),
      ),
      t.div({ className: "notice" },
        "Tip: type a hex code directly or tap a recent swatch.",
      ),
    ),

    t.section(
      { className: "panel" },
      t.div(
        { className: "swatches" },
        t.div(null, "Recent swatches"),
        t.div(
          { className: "swatch-grid" },
          For(history, (hex) =>
            t.div(
              { className: "swatch", onClick: () => onPick({ detail: { value: hex } }) },
              t.div({ className: "swatch-chip", style: { background: hex } }),
              t.div({ className: "swatch-code" }, hex.toUpperCase()),
            ),
          ),
        ),
      ),
    ),
  );
}

mount(App, document.body);
