import {
  signal,
  computed,
  tag,
  For,
  Show,
  mount,
  batch,
  h,
} from "../../ztools.client.js";

import { apiFetch } from "./api.local.js";

const div = tag("div");
const h1 = tag("h1");
const h2 = tag("h2");
const input = tag("input");
const button = tag("button");
const strong = tag("strong");
const span = tag("span");
const small = tag("small");

async function api(method, url, body) {
  const res = await apiFetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    latency_ms: 150,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data && data.error ? data.error : "HTTP " + res.status;
    throw new Error(msg);
  }
  return data;
}

function AddressBookApp() {
  const q = signal("");
  const loading = signal(false);
  const error = signal(null);
  const contacts = signal([]);

  const editingId = signal(null); // string|null
  const name = signal("");
  const email = signal("");
  const phone = signal("");

  const isEditing = computed(() => editingId() != null);

  async function load() {
    loading.set(true);
    error.set(null);
    try {
      const data = await api(
        "GET",
        "/api/contacts?q=" + encodeURIComponent(q().trim()),
      );
      contacts.set(data);
    } catch (e) {
      error.set(e);
    } finally {
      loading.set(false);
    }
  }

  function startCreate() {
    batch(() => {
      editingId.set(null);
      name.set("");
      email.set("");
      phone.set("");
    });
  }

  function startEdit(c) {
    batch(() => {
      editingId.set(c.id);
      name.set(c.name || "");
      email.set(c.email || "");
      phone.set(c.phone || "");
    });
  }

  async function save() {
    const payload = {
      name: name().trim(),
      email: email().trim(),
      phone: phone().trim(),
    };

    loading.set(true);
    error.set(null);

    try {
      if (!payload.name) throw new Error("name is required");

      if (isEditing()) {
        await api(
          "PUT",
          "/api/contacts/" + encodeURIComponent(editingId()),
          payload,
        );
      } else {
        await api("POST", "/api/contacts", payload);
      }

      startCreate();
      await load();
    } catch (e) {
      error.set(e);
    } finally {
      loading.set(false);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this contact?")) return;

    loading.set(true);
    error.set(null);
    try {
      await api("DELETE", "/api/contacts/" + encodeURIComponent(id));
      if (editingId() === id) startCreate();
      await load();
    } catch (e) {
      error.set(e);
    } finally {
      loading.set(false);
    }
  }

  async function resetDemoData() {
    // просто стираем ключ — seed() восстановит
    localStorage.removeItem("ztools.crud.contacts.v1");
    await load();
  }

  // initial load
  load();

  return div(
    { className: "app" },
    h1("CRUD demo (REST adapter on localStorage)"),

    div(
      { className: "card toolbar" },
      div(
        { className: "row" },
        input({
          placeholder: "Search (name/email/phone)…",
          value: () => q(),
          onInput: (e) => q.set(e.target.value),
          onKeydown: (e) => {
            if (e.key === "Enter") load();
          },
        }),
        button({ onClick: load, disabled: () => loading() }, () =>
          loading() ? "Loading…" : "Search",
        ),
      ),
      div(
        { className: "row" },
        button({ onClick: startCreate }, "New"),
        button({ onClick: resetDemoData }, "Reset demo data"),
      ),
    ),

    Show(error, (e) => div({ className: "card error" }, "Error: ", e.message)),

    div(
      { className: "card" },
      h2(() => (isEditing() ? "Edit contact" : "Create contact")),
      div(
        { className: "grid" },
        input({
          placeholder: "Name*",
          value: () => name(),
          onInput: (e) => name.set(e.target.value),
        }),
        input({
          placeholder: "Email",
          value: () => email(),
          onInput: (e) => email.set(e.target.value),
        }),
        input({
          placeholder: "Phone",
          value: () => phone(),
          onInput: (e) => phone.set(e.target.value),
        }),
        div(
          { className: "row" },
          button({ onClick: save, disabled: () => loading() }, () =>
            loading() ? "Saving…" : "Save",
          ),
          Show(isEditing, () =>
            button(
              { onClick: () => remove(editingId()), disabled: () => loading() },
              "Delete",
            ),
          ),
        ),
      ),
      small(
        { className: "muted" },
        "This demo simulates REST calls (",
        h("code", "GET/POST/PUT/DELETE /api/contacts"),
        ") using localStorage.",
      ),
    ),

    div(
      { className: "list card" },
      div(
        { className: "row" },
        strong("Contacts"),
        span({ className: "muted" }, () => " (" + contacts().length + ")"),
      ),

      Show(
        () => loading() && contacts().length === 0,
        () => div("Loading…"),
        () =>
          Show(
            () => contacts().length === 0,
            () => div({ className: "muted" }, "No contacts found."),
            () =>
              For(
                contacts,
                (c) =>
                  div(
                    { className: "item" },
                    div(
                      strong(c.name),
                      small({ className: "muted" }, "id: " + c.id),
                    ),
                    div(c.email || small({ className: "muted" }, "—")),
                    div(c.phone || small({ className: "muted" }, "—")),
                    div(
                      { className: "row" },
                      button({ onClick: () => startEdit(c) }, "Edit"),
                      button(
                        {
                          onClick: () => remove(c.id),
                          disabled: () => loading(),
                        },
                        "Delete",
                      ),
                    ),
                  ),
                (c) => c.id,
              ),
          ),
      ),
    ),
  );
}

mount(AddressBookApp, document.body);
