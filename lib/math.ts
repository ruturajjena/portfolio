export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const clamp01 = (v: number) => clamp(v, 0, 1);
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
/** Frame-rate independent exponential damping. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));
/** Map progress p onto a sub-range [a, b] → 0..1 */
export const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Deterministic PRNG (mulberry32) so formations are stable between renders. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * For a section of `sectionVh` height with a 100vh sticky panel, returns how far
 * the panel sits from its pinned position as a fraction of the viewport height,
 * given the section's view progress (0 = top enters bottom, 1 = bottom leaves top).
 * Positive = panel is still below; negative = panel is scrolling away upward.
 */
export function panelOffset(v: number, sectionVh: number): number {
  const travel = sectionVh + 100;
  const enter = 100 / travel;
  const exit = sectionVh / travel;
  if (v < enter) return ((enter - v) * travel) / 100;
  if (v > exit) return (-(v - exit) * travel) / 100;
  return 0;
}
/** True while the panel is on screen at all. */
export const panelVisible = (v: number) => v > 0.0005 && v < 0.9995;
