import { signal, mount, tags as t } from "../../dist/ztools.client.full.js";
import { DonutChart } from "./donut-chart-svg.js";

function App() {
  const datasetA = [
    { label: "Desktop", value: 45, color: "#4f46e5" },
    { label: "Mobile", value: 30, color: "#06b6d4" },
    { label: "Tablet", value: 15, color: "#10b981" },
    { label: "Other", value: 10, color: "#f59e0b" },
  ];

  const datasetB = [
    { label: "Desktop", value: 25, color: "#4f46e5" },
    { label: "Mobile", value: 50, color: "#06b6d4" },
    { label: "Tablet", value: 12, color: "#10b981" },
    { label: "Other", value: 13, color: "#f59e0b" },
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
        maxWidth: "820px",
        margin: "0 auto",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
      },
    },
    t.h1({ style: { marginBottom: "16px" } }, "Donut Chart Demo"),
    t.button(
      {
        onClick: toggle,
        style: {
          marginBottom: "20px",
          padding: "10px 14px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          background: "#fff",
          cursor: "pointer",
        },
      },
      "Toggle dataset",
    ),
    DonutChart({ data }),
  );
}

mount(App, document.body);
