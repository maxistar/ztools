import { signal, effect, enhance } from "../../dist/ztools.client.full.js";

function collectRefs(root) {
  const out = {};
  const all = root.querySelectorAll("[data-ref]");

  for (const el of all) {
    const name = el.getAttribute("data-ref");
    if (!name) continue;

    if (out[name] == null) {
      out[name] = el;
    } else if (Array.isArray(out[name])) {
      out[name].push(el);
    } else {
      out[name] = [out[name], el];
    }
  }

  return out;
}

function enhanceWithRefs(root, setup) {
  const refs = collectRefs(root);
  return enhance(root, () => setup({ refs }));
}

const root = document.getElementById("counter-app");

enhanceWithRefs(root, ({ refs }) => {
  const initial = Number(refs.value.textContent || "0");
  const count = signal(initial);

  refs.inc.addEventListener("click", () => {
    count.set(count() + 1);
  });

  refs.dec.addEventListener("click", () => {
    count.set(count() - 1);
  });

  effect(() => {
    refs.value.textContent = String(count());
  });
});
