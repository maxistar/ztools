
import { signal, computed, effect, batch, enhance } from "../../ztools.js";

function normalize(s) {
  return String(s || "").toLowerCase();
}

function compare(a, b) {
  // localeCompare хорош для строк; для чисел можно расширить
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

enhance(document.getElementById("app"), (root) => {
  const input = root.querySelector("#q");
  const shownEl = root.querySelector("#shown");
  const table = root.querySelector("#contacts");
  const tbody = table.querySelector("tbody");

  const ths = Array.from(table.querySelectorAll("th[data-sort]"));
  const rows = Array.from(tbody.querySelectorAll("tr[data-row]"));

  // Предвычисляем searchable + поля сортировки
  const meta = rows.map((tr) => {
    const name = tr.dataset.name || tr.children[0]?.textContent || "";
    const email = tr.dataset.email || tr.children[1]?.textContent || "";
    const phone = tr.dataset.phone || tr.children[2]?.textContent || "";
    return {
      tr,
      fields: {
        name: normalize(name),
        email: normalize(email),
        phone: normalize(phone)
      },
      hay: normalize(name + " " + email + " " + phone)
    };
  });

  // signals
  const query = signal("");
  const sortKey = signal("name"); // name | email | phone
  const sortDir = signal("asc");  // asc | desc

  // input -> signal
  input.addEventListener("input", (e) => query.set(e.target.value));

  // header clicks -> sorting
  ths.forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
      batch(() => {
        if (sortKey() === key) {
          sortDir.set(sortDir() === "asc" ? "desc" : "asc");
        } else {
          sortKey.set(key);
          sortDir.set("asc");
        }
      });
    });
  });

  // UI state for headers
  effect(() => {
    const k = sortKey();
    const d = sortDir();
    ths.forEach((th) => {
      const isActive = th.getAttribute("data-sort") === k;
      th.classList.toggle("active", isActive);
      th.classList.toggle("asc", isActive && d === "asc");
      th.classList.toggle("desc", isActive && d === "desc");
    });
  });

  // Derived list of visible rows (meta indices)
  const visible = computed(() => {
    const q = normalize(query().trim());
    if (!q) return meta;
    return meta.filter((m) => m.hay.includes(q));
  });

  // Filter: toggle hidden, update counter
  effect(() => {
    const vis = new Set(visible().map((m) => m.tr));
    let shown = 0;

    for (const m of meta) {
      const ok = vis.has(m.tr);
      m.tr.hidden = !ok;
      if (ok) shown++;
    }

    shownEl.textContent = String(shown);
  });

  // Sort + reorder only visible rows (hidden ones keep their nodes)
  effect(() => {
    const key = sortKey();
    const dir = sortDir();
    const list = visible().slice(); // copy

    list.sort((a, b) => {
      const r = compare(a.fields[key], b.fields[key]);
      return dir === "asc" ? r : -r;
    });

    // Reorder in DOM: appendChild moves existing nodes (no recreation)
    const frag = document.createDocumentFragment();
    for (const m of list) frag.appendChild(m.tr);
    tbody.appendChild(frag);

    // hidden rows останутся в tbody тоже; мы их не трогаем (они просто hidden)
    // Если хочешь, можно их всегда держать внизу — это уже отдельная политика.
  });
});