import { signal, tags as t, Show, For, mount } from "../../dist/ztools.client.full.js";

function App() {
  const showTable = signal(true);
  const rows = signal([
    { id: 1, label: "Row 1" },
    { id: 2, label: "Row 2" },
  ]);
  const nextId = signal(3);

  function addRow() {
    const id = nextId();
    rows.set([...rows(), { id, label: `Row ${id}` }]);
    nextId.set(id + 1);
  }

  function removeRow() {
    if (rows().length === 0) return;
    rows.set(rows().slice(0, -1));
  }

  return t.div(
    { className: "app" },

    t.h1("For + If demo"),

    t.div(
      { className: "toolbar" },
      t.label(
        t.input({
          type: "checkbox",
          checked: () => showTable(),
          onChange: (e) => showTable.set(e.target.checked),
        }),
        " Show table"
      ),
      t.button({ onClick: addRow }, "+"),
      t.button({ onClick: removeRow }, "-"),
      t.span({ className: "status" }, () => `Rows: ${rows().length}`),
    ),

    Show(
      () => showTable(),
      () => t.div(
        { className: "card" },
        t.table(
          t.thead(
            t.tr(
              t.th("ID"),
              t.th("Name"),
            )
          ),
          t.tbody(
            For(
              rows,
              (row) => t.tr(
                t.td(() => String(row.id)),
                t.td(() => row.label),
              ),
              (row) => row.id,
            )
          )
        )
      ),
      () => t.p({ className: "status" }, "Table is hidden (Show = false).")
    )
  );
}

mount(App, document.body);
