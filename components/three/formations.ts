import { seeded } from "@/lib/math";
import type { SectionId } from "@/data/site";

/**
 * Target positions for the persistent ambient particle field, one per section.
 * The field damps toward whichever formation belongs to the active section, so
 * the same particles read as portrait dust → data lattice → design grid → halo
 * → convergence, giving the page one continuous visual system.
 */
export type Formation = Float32Array;

const cache = new Map<string, Formation>();

export function formation(id: SectionId | "contact-converge" | "contact-disperse", n: number, vw: number, vh: number): Formation {
  const key = `${id}:${n}:${vw.toFixed(1)}:${vh.toFixed(1)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const out = new Float32Array(n * 3);
  const rnd = seeded(1337 + id.length * 17);
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) * 1.4;
  const set = (i: number, x: number, y: number, z: number) => { out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z; };

  switch (id) {
    case "hero": {
      const cx = vw > 7 ? 1.5 : 0;
      for (let i = 0; i < n; i++) set(i, cx + gauss() * 2.3, 0.2 + gauss() * 1.9, -1.2 + gauss() * 2.2);
      break;
    }
    case "positioning":
    case "skills":
    case "about": {
      for (let i = 0; i < n; i++) set(i, (rnd() - 0.5) * (vw + 3), (rnd() - 0.5) * (vh + 2), -4 + rnd() * 2.5);
      break;
    }
    case "data": {
      for (let i = 0; i < n; i++) set(i, (rnd() - 0.5) * (vw + 4), (rnd() - 0.5) * (vh + 3), -6 + rnd() * 2);
      break;
    }
    case "builds": {
      for (let i = 0; i < n; i++) set(i, (rnd() - 0.5) * (vw + 6), (rnd() - 0.5) * (vh + 4), -7 + rnd() * 4);
      break;
    }
    case "macrova": {
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2; const r = 2.4 + gauss() * 0.6;
        set(i, Math.cos(a) * r * 1.3, Math.sin(a) * r * 0.8 + gauss() * 0.4, -2 + gauss() * 1.4);
      }
      break;
    }
    case "design": {
      const cols = Math.max(8, Math.round(Math.sqrt(n * (vw / vh)) * 0.75));
      const rows = Math.max(6, Math.ceil(n / cols));
      const w = vw + 2, h = vh + 1.5;
      for (let i = 0; i < n; i++) {
        const c = i % cols, r = Math.floor(i / cols) % rows;
        const layer = Math.floor(i / (cols * rows));
        set(i, -w / 2 + (c + 0.5) * (w / cols) + (rnd() - 0.5) * 0.05, -h / 2 + (r + 0.5) * (h / rows) + (rnd() - 0.5) * 0.05, -2.5 - layer * 2);
      }
      break;
    }
    case "brand": {
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2; const r = 3.0 + gauss() * 0.35;
        set(i, Math.cos(a) * r, Math.sin(a) * r * 0.55 + gauss() * 0.2, -1.5 + gauss() * 0.8);
      }
      break;
    }
    case "contact":
    case "contact-converge": {
      for (let i = 0; i < n; i++) {
        const u = rnd(), v = rnd();
        const th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1);
        const r = 0.35 + rnd() * 0.25;
        set(i, r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), -1 + r * Math.cos(ph));
      }
      break;
    }
    case "contact-disperse": {
      for (let i = 0; i < n; i++) {
        const u = rnd(), v = rnd();
        const th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1);
        const r = 5 + rnd() * 6;
        set(i, r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th) * 0.7, -3 + r * Math.cos(ph) * 0.6);
      }
      break;
    }
  }
  cache.set(key, out);
  return out;
}
