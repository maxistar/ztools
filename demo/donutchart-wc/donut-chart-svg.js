import { h } from "../../dist/ztools.client.full.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function svgTag(name) {
  return function () {
    const el = document.createElementNS(SVG_NS, name);
    return h.apply(null, [el, ...arguments]);
  };
}

const s = {
  svg: svgTag("svg"),
  g: svgTag("g"),
  path: svgTag("path"),
  rect: svgTag("rect"),
  text: svgTag("text"),
};

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

export function DonutChartSvg({
  width,
  height,
  title,
  cx,
  cy,
  outerR,
  slices,
  hovered,
  setHovered,
  activeSlice,
  total,
  onSliceClick,
}) {
  return s.svg(
    {
      width: () => width(),
      height: () => height(),
      viewBox: () => `0 0 ${width()} ${height()}`,
      style: {
        overflow: "visible",
        display: "block",
      },
    },

    s.text(
      {
        x: 20,
        y: 28,
        fill: "#111",
        style: {
          fontSize: "18px",
          fontWeight: "600",
        },
      },
      () => title(),
    ),

    () =>
      slices().map((slice) => {
        const isActive = () => hovered() === slice.index;

        return s.g(
          s.path({
            d: slice.path,
            fill: slice.color,
            stroke: "#fff",
            "stroke-width": () => (isActive() ? 4 : 2),
            opacity: () => {
              const h = hovered();
              return h == null || h === slice.index ? 1 : 0.72;
            },
            style: {
              cursor: "pointer",
              transition: "opacity 120ms ease",
            },
            onMouseenter: () => setHovered(slice.index),
            onMouseleave: () => setHovered(null),
            onClick: () => onSliceClick(slice),
          }),

          () =>
            slice.percent >= 8
              ? s.text(
                  {
                    x: slice.labelX,
                    y: slice.labelY,
                    fill: "#111",
                    "text-anchor": "middle",
                    "dominant-baseline": "middle",
                    style: {
                      fontSize: "12px",
                      fontWeight: "600",
                      pointerEvents: "none",
                    },
                  },
                  `${slice.percent}%`,
                )
              : null,
        );
      }),

    s.text(
      {
        x: () => cx(),
        y: () => cy() - 8,
        "text-anchor": "middle",
        fill: "#666",
        style: {
          fontSize: "12px",
          fontWeight: "500",
        },
      },
      "Total",
    ),

    s.text(
      {
        x: () => cx(),
        y: () => cy() + 18,
        "text-anchor": "middle",
        fill: "#111",
        style: {
          fontSize: "28px",
          fontWeight: "700",
        },
      },
      () => Math.round(total()),
    ),

    () => {
      const s1 = activeSlice();
      if (!s1) return null;

      const pos = polarToCartesian(cx(), cy(), outerR() + 28, s1.midAngle);
      const boxW = 128;
      const boxH = 54;
      const x = pos.x - boxW / 2;
      const y = pos.y - boxH / 2;

      return s.g(
        { style: { pointerEvents: "none" } },

        s.rect({
          x,
          y,
          rx: 10,
          ry: 10,
          width: boxW,
          height: boxH,
          fill: "white",
          stroke: "#ddd",
        }),

        s.text(
          {
            x: x + 12,
            y: y + 20,
            fill: "#111",
            style: { fontSize: "12px", fontWeight: "700" },
          },
          s1.label,
        ),

        s.text(
          {
            x: x + 12,
            y: y + 39,
            fill: "#555",
            style: { fontSize: "12px" },
          },
          `${Math.round(s1.value)} (${s1.percent}%)`,
        ),
      );
    },
  );
}
