import { h, signal, computed, mount, tags as t } from "../../ztools.js";

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
    text: svgTag("text")
};

function polarToCartesian(cx, cy, r, angleDeg) {
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    return {
        x: cx + r * Math.cos(angleRad),
        y: cy + r * Math.sin(angleRad)
    };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
    const angleSpan = endAngle - startAngle;
    if (angleSpan <= 0) {
        return "";
    }

    // SVG elliptical arcs cannot represent a full circle with a single arc command.
    if (angleSpan >= 360) {
        return [
            "M", cx, cy - r,
            "A", r, r, 0, 1, 1, cx, cy + r,
            "A", r, r, 0, 1, 1, cx, cy - r,
            "Z"
        ].join(" ");
    }

    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = angleSpan > 180 ? 1 : 0;

    return [
        "M", cx, cy,
        "L", start.x, start.y,
        "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
    ].join(" ");
}

function PieChart({ data, width = 520, height = 320, radius = 110 }) {
    const cx = width / 2;
    const cy = height / 2;
    const normalizedData = computed(() =>
        data().map((item) => ({
            ...item,
            value: Number.isFinite(item.value) && item.value > 0 ? item.value : 0
        }))
    );
    const total = computed(() => normalizedData().reduce((sum, item) => sum + item.value, 0));

    const slices = computed(() => {
        const list = normalizedData();
        const sum = total();
        let angle = 0;

        return list.map((item) => {
            const valueAngle = sum === 0 ? 0 : (item.value / sum) * 360;
            const startAngle = angle;
            const endAngle = angle + valueAngle;
            angle = endAngle;

            const midAngle = startAngle + valueAngle / 2;
            const labelPos = polarToCartesian(cx, cy, radius * 0.65, midAngle);

            return {
                ...item,
                startAngle,
                endAngle,
                path: valueAngle === 0 ? "" : describeArc(cx, cy, radius, startAngle, endAngle),
                labelX: labelPos.x,
                labelY: labelPos.y,
                percent: sum === 0 ? 0 : Math.round((item.value / sum) * 100)
            };
        });
    });

    return t.div(
        {
            style: {
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "24px",
                alignItems: "start",
                fontFamily: "system-ui, sans-serif"
            }
        },

        // SVG chart
        s.svg(
            {
                attrs: {
                    width,
                    height,
                    viewBox: `0 0 ${width} ${height}`
                },
                style: {
                    overflow: "visible"
                }
            },

            // title
            s.text(
                {
                    attrs: { x: 20, y: 24, fill: "#111" },
                    props: { textContent: "Distribution" },
                    style: {
                        fontSize: "18px",
                        fontWeight: "600"
                    }
                }
            ),

            // slices
            () => slices().map((slice) =>
                s.g(
                    s.path({
                        attrs: {
                            d: slice.path,
                            fill: slice.color,
                            stroke: "#fff",
                            "stroke-width": 2
                        }
                    }),

                    // label only if slice is large enough
                    () => slice.percent >= 5
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
                                    fontWeight: "600"
                                }
                            },
                            `${slice.percent}%`
                        )
                        : null
                )
            )
        ),

        // legend
        t.div(
            { style: { paddingTop: "36px" } },

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
                            marginBottom: "8px"
                        }
                    },
                    t.div({
                        style: {
                            width: "14px",
                            height: "14px",
                            borderRadius: "3px",
                            background: slice.color
                        }
                    }),
                    t.div(slice.label),
                    t.div(
                        {
                            style: {
                                opacity: 0.75
                            }
                        },
                        `${slice.value} (${slice.percent}%)`
                    )
                )
            ),

            t.div(
                {
                    style: {
                        marginTop: "16px",
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
        toggled.set(!toggled());
        data.set(toggled() ? datasetB : datasetA);
    }

    return t.div(
        {
            style: {
                maxWidth: "900px",
                margin: "0 auto",
                padding: "24px"
            }
        },

        t.h1(
            {
                style: {
                    fontFamily: "system-ui, sans-serif",
                    marginBottom: "16px"
                }
            },
            "Pie Chart Demo"
        ),

        t.button(
            {
                on: { click: toggle },
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

        PieChart({ data })
    );
}

mount(App, document.body);
