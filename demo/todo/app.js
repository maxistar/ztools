import { signal, computed, tags, For, Show, mount } from "../../ztools.js";

const { div, h1, input, button, span, small } = tags;

function uid() {
  return String(Date.now()) + "-" + String(Math.random()).slice(2);
}

function TodoApp() {
  const todos = signal([
    { id: uid(), title: "Try ztools", done: false },
    { id: uid(), title: "Build something small", done: true },
  ]);

  const text = signal("");
  const filter = signal("all"); // all | active | done

  const stats = computed(() => {
    const list = todos();
    const total = list.length;
    const done = list.filter((t) => t.done).length;
    return { total, done, active: total - done };
  });

  const visible = computed(() => {
    const f = filter();
    const list = todos();
    if (f === "active") return list.filter((t) => !t.done);
    if (f === "done") return list.filter((t) => t.done);
    return list;
  });

  function add() {
    const v = text().trim();
    if (!v) return;
    todos.set([{ id: uid(), title: v, done: false }, ...todos()]);
    text.set("");
  }

  function toggle(id) {
    todos.set(todos().map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function remove(id) {
    todos.set(todos().filter((t) => t.id !== id));
  }

  function clearDone() {
    todos.set(todos().filter((t) => !t.done));
  }

  function setAll(done) {
    todos.set(todos().map((t) => ({ ...t, done })));
  }

  function FilterPill(name, label) {
    return span(
      {
        className: () => "pill" + (filter() === name ? " active" : ""),
        onClick: () => filter.set(name),
      },
      label,
    );
  }

  return div(
    { className: "app" },
    h1("Todo List"),

    div(
      { className: "row" },
      input({
        type: "text",
        placeholder: "What needs to be done?",
        value: () => text(),
        onInput: (e) => text.set(e.target.value),
        onKeydown: (e) => {
          if (e.key === "Enter") add();
        },
      }),
      button({ onClick: add }, "Add"),
    ),

    div(
      { className: "filters" },
      FilterPill("all", () => "All (" + stats().total + ")"),
      FilterPill("active", () => "Active (" + stats().active + ")"),
      FilterPill("done", () => "Done (" + stats().done + ")"),
    ),

    div(
      { className: "row" },
      button({ onClick: () => setAll(true) }, "Mark all done"),
      button({ onClick: () => setAll(false) }, "Mark all active"),
      button({ onClick: clearDone }, "Clear done"),
    ),

    div(
      Show(
        () => visible().length === 0,
        () => small("No todos here."),
        () =>
          For(
            visible,
            (t) =>
              div(
                { className: () => "todo" + (t.done ? " done" : "") },
                input({
                  type: "checkbox",
                  checked: t.done,
                  onChange: () => toggle(t.id),
                }),
                span({ className: "title" }, t.title),
                button({ onClick: () => remove(t.id) }, "×"),
              ),
            (t) => `${t.id}|${t.done}`,
          ),
      ),
    ),
  );
}

mount(TodoApp, document.body);
