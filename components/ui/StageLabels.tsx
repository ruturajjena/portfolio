"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import type { Stage } from "@/data/site";
import { clamp01 } from "@/lib/math";

type Props = {
  stages: Stage[];
  getProgress: () => number;
  /** section id, used for aria */
  label: string;
  className?: string;
};

/**
 * Crossfading stage captions driven by section progress. Each stage owns an
 * equal window; captions ease in over the first 18% and out over the last 18%.
 * Styles are written directly on the DOM from the ticker — no React state.
 */
export function StageLabels({ stages, getProgress, label, className = "" }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-stage]"));
    const ticks = Array.from(el.querySelectorAll<HTMLElement>("[data-tick]"));
    const n = stages.length;
    const tick = () => {
      const p = clamp01(getProgress());
      const active = Math.min(n - 1, Math.floor(p * n));
      items.forEach((item, i) => {
        const local = p * n - i; // 0..1 inside my window
        let o = 0;
        if (reduced) o = i === active ? 1 : 0;
        else {
          const fadeIn = clamp01(local / 0.18);
          const fadeOut = 1 - clamp01((local - 0.82) / 0.18);
          o = i === n - 1 ? fadeIn : Math.min(fadeIn, fadeOut);
          if (local < 0 || local > 1.0) o = 0;
        }
        item.style.opacity = String(o);
        item.style.transform = reduced ? "none" : `translate3d(0, ${(1 - o) * 14}px, 0)`;
        item.style.visibility = o > 0.01 ? "visible" : "hidden";
        if (o > 0.01) item.removeAttribute("aria-hidden"); else item.setAttribute("aria-hidden", "true");
      });
      ticks.forEach((t, i) => { t.style.opacity = i <= active ? "1" : "0.25"; });
      if (rail.current) rail.current.style.transform = `scaleY(${p})`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [stages, getProgress]);

  return (
    <div ref={root} className={`pointer-events-none ${className}`} aria-label={label}>
      <div className="relative min-h-[9.5rem] md:min-h-[8rem]">
        {stages.map((s) => (
          <div key={s.id} data-stage className="absolute inset-x-0 bottom-0 max-w-[34rem] opacity-0 will-change-[opacity,transform]">
            <p className="eyebrow mb-3 flex items-center gap-3"><span>{s.index}</span><span className="hairline w-8" /><span>{`${stages.indexOf(s) + 1} / ${stages.length}`}</span></p>
            <h3 className="display-md font-medium uppercase">{s.label}</h3>
            <p className="lede mt-3 max-w-[26rem] text-[1rem] md:text-[1.0625rem]">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 hidden items-center gap-2 md:flex">
        {stages.map((s) => (
          <span key={s.id} data-tick className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-current transition-opacity duration-500">{s.label}<span className="mx-3 opacity-40">/</span></span>
        ))}
      </div>
      <div className="absolute right-0 top-[15vh] hidden h-[70vh] w-px md:block" style={{ backgroundColor: "color-mix(in srgb, currentColor 18%, transparent)" }}>
        <div ref={rail} className="h-full w-full origin-top bg-current" style={{ transform: "scaleY(0)" }} />
      </div>
    </div>
  );
}
