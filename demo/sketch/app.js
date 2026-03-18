import {
  signal,
  tags as t,
  mount,
} from "../../dist/ztools.client.full.js";
import { ensureColorPickerWc, normalizeHex } from "./color-picker-wc.js";

ensureColorPickerWc();

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
