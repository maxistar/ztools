import {
  signal,
  tags as t,
  mount,
  defineComponent,
  css,
  computed,
} from "../../ztools.client.js";

// ── <color-picker> WC (reused from color-picker demo) ────────────────────────

function normalizeHex(value) {
  if (!value) return "#000000";
  let v = String(value).trim();
  if (!v.startsWith("#")) v = "#" + v;
  if (/^#[0-9a-fA-F]{3}$/.test(v))
    v = "#" + v.slice(1).split("").map((ch) => ch + ch).join("");
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) return "#000000";
  return v.toLowerCase();
}

function isValidHex(v) {
  v = String(v || "").trim();
  return /^#[0-9a-fA-F]{3}$/.test(v) || /^#[0-9a-fA-F]{6}$/.test(v);
}

if (!customElements.get("color-picker")) {
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

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const tool      = signal("pencil");
  const brushSize = signal(4);
  const color     = signal("#111111");

  let ctx = null;
  let canvasEl = null;
  let resizeObserver = null;
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  const getDpr = () => Math.max(1, window.devicePixelRatio || 1);

  function resizeCanvas(preserve = true) {
    if (!canvasEl || !ctx) return;

    const rect = canvasEl.getBoundingClientRect();
    const dpr = getDpr();
    const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
    const nextHeight = Math.max(1, Math.floor(rect.height * dpr));

    const prevWidth = canvasEl.width;
    const prevHeight = canvasEl.height;

    let snapshot = null;
    if (preserve && prevWidth > 0 && prevHeight > 0) {
      snapshot = document.createElement("canvas");
      snapshot.width = prevWidth;
      snapshot.height = prevHeight;
      const sctx = snapshot.getContext("2d");
      sctx.drawImage(canvasEl, 0, 0);
    }

    canvasEl.width = nextWidth;
    canvasEl.height = nextHeight;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (snapshot) {
      ctx.drawImage(snapshot, 0, 0, prevWidth, prevHeight, 0, 0, nextWidth, nextHeight);
    } else {
      clearCanvas();
    }
  }

  function setupCanvas(canvas) {
    if (canvasEl === canvas && ctx) return;

    canvasEl = canvas;
    ctx = canvas.getContext("2d");

    resizeCanvas(false);

    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      startDraw(e);
    });
    canvas.addEventListener("pointermove", moveDraw);
    canvas.addEventListener("pointerup", () => { drawing = false; });
    canvas.addEventListener("pointercancel", () => { drawing = false; });
    canvas.addEventListener("pointerleave", () => { drawing = false; });

    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver(() => resizeCanvas(true));
    resizeObserver.observe(canvas);
  }

  function clearCanvas() {
    if (!ctx || !canvasEl) return;
    const dpr = getDpr();
    const { width, height } = canvasEl.getBoundingClientRect();
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function getPoint(e) {
    const rect = canvasEl.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function applyTool() {
    ctx.lineWidth = Number(brushSize());
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = tool() === "eraser" ? "#ffffff" : color();
  }

  function startDraw(e) {
    drawing = true;
    const p = getPoint(e);
    lastX = p.x; lastY = p.y;
  }

  function moveDraw(e) {
    if (!drawing) return;
    const p = getPoint(e);
    applyTool();
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastX = p.x; lastY = p.y;
  }

  function saveImage() {
    const a = document.createElement("a");
    a.href = canvasEl.toDataURL("image/png");
    a.download = "sketch.png";
    a.click();
  }

  return t.div(
    { className: "app" },

    t.div(
      { className: "toolbar" },

      // tool buttons
      t.button(
        { className: () => tool() === "pencil" ? "active" : "", onClick: () => tool.set("pencil") },
        "✏️ Pencil",
      ),
      t.button(
        { className: () => tool() === "eraser" ? "active" : "", onClick: () => tool.set("eraser") },
        "🧹 Eraser",
      ),

      t.div({ className: "separator" }),

      // color picker (only shown in pencil mode)
      t["color-picker"]({
        label: "Color:",
        value: () => color(),
        style: () => ({ display: tool() === "eraser" ? "none" : "" }),
        onColorchange: (e) => color.set(normalizeHex(e.detail.value)),
      }),

      t.div({ className: "separator" }),

      // brush size
      t.span("Size:"),
      t.input({
        type: "range",
        min: 1,
        max: 40,
        value: () => String(brushSize()),
        onInput: (e) => brushSize.set(Number(e.target.value)),
      }),
      t.span({ className: "size-label" }, () => brushSize() + "px"),

      t.div({ className: "separator" }),

      t.button({ onClick: clearCanvas }, "🗑 Clear"),
      t.button({ onClick: saveImage },   "💾 Save"),
    ),

    t.div(
      { className: "canvas-wrap" },
      t.canvas({
        ref: (el) => setupCanvas(el),
      }),
    ),
  );
}

mount(App, document.body);
