import { signal, tags, mount, For } from "../../ztools.js";

const { div, button, h1 } = tags;

// ── Tabs component ───────────────────────────────────────────────────────────
// props: { tabs: [{ id, label, content }] }
function Tabs({ tabs }) {
  const active = signal(tabs[0].id);

  return div({ className: "tabs" },
    // header bar
    div({ className: "tabs__bar" },
      For(
        () => tabs,
        (tab) => button(
          {
            className: () => "tabs__tab" + (active() === tab.id ? " active" : ""),
            onClick: () => active.set(tab.id),
          },
          tab.label,
        ),
        (tab) => tab.id,
      ),
    ),
    // panel — show only active tab's content
    div({ className: "tabs__panel" },
      () => {
        const tab = tabs.find((t) => t.id === active());
        return tab ? tab.content : null;
      },
    ),
  );
}

// ── Demo data ────────────────────────────────────────────────────────────────
const myTabs = [
  {
    id: "overview",
    label: "Overview",
    content: "This is the Overview tab. It gives you a quick summary of what's going on.",
  },
  {
    id: "details",
    label: "Details",
    content: "The Details tab contains more information. You can put forms, tables, or anything here.",
  },
  {
    id: "settings",
    label: "Settings",
    content: "Settings tab: configure your preferences, toggle features, manage your account.",
  },
  {
    id: "logs",
    label: "Logs",
    content: "[2026-03-16 09:00] App started\n[2026-03-16 09:01] Connected\n[2026-03-16 09:05] All systems nominal.",
  },
];

// ── Mount ────────────────────────────────────────────────────────────────────
mount(
  () => div(
    h1("Tabs demo"),
    Tabs({ tabs: myTabs }),
  ),
  document.getElementById("app"),
);
