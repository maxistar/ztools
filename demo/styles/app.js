import { signal, createTags, mount } from "../../ztools.js";

const [div, label, select, option] = createTags("div", "label", "select", "option");

function App() {
  const color = signal("red");

  const colors = ["red", "green", "blue", "purple", "orange", "black"];

  return div(
    { className: "app" },
    label(
      "Rectangle color:",
      select(
        {
          value: () => color(),
          onChange: (e) => color.set(e.target.value),
        },
        colors.map((c) => option({ value: c }, c))
      )
    ),
    div(
      {
        className: "rect",
        style: () => ({
          backgroundColor: color(),
          color: "white",
          fontWeight: "bold",
        }),
      },
      "Hello"
    )
  );
}

mount(App, document.body);
