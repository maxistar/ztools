import {
    defineComponent,
    signal,
    computed,
    effect,
    tags as t,
} from "../../dist/ztools.client.full.js";
import { DonutChartSvg } from "./donut-chart-svg.js";

/* =========================
   Geometry helpers
========================= */

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

/* =========================
   Data + animation helpers
========================= */

function normalizeData(list) {
    return (Array.isArray(list) ? list : []).map((item, i) => ({
        id: item.id ?? String(i),
        label: String(item.label ?? ""),
        value: Number(item.value ?? 0),
        color: String(item.color ?? "#999")
    }));
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function alignData(from, to) {
    const map = new Map((from || []).map(item => [item.id, item]));
    return to.map(item => {
        const prev = map.get(item.id);
        return prev ? prev : { ...item, value: 0 };
    });
}

function animateValues(from, to, duration, onUpdate, onDone) {
    const start = performance.now();
    let rafId = 0;

    function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const k = easeOutCubic(t);

        const next = to.map((item, i) => {
            const fromItem = from[i] || { ...item, value: 0 };
            return {
                ...item,
                value: fromItem.value + (item.value - fromItem.value) * k
            };
        });

        onUpdate(next);

        if (t < 1) {
            rafId = requestAnimationFrame(frame);
        } else if (onDone) {
            onDone();
        }
    }

    rafId = requestAnimationFrame(frame);

    return function cancel() {
        cancelAnimationFrame(rafId);
    };
}

/* =========================
   Component
========================= */

defineComponent("z-donut-chart", (props, host) => {
    const width = signal(Number(host.getAttribute("width") || 360));
    const height = signal(Number(host.getAttribute("height") || 360));
    const outerR = signal(Number(host.getAttribute("outer-radius") || 110));
    const innerR = signal(Number(host.getAttribute("inner-radius") || 62));
    const title = signal(host.getAttribute("title") || "Distribution");

    const targetData = signal([]);
    const animatedData = signal([]);
    const hovered = signal(null);

    let cancelAnimation = null;

    // public property API
    if (!host.__zDonutPatched) {
        host.__zDonutPatched = true;

        Object.defineProperty(host, "data", {
            get() {
                return targetData();
            },
            set(v) {
                const next = normalizeData(v);

                // first render: no animation
                if (animatedData().length === 0) {
                    targetData.set(next);
                    animatedData.set(next);
                    return;
                }

                if (cancelAnimation) cancelAnimation();

                const prev = alignData(animatedData(), next);
                targetData.set(next);

                cancelAnimation = animateValues(
                    prev,
                    next,
                    500,
                    (frame) => animatedData.set(frame),
                    () => {
                        cancelAnimation = null;
                    }
                );
            }
        });
    }

    async function loadFromSrc(url) {
        if (!url) return;
        try {
            const res = await fetch(url);
            const json = await res.json();
            host.data = json;
        } catch (e) {
            props.emit("error", { message: String(e?.message || e) });
        }
    }

    // read initial attrs
    const src = host.getAttribute("src");
    if (src) loadFromSrc(src);

    const cx = computed(() => 160);
    const cy = computed(() => Math.round(height() / 2));

    const total = computed(() =>
        animatedData().reduce((sum, item) => sum + item.value, 0)
    );

    const slices = computed(() => {
        const list = animatedData();
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

    // optional state event
    effect(() => {
        props.emit("change", {
            total: total(),
            hovered: hovered()
        });
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
        transition: background 120ms ease;
      }

      .legend-row:hover {
        background: rgba(0, 0, 0, 0.04);
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

        DonutChartSvg({
            width,
            height,
            title,
            cx,
            cy,
            outerR,
            slices,
            hovered,
            setHovered: (i) => hovered.set(i),
            activeSlice,
            total,
            onSliceClick: (slice) => props.emit("sliceclick", { slice }),
        }),

        t.div(
            { className: "legend" },

            t.div({ className: "legend-title" }, "Legend"),

            () => slices().map((slice) =>
                t.div(
                    {
                        className: "legend-row",
                        style: {
                            background: () => hovered() === slice.index
                                ? "rgba(0, 0, 0, 0.04)"
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
                        () => `${Math.round(slice.value)} (${slice.percent}%)`
                    )
                )
            ),

            t.div(
                { className: "total" },
                "Total: ",
                () => Math.round(total())
            )
        )
    );
}, {
    shadow: true,
    observedAttributes: ["src"]
});
