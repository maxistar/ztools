import { signal, effect, enhanceWithRefs } from "../../dist/ztools.client.full.js";

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
