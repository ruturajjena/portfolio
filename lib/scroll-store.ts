import type { SectionId } from "@/data/site";

/**
 * Mutable scroll state shared between GSAP ScrollTrigger (writer) and the
 * Three.js frame loop (reader). Deliberately NOT React state — reading it
 * every frame must never trigger a render.
 */
export type ScrollState = {
  /** 0→1 while the section is "active" (pinned range or full height). */
  progress: Record<SectionId, number>;
  /** 0 when the section top enters the viewport bottom, 1 when its bottom leaves the top. */
  view: Record<SectionId, number>;
  /** Which section currently owns the viewport centre. */
  active: SectionId;
  scrollY: number;
  velocity: number;
  /** per-section darkness contribution (0..1) */
  darkness: Record<SectionId, number>;
  /** 0 = light environment, 1 = dark environment (target, derived as max of darkness). */
  darkTarget: number;
};

const ids: SectionId[] = ["hero", "positioning", "data", "skills", "builds", "macrova", "design", "brand", "about", "contact"];
const zero = () => Object.fromEntries(ids.map((k) => [k, 0])) as Record<SectionId, number>;

export const scroll: ScrollState = {
  progress: zero(),
  view: zero(),
  active: "hero",
  scrollY: 0,
  velocity: 0,
  darkness: zero(),
  darkTarget: 0,
};

export function setDarkness(id: SectionId, v: number) {
  scroll.darkness[id] = v;
  let m = 0;
  for (const k of ids) if (scroll.darkness[k] > m) m = scroll.darkness[k];
  scroll.darkTarget = m;
}

export const SECTION_IDS = ids;
