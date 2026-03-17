import {
    h,
    defineComponent,
    signal,
    computed,
    tags as t
} from "../../ztools.js";

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
    text: svgTag("text")
};

function polarToCartesian(cx, cy, r, angleDeg) {
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    return {
        x: cx + r * Math.cos(angleRad),
        y: cy + r * Math.sin(angleRad)
    };
}

function describeDonutArc(cx, cy, outerR, innerR, startAngle, endAngle) {
    const startOuter = polarToCartesian(cx, cy, outerR, endAngle);
    const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
    const startInner = polarToCartesian(cx, cy, innerR, endAngle);
    const endInner = polarToCartesian(cx, cy, innerR, startAngle);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return [
        "M", startOuter.x, startOuter.y,
        "A", outerR, outerR, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
        "L", endInner.x, endInner.y,
        "A", innerR, innerR, 0, largeArcFlag, 1, startInner.x, startInner.y,
        "Z"
    ].join(" ");
}

function normalizeData(list) {
    return (Array.isArray(list) ? list : []).map((item, i) => ({
        id: item.id ?? String(i),
        label: String(item.label ?? ""),
        value: Number(item.value ?? 0),
        color: String(item.color ?? "#999")
    }));
}

defineComponent("z-donut-chart", (props, host) => {
    const width = signal(Number(host.getAttribute("width") || 760));
    const height = signal(Number(host.getAttribute("height") || 360));
    const outerR = signal(Number(host.getAttribute("outer-radius") || 110));
    const innerR = signal(Number(host.getAttribute("inner-radius") || 62));
    const title = signal(host.getAttribute("title") || "Distribution");

    const data = signal([]);
    const hovered = signal(null);

    // public property API
    if (!host.__zDonutPatched) {
        host.__zDonutPatched = true;

        Object.defineProperty(host, "data", {
            get() { return data(); },
            set(v) { data.set(normalizeData(v)); }
        });
    }

    async function loadFromSrc(url) {
        if (!url) return;
        try {
            const res = await fetch(url);
            const json = await res.json();
            data.set(normalizeData(json));
        } catch (e) {
            props.emit("error", { message: String(e?.message || e) });
        }
    }

    // react to src/title/size attrs
    if (props.$?.src) {
        // observed via defineComponent option
        const currentSrc = props.$.src();
        if (currentSrc) loadFromSrc(currentSrc);
    }

    const cx = computed(() => 160);
    const cy = computed(() => Math.round(height() / 2));

    const total = computed(() =>
        data().reduce((sum, item) => sum + item.value, 0)
    );

    const slices = computed(() => {
        const list = data();
        const sum = total();
        let angle = 0;

        return list.map((item, index) => {
            const valueAngle = sum === 0 ? 0 : (item.value / sum) * 360;
            const startAngle = angle;
            const endAngle = angle + valueAngle;
            angle = endAngle;

            const midAngle = startAngle + valueAngle / 2;
            const labelPos = polarToCartesian(
                cx(),
                cy(),
                (outerR() + innerR()) / 2,
                midAngle
            );

            return {
                ...item,
                index,
                startAngle,
                endAngle,
                midAngle,
                path: describeDonutArc(
                    cx(),
                    cy(),
                    outerR(),
                    innerR(),
                    startAngle,
                    endAngle
                ),
                labelX: labelPos.x,
                labelY: labelPos.y,
                percent: sum === 0 ? 0 : Math.round((item.value / sum) * 100)
            };
        });
    });

    const activeSlice = computed(() => {
        const i = hovered();
        if (i == null) return null;
        return slices()[i] || null;
    });

    return t.div(
        { className: "wrap" },

        t.style(`
      :host { display: block; }
      .wrap {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 28px;
        align-items: start;
        font-family: system-ui, sans-serif;
      }
      .legend {
        padding-top: 42px;
      }
      .legend-title {
        font-weight: 600;
        margin-bottom: 12px;
      }
      .legend-row {
        display: grid;
        grid-template-columns: 14px 1fr auto;
        gap: 10px;
        align-items: center;
        margin-bottom: 10px;
        padding: 6px 8px;
        border-radius: 8px;
        cursor: pointer;
      }
      .legend-row:hover {
        background: rgba(0,0,0,0.04);
      }
      .legend-value {
        opacity: 0.78;
        font-variant-numeric: tabular-nums;
      }
      .total {
        margin-top: 18px;
        padding-top: 12px;
        border-top: 1px solid #eee;
        font-weight: 600;
      }
    `),

        s.svg(
            {
                attrs: {
                    width: () => width(),
                    height: () => height(),
                    viewBox: () => `0 0 ${width()} ${height()}`
                },
                style: {
                    overflow: "visible",
                    display: "block"
                }
            },

            s.text(
                {
                    attrs: {
                        x: 20,
                        y: 28,
                        fill: "#111"
                    },
                    style: {
                        fontSize: "18px",
                        fontWeight: "600"
                    }
                },
                () => title()
            ),

            () => slices().map((slice) => {
                const isActive = () => hovered() === slice.index;

                return s.g(
                    s.path({
                        attrs: {
                            d: slice.path,
                            fill: slice.color,
                            stroke: "#fff",
                            "stroke-width": () => isActive() ? 4 : 2
                        },
                        opacity: () => {
                            const h = hovered();
                            return h == null || h === slice.index ? 1 : 0.72;
                        },
                        style: {
                            cursor: "pointer"
                        },
                        onMouseenter: () => hovered.set(slice.index),
                        onMouseleave: () => hovered.set(null),
                        onClick: () => props.emit("sliceclick", { slice })
                    }),

                    () => slice.percent >= 8
                        ? s.text(
                            {
                                attrs: {
                                    x: slice.labelX,
                                    y: slice.labelY,
                                    fill: "#111",
                                    "text-anchor": "middle",
                                    "dominant-baseline": "middle"
                                },
                                style: {
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    pointerEvents: "none"
                                }
                            },
                            `${slice.percent}%`
                        )
                        : null
                );
            }),

            s.text(
                {
                    attrs: {
                        x: () => cx(),
                        y: () => cy() - 8,
                        "text-anchor": "middle",
                        fill: "#666"
                    },
                    style: {
                        fontSize: "12px",
                        fontWeight: "500"
                    }
                },
                "Total"
            ),

            s.text(
                {
                    attrs: {
                        x: () => cx(),
                        y: () => cy() + 18,
                        "text-anchor": "middle",
                        fill: "#111"
                    },
                    style: {
                        fontSize: "28px",
                        fontWeight: "700"
                    }
                },
                () => total()
            ),

            () => {
                const active = activeSlice();
                if (!active) return null;

                const pos = polarToCartesian(cx(), cy(), outerR() + 28, active.midAngle);
                const boxW = 120;
                const boxH = 52;
                const x = pos.x - boxW / 2;
                const y = pos.y - boxH / 2;

                return s.g(
                    { style: { pointerEvents: "none" } },

                    s.rect({
                        attrs: {
                            x,
                            y,
                            rx: 10,
                            ry: 10,
                            width: boxW,
                            height: boxH,
                            fill: "white",
                            stroke: "#ddd"
                        }
                    }),

                    s.text(
                        {
                            attrs: {
                                x: x + 12,
                                y: y + 20,
                                fill: "#111"
                            },
                            style: {
                                fontSize: "12px",
                                fontWeight: "700"
                            }
                        },
                        active.label
                    ),

                    s.text(
                        {
                            attrs: {
                                x: x + 12,
                                y: y + 38,
                                fill: "#555"
                            },
                            style: {
                                fontSize: "12px"
                            }
                        },
                        `${active.value} (${active.percent}%)`
                    )
                );
            }
        ),

        t.div(
            { className: "legend" },

            t.div({ className: "legend-title" }, "Legend"),

            () => slices().map((slice) =>
                t.div(
                    {
                        className: "legend-row",
                        style: {
                            background: () => hovered() === slice.index
                                ? "rgba(0,0,0,0.04)"
                                : "transparent"
                        },
                        onMouseenter: () => hovered.set(slice.index),
                        onMouseleave: () => hovered.set(null),
                        onClick: () => props.emit("sliceclick", { slice })
                    },

                    t.div({
                        style: {
                            width: "14px",
                            height: "14px",
                            borderRadius: "4px",
                            background: slice.color
                        }
                    }),

                    t.div(slice.label),

                    t.div(
                        { className: "legend-value" },
                        `${slice.value} (${slice.percent}%)`
                    )
                )
            ),

            t.div(
                { className: "total" },
                "Total: ",
                () => total()
            )
        )
    );
}, {
    shadow: true,
    observedAttributes: ["src"]
});
