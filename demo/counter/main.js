import { signal, tags, mount, Show, For, computed } from "../../ztools.js";

const { div, h1, p, button } = tags;

function App() {
  const count = signal(0);
  const doubled = computed(() => count() * 2);
  const show = computed(() => count() % 2 === 0);
  const items = signal([
    { id: 1, title: "A" },
    { id: 2, title: "B" },
  ]);

  return div(
    h1("ztools demo"),
    p(
      "count: ",
      () => count(),
      " (x2=",
      () => doubled(),
      ")",
    ),
    button({ onClick: () => count.set(count() + 1) }, "+1"),
    Show(
      show,
      () => div("even"),
      () => div("odd"),
    ),
    For(items, (it, idx) => div(() => idx() + 1 + ". " + it.title)),
  );
}

mount(App, document.getElementById('app-container'));
