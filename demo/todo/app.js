import { signal, createTags, mount, effect, computed } from "../../ztools.js";

const { div, input, label, button, checkbox } = createTags("div", "input", "label", "button", "input");

function App() {
  const todos = signal([
    { id: 1, text: "Learn ztools", done: false },
    { id: 2, text: "Build a todo app", done: false },
    { id: 3, text: "Enjoy the demo", done: false },
  ]);

  const newTodo = signal("");

  const addTodo = () => {
    if (newTodo().trim()) {
      todos.set([
        ...todos(),
        { id: todos().length + 1, text: newTodo(), done: false },
      ]);
      newTodo.set("");
    }
  };

  const toggleTodo = (index) => {
    todos.set(
      todos().map((t, i) => (i === index ? { ...t, done: !t.done } : t))
    );
  };

  const completedTodos = computed(() =>
    todos().filter((t) => t.done).length
  );

  const remainingTodos = computed(() =>
    todos().filter((t) => !t.done).length
  );

  return div(
    { className: "container" },
    div(
      { className: "todo-list" },
      todos().map((todo, index) =>
        div(
          { className: "todo-item" },
          checkbox({
            type: "checkbox",
            checked: () => todo.done,
            onChange: () => toggleTodo(index),
          }),
          label(todo.text)
        )
      )
    ),
    div(
      { className: "todo-input" },
      input({
        type: "text",
        value: () => newTodo(),
        onInput: (e) => newTodo.set(e.target.value),
        placeholder: "Add a new todo",
      }),
      button({ onClick: addTodo }, "Add")
    ),
    div(
      "Completed: ",
      () => completedTodos(),
      " / Remaining: ",
      () => remainingTodos()
    )
  );
}

mount(App, document.body);