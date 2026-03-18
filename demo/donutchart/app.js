import { h, signal, computed, mount, tags as t } from "../../dist/ztools.client.full.js";

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

function DonutChart({ data, width = 760, height = 360, outerR = 110, innerR = 62 }) {
    const cx = 160;
    const cy = 170;

    const hovered = signal(null);

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
            const labelPos = polarToCartesian(cx, cy, (outerR + innerR) / 2, midAngle);

            return {
                ...item,
                index,
                startAngle,
                endAngle,
                midAngle,
                path: describeDonutArc(cx, cy, outerR, innerR, startAngle, endAngle),
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
        {
            style: {
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "28px",
                alignItems: "start",
                fontFamily: "system-ui, sans-serif"
            }
        },

        // chart
        s.svg(
            {
                attrs: {
                    width,
                    height,
                    viewBox: `0 0 ${width} ${height}`
                },
                style: {
                    overflow: "visible",
                    display: "block"
                }
            },

            // title
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
                "Traffic sources"
            ),

            // donut slices
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
                        style: {
                            cursor: "pointer",
                            transition: "transform 120ms ease, opacity 120ms ease"
                        },
                        opacity: () => {
                            const h = hovered();
                            return h == null || h === slice.index ? 1 : 0.72;
                        },
                        onMouseenter: () => hovered.set(slice.index),
                        onMouseleave: () => hovered.set(null)
                    }),

                    // percent label on large slices
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

            // center label
            s.text(
                {
                    attrs: {
                        x: cx,
                        y: cy - 8,
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
                        x: cx,
                        y: cy + 18,
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

            // tooltip
            () => {
                const active = activeSlice();
                if (!active) return null;

                const pos = polarToCartesian(cx, cy, outerR + 28, active.midAngle);
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

        // legend
        t.div(
            { style: { paddingTop: "42px" } },

            t.div(
                {
                    style: {
                        fontWeight: "600",
                        marginBottom: "12px"
                    }
                },
                "Legend"
            ),

            () => slices().map((slice) =>
                t.div(
                    {
                        style: {
                            display: "grid",
                            gridTemplateColumns: "14px 1fr auto",
                            gap: "10px",
                            alignItems: "center",
                            marginBottom: "10px",
                            padding: "6px 8px",
                            borderRadius: "8px",
                            background: () => hovered() === slice.index ? "rgba(0,0,0,0.04)" : "transparent",
                            cursor: "pointer"
                        },
                        onMouseenter: () => hovered.set(slice.index),
                        onMouseleave: () => hovered.set(null)
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
                        {
                            style: {
                                opacity: 0.78,
                                fontVariantNumeric: "tabular-nums"
                            }
                        },
                        `${slice.value} (${slice.percent}%)`
                    )
                )
            ),

            t.div(
                {
                    style: {
                        marginTop: "18px",
                        paddingTop: "12px",
                        borderTop: "1px solid #eee",
                        fontWeight: "600"
                    }
                },
                "Total: ",
                () => total()
            )
        )
    );
}

function App() {
    const datasetA = [
        { label: "Desktop", value: 45, color: "#4f46e5" },
        { label: "Mobile", value: 30, color: "#06b6d4" },
        { label: "Tablet", value: 15, color: "#10b981" },
        { label: "Other", value: 10, color: "#f59e0b" }
    ];

    const datasetB = [
        { label: "Desktop", value: 25, color: "#4f46e5" },
        { label: "Mobile", value: 50, color: "#06b6d4" },
        { label: "Tablet", value: 12, color: "#10b981" },
        { label: "Other", value: 13, color: "#f59e0b" }
    ];

    const data = signal(datasetA);
    const toggled = signal(false);

    function toggle() {
        const next = !toggled();
        toggled.set(next);
        data.set(next ? datasetB : datasetA);
    }

    return t.div(
        {
            style: {
                maxWidth: "920px",
                margin: "0 auto",
                padding: "24px",
                fontFamily: "system-ui, sans-serif"
            }
        },

        t.h1(
            {
                style: {
                    marginBottom: "16px"
                }
            },
            "Donut Chart Demo"
        ),

        t.button(
            {
                onClick: toggle,
                style: {
                    marginBottom: "20px",
                    padding: "10px 14px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    background: "#fff",
                    cursor: "pointer"
                }
            },
            "Toggle dataset"
        ),

        DonutChart({ data })
    );
}

mount(App, document.body);
