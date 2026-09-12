import type Lenis from "lenis";

/** Module-level handle so any component can call scrollTo without context plumbing. */
let instance: Lenis | null = null;
export const setLenis = (l: Lenis | null) => { instance = l; };
export const getLenis = () => instance;

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (instance) { instance.start(); instance.scrollTo(el, { offset: 0, duration: 1.6, force: true }); }
  else el.scrollIntoView({ behavior: "smooth" });
}
