import { signal, computed, chainTags, For, Show, mount } from "../../ztools.js";

const { div, h1, input, button, span, small, p } = chainTags;

const appBox = div.c("app", "stack");
const row = div.c("row");
const filters = div.c("filters");
const todoTitle = span.c("title");

const textInput = input
  .attr("type", "text")
  .attr("placeholder", "What needs to be done?")
  .attr("autocomplete", "off");

function uid() {
  return String(Date.now()) + "-" + String(Math.random()).slice(2);
}

function TodoApp() {
  const todos = signal([
    { id: uid(), title: "Try chainTags", done: false },
    { id: uid(), title: "Mix attrs and props intentionally", done: true },
  ]);

  const text = signal("");
  const filter = signal("all");

  const stats = computed(() => {
    const list = todos();
    const total = list.length;
    const done = list.filter((t) => t.done).length;
    return { total, done, active: total - done };
  });

  const visible = computed(() => {
    const mode = filter();
    const list = todos();
    if (mode === "active") return list.filter((t) => !t.done);
    if (mode === "done") return list.filter((t) => t.done);
    return list;
  });

  function add() {
    const value = text().trim();
    if (!value) return;
    todos.set([{ id: uid(), title: value, done: false }, ...todos()]);
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
    return span
      .c("pill")
      .p({
        className: () => (filter() === name ? "active" : ""),
        onClick: () => filter.set(name),
      })(label);
  }

  return appBox(
    h1("Todo List via chainTags"),
    p.c("hint")(
      "This demo uses chained builders plus explicit attr/prop control on the text input.",
    ),

    row(
      textInput
        .prop("value", () => text())
        .onInput((e) => text.set(e.target.value))
        .onKeydown((e) => {
          if (e.key === "Enter") add();
        })(),
      button.onClick(add)("Add"),
    ),

    filters(
      FilterPill("all", () => "All (" + stats().total + ")"),
      FilterPill("active", () => "Active (" + stats().active + ")"),
      FilterPill("done", () => "Done (" + stats().done + ")"),
    ),

    row(
      button.onClick(() => setAll(true))("Mark all done"),
      button.onClick(() => setAll(false))("Mark all active"),
      button.onClick(clearDone)("Clear done"),
    ),

    div(
      Show(
        () => visible().length === 0,
        () => small("No todos here."),
        () =>
          For(
            visible,
            (t) =>
              div
                .c("todo")
                .p({ className: () => (t.done ? "done" : "") })(
                  input
                    .attr("type", "checkbox")
                    .prop("checked", t.done)
                    .onChange(() => toggle(t.id))(),
                  todoTitle(t.title),
                  div.c("spacer")(),
                  button.onClick(() => remove(t.id))("×"),
                ),
            (t) => `${t.id}|${t.done}`,
          ),
      ),
    ),
  );
}

mount(TodoApp, document.body);
