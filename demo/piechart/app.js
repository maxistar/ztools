import { signal, mount, tags as t } from "../../dist/ztools.client.full.js";
import { PieChart } from "./pie-chart-svg.js";

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
    { style: { maxWidth: "900px", margin: "0 auto", padding: "24px" } },
    t.h1({ style: { fontFamily: "system-ui, sans-serif", marginBottom: "16px" } }, "Pie Chart Demo"),
    t.button(
      {
        on: { click: toggle },
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
    PieChart({ data }),
  );
}

mount(App, document.body);
