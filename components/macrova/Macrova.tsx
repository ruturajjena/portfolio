"use client";
import { useEffect, useRef } from "react";
import { MACROVA } from "@/data/site";
import { useSectionProgress } from "@/lib/use-section-progress";
import { scroll } from "@/lib/scroll-store";
import { gsap } from "@/lib/gsap";
import { Magnetic } from "@/components/ui/Magnetic";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealLines } from "@/components/ui/RevealLines";
import { FadeIn } from "@/components/ui/FadeIn";

/** Pinned product film. The DOM column tracks the film's stage; the device lives in WebGL. */
export function Macrova() {
  const ref = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const stage = useRef<HTMLParagraphElement>(null);
  useSectionProgress("macrova", ref, { dark: true });

  useEffect(() => {
    const items = list.current ? Array.from(list.current.querySelectorAll<HTMLElement>("li")) : [];
    let last = -1;
    const tick = () => {
      const p = scroll.progress.macrova;
      const s = Math.min(4, Math.floor(p * 5));
      if (s === last) return;
      last = s;
      // capabilities light up one after another from the "layers" stage onwards
      items.forEach((li, i) => { li.style.opacity = i <= Math.max(0, s - 1) ? "1" : "0.35"; });
      if (stage.current) stage.current.textContent = `${String(s + 1).padStart(2, "0")} — ${MACROVA.stages[s]}`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <section id="macrova" ref={ref} className="dark-section relative h-[420vh] text-[#f6f4ef]" aria-label="Macrova">
      <div className="sticky top-0 flex h-screen items-end overflow-hidden md:items-center">
        <div className="container-x grid w-full grid-cols-12 gap-x-6 pb-[8vh] pt-[var(--nav-h)] md:pb-0">
          <div className="col-span-12 md:col-span-5">
            <Eyebrow className="!text-white/50">{MACROVA.eyebrow}</Eyebrow>
            <RevealLines as="h2" lines={[MACROVA.name]} className="display-lg mt-4 font-medium uppercase" />
            <FadeIn as="p" className="mt-6 max-w-[26rem] text-[1.125rem] leading-[1.5] text-white/85 md:text-[1.25rem]">{MACROVA.tagline}</FadeIn>
            <FadeIn as="p" delay={0.1} className="mt-4 hidden max-w-[26rem] text-[0.9375rem] leading-[1.6] text-white/60 md:block">{MACROVA.body}</FadeIn>
            <FadeIn delay={0.15} className="mt-8">
              <p ref={stage} className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-white/45">01 — {MACROVA.stages[0]}</p>
              <ol ref={list} className="mt-4 border-t border-white/15">
                {MACROVA.capabilities.map((c) => (
                  <li key={c.label} className="grid grid-cols-[9rem_1fr] gap-4 border-b border-white/10 py-3 transition-opacity duration-500" style={{ opacity: 0.35 }}>
                    <span className="font-display text-[1rem] font-medium tracking-[-0.01em] md:text-[1.0625rem]">{c.label}</span>
                    <span className="hidden text-[0.875rem] leading-[1.5] text-white/60 md:block">{c.body}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6">
                <Magnetic>
                  <a href={MACROVA.href} target="_blank" rel="noopener noreferrer" data-cursor="VISIT" className="link-underline inline-flex items-center gap-2 font-mono text-[0.75rem] uppercase tracking-[0.2em]">
                    {MACROVA.hrefLabel} <span aria-hidden>↗</span><span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Magnetic>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
