import { signal, createTags, mount } from "../../ztools.js";

const [div, button, span, input] = createTags("div", "button", "span", "input");

function App() {
  const tool = signal("pencil");
  const brushSize = signal(4);

  let canvasEl = null;
  let ctx = null;
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  function setupCanvas(canvas) {
    canvasEl = canvas;
    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    clearCanvas();
  }

  function clearCanvas() {
    if (!ctx || !canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.restore();
  }

  function getPoint(e) {
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function applyTool() {
    if (!ctx) return;
    ctx.lineWidth = Number(brushSize());
    if (tool() === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#000000";
    }
  }

  function startDraw(e) {
    if (!ctx) return;
    drawing = true;
    const p = getPoint(e);
    lastX = p.x;
    lastY = p.y;
  }

  function moveDraw(e) {
    if (!drawing || !ctx) return;
    const p = getPoint(e);
    applyTool();
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastX = p.x;
    lastY = p.y;
  }

  function endDraw() {
    drawing = false;
  }

  function attachCanvasEvents(canvas) {
    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      startDraw(e);
    });
    canvas.addEventListener("pointermove", moveDraw);
    canvas.addEventListener("pointerup", endDraw);
    canvas.addEventListener("pointercancel", endDraw);
    canvas.addEventListener("pointerleave", endDraw);

    window.addEventListener("resize", () => {
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setupCanvas(canvas);
      ctx.putImageData(image, 0, 0);
    });
  }

  return div(
    { className: "app" },
    div(
      { className: "toolbar" },
      button(
        {
          className: () => (tool() === "pencil" ? "active" : ""),
          onClick: () => tool.set("pencil"),
        },
        "Pencil"
      ),
      button(
        {
          className: () => (tool() === "eraser" ? "active" : ""),
          onClick: () => tool.set("eraser"),
        },
        "Eraser"
      ),
      span("Size:"),
      input({
        type: "range",
        min: 1,
        max: 30,
        value: () => String(brushSize()),
        onInput: (e) => brushSize.set(Number(e.target.value)),
      }),
      span(() => String(brushSize())),
      button({ onClick: clearCanvas }, "Clear")
    ),
    div(
      { className: "canvas-wrap" },
      (() => {
        const c = document.createElement("canvas");
        c.ref = (el) => el;
        requestAnimationFrame(() => {
          setupCanvas(c);
          attachCanvasEvents(c);
        });
        return c;
      })()
    )
  );
}

mount(App, document.body);
