import { defineComponent, tags as t, signal, computed, effect, batch, css } from "../../ztools.client.js";

const normalize = (s) => String(s || "").toLowerCase();
const compare = (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" });

defineComponent("z-contacts-table", (props, host) => {
    // ---------- state ----------
    const query = signal("");
    const sortKey = signal("name"); // name|email|phone
    const sortDir = signal("asc");  // asc|desc
    const rows = signal([]);        // array of { id?, name, email, phone }

    // Expose a framework-friendly property API:
    // React/Vue can set: ref.current.data = [...]
    if (!host.__zContactsPatched) {
        host.__zContactsPatched = true;

        Object.defineProperty(host, "data", {
            get() { return rows(); },
            set(v) { rows.set(Array.isArray(v) ? v : []); }
        });

        Object.defineProperty(host, "state", {
            get() { return { query: query(), sortKey: sortKey(), sortDir: sortDir() }; }
        });
    }

    async function loadFromSrc(url) {
        if (!url) return;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) rows.set(data);
            else props.emit("error", { message: "src JSON must be an array" });
        } catch (e) {
            props.emit("error", { message: String(e?.message || e) });
        }
    }

    // react to <z-contacts-table src="...">
    effect(() => {
        const src = props.$.src ? props.$.src() : host.getAttribute("src");
        if (src) loadFromSrc(src);
    });

    const filtered = computed(() => {
        const q = normalize(query().trim());
        const list = rows();
        if (!q) return list;
        return list.filter(r => normalize(`${r.name} ${r.email} ${r.phone}`).includes(q));
    });

    const shown = computed(() => filtered().length);

    const sorted = computed(() => {
        const key = sortKey();
        const dir = sortDir();
        const list = filtered().slice();

        list.sort((a, b) => {
            const r = compare(normalize(a[key]), normalize(b[key]));
            return dir === "asc" ? r : -r;
        });

        return list;
    });

    // notify host about state changes
    effect(() => {
        props.emit("change", {
            query: query(),
            sortKey: sortKey(),
            sortDir: sortDir(),
            shown: shown()
        });
    });

    function toggleSort(key) {
        batch(() => {
            if (sortKey() === key) sortDir.set(sortDir() === "asc" ? "desc" : "asc");
            else { sortKey.set(key); sortDir.set("asc"); }
        });
    }

    function Th(key, label) {
        return t.th(
            {
                className: () => {
                    const active = sortKey() === key;
                    const dir = sortDir();
                    return "th" + (active ? " active " + dir : "");
                },
                onClick: () => toggleSort(key)
            },
            label,
            t.span({ className: "hint" }, "⇅")
        );
    }

    function Row(r) {
        return t.tr(
            {
                className: "row",
                onClick: () => props.emit("rowclick", { row: r })
            },
            t.td(r.name),
            t.td(r.email || "—"),
            t.td(r.phone || "—")
        );
    }

    // ---------- view (Shadow DOM, black box for React/Vue) ----------
    return t.div(
        { className: "wrap" },

        t.style(css`
      :host { display:block; }
      .wrap { font-family: system-ui, sans-serif; }
      .toolbar { display:flex; gap:12px; align-items:center; margin: 8px 0 12px; }
      .q { padding: 8px 10px; width: 420px; max-width: 100%; box-sizing: border-box; }
      .muted { opacity: .75; }

      table { width:100%; border-collapse: collapse; }
      th, td { text-align:left; padding: 10px 8px; border-bottom: 1px solid #eee; }
      th { cursor:pointer; user-select:none; }

      .hint { opacity:.4; margin-left: 6px; font-size: 12px; }
      th.active .hint { opacity: 1; }
      th.active.asc .hint::after { content: " ↑"; }
      th.active.desc .hint::after { content: " ↓"; }

      tr.row:hover { background: rgba(0,0,0,0.03); }
    `),

        t.div(
            { className: "toolbar" },
            t.input({
                className: "q",
                placeholder: "Filter by name/email/phone…",
                value: () => query(),
                onInput: (e) => query.set(e.target.value)
            }),
            t.span({ className: "muted" }, () => `Shown: ${shown()}`)
        ),

        t.table(
            t.thead(
                t.tr(
                    Th("name", "Name"),
                    Th("email", "Email"),
                    Th("phone", "Phone")
                )
            ),
            t.tbody(
                // reactive children: function returning array of Nodes
                () => sorted().map(Row)
            )
        )
    );
}, {
    shadow: true,
    observedAttributes: ["src"]
});
