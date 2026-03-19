import {
  signal,
  tags as t,
  For,
  mount,
} from "../../dist/ztools.client.full.js";

import { normalizeHex } from "./color-picker-wc.js";

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
