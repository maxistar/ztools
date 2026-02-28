// api.local.js
const KEY = "ztools.crud.contacts.v1";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function nowId() {
  return String(Date.now()) + "-" + String(Math.random()).slice(2);
}

function readAll() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return seed();
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : seed();
  } catch {
    return seed();
  }
}

function writeAll(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function seed() {
  const initial = [
    { id: "1", name: "Alice", email: "alice@example.com", phone: "+49 111 111" },
    { id: "2", name: "Bob", email: "bob@example.com", phone: "+49 222 222" },
    { id: "3", name: "Clara", email: "clara@example.com", phone: "+49 333 333" }
  ];
  writeAll(initial);
  return initial;
}

function makeResponse(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return data; }
  };
}

// Very small router that understands:
// GET    /api/contacts?q=...
// POST   /api/contacts
// PUT    /api/contacts/:id
// DELETE /api/contacts/:id
export async function apiFetch(url, opts) {
  opts = opts || {};
  const method = (opts.method || "GET").toUpperCase();
  const latency = opts.latency_ms ?? 120;
  await sleep(latency);

  const u = new URL(url, location.origin);
  const path = u.pathname;

  // parse body
  let body = null;
  if (opts.body) {
    try { body = JSON.parse(opts.body); } catch { body = null; }
  }

  // list
  if (path === "/api/contacts" && method === "GET") {
    const q = (u.searchParams.get("q") || "").trim().toLowerCase();
    const list = readAll();
    const filtered = !q
      ? list
      : list.filter(c =>
          String(c.name || "").toLowerCase().includes(q) ||
          String(c.email || "").toLowerCase().includes(q) ||
          String(c.phone || "").toLowerCase().includes(q)
        );
    return makeResponse(200, filtered);
  }

  // create
  if (path === "/api/contacts" && method === "POST") {
    if (!body || !String(body.name || "").trim()) {
      return makeResponse(400, { error: "name is required" });
    }
    const list = readAll();
    const c = {
      id: nowId(),
      name: String(body.name).trim(),
      email: body.email ? String(body.email).trim() : "",
      phone: body.phone ? String(body.phone).trim() : ""
    };
    list.unshift(c);
    writeAll(list);
    return makeResponse(201, c);
  }

  // item routes
  const m = path.match(/^\/api\/contacts\/([^/]+)$/);
  if (m) {
    const id = decodeURIComponent(m[1]);
    const list = readAll();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return makeResponse(404, { error: "Not found" });

    if (method === "PUT") {
      if (!body || !String(body.name || "").trim()) {
        return makeResponse(400, { error: "name is required" });
      }
      list[idx] = {
        id,
        name: String(body.name).trim(),
        email: body.email ? String(body.email).trim() : "",
        phone: body.phone ? String(body.phone).trim() : ""
      };
      writeAll(list);
      return makeResponse(200, list[idx]);
    }

    if (method === "DELETE") {
      list.splice(idx, 1);
      writeAll(list);
      return makeResponse(204, null);
    }
  }

  return makeResponse(404, { error: "Unknown route: " + method + " " + path });
}