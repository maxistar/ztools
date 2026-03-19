import { signal, computed, effect, batch, enhanceWithRefs } from "../../dist/ztools.client.full.js";

function normalize(s) {
  return String(s || "").toLowerCase();
}

function compare(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

const root = document.getElementById("contacts-app");

enhanceWithRefs(root, ({ refs }) => {
  const query = signal("");
  const sortKey = signal("name");
  const sortDir = signal("asc");

  const rows = Array.isArray(refs.row) ? refs.row : refs.row ? [refs.row] : [];

  const meta = rows.map((tr) => {
    const name = tr.dataset.name || tr.children[0]?.textContent || "";
    const email = tr.dataset.email || tr.children[1]?.textContent || "";
    const phone = tr.dataset.phone || tr.children[2]?.textContent || "";

    return {
      tr,
      fields: {
        name: normalize(name),
        email: normalize(email),
        phone: normalize(phone),
      },
      hay: normalize(name + " " + email + " " + phone),
    };
  });

  refs.q.addEventListener("input", (e) => {
    query.set(e.target.value);
  });

  function bindSort(refEl, key) {
    refEl.addEventListener("click", () => {
      batch(() => {
        if (sortKey() === key) {
          sortDir.set(sortDir() === "asc" ? "desc" : "asc");
        } else {
          sortKey.set(key);
          sortDir.set("asc");
        }
      });
    });
  }

  bindSort(refs.sortName, "name");
  bindSort(refs.sortEmail, "email");
  bindSort(refs.sortPhone, "phone");

  effect(() => {
    const k = sortKey();
    const d = sortDir();

    const headers = [
      [refs.sortName, "name"],
      [refs.sortEmail, "email"],
      [refs.sortPhone, "phone"],
    ];

    for (const [el, key] of headers) {
      const active = key === k;
      el.classList.toggle("active", active);
      el.classList.toggle("asc", active && d === "asc");
      el.classList.toggle("desc", active && d === "desc");
    }
  });

  const visible = computed(() => {
    const q = normalize(query().trim());
    if (!q) return meta;
    return meta.filter((m) => m.hay.includes(q));
  });

  effect(() => {
    const vis = new Set(visible().map((m) => m.tr));
    let shown = 0;

    for (const m of meta) {
      const ok = vis.has(m.tr);
      m.tr.hidden = !ok;
      if (ok) shown++;
    }

    refs.shown.textContent = String(shown);
  });

  effect(() => {
    const key = sortKey();
    const dir = sortDir();
    const list = visible().slice();

    list.sort((a, b) => {
      const r = compare(a.fields[key], b.fields[key]);
      return dir === "asc" ? r : -r;
    });

    const frag = document.createDocumentFragment();
    for (const m of list) frag.appendChild(m.tr);
    refs.body.appendChild(frag);
  });
});
