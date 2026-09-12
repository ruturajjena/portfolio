"use client";
import { useCallback, useLayoutEffect, useRef } from "react";
import { HERO } from "@/data/site";
import { useSectionProgress } from "@/lib/use-section-progress";
import { registerMedia } from "@/lib/media-registry";
import { asset } from "@/lib/asset";
import { useMediaSrc } from "@/lib/use-media-src";
import { gsap } from "@/lib/gsap";
import { RevealLines } from "@/components/ui/RevealLines";
import { useVideoScrub } from "@/lib/use-video-scrub";
import { useReducedMotion } from "@/lib/device";
import { scroll } from "@/lib/scroll-store";
import { clamp01 } from "@/lib/math";

// The head turn plays across the first 75% of the hero, before the portrait has fully receded.
const getPortraitProgress = () => clamp01(scroll.progress.hero / 0.75);
const isHeroActive = () => scroll.view.hero < 0.9995;

/**
 * Full-screen cinematic hero. The section is 260vh tall with a sticky stage;
 * the WebGL layer reads its progress to recede and dissolve the portrait.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  useSectionProgress("hero", ref);
  const src = useMediaSrc(asset("/assets/video/portrait.mp4"), asset("/assets/video/portrait-sm.mp4"));
  const reduced = useReducedMotion();
  useVideoScrub("portrait", { getProgress: getPortraitProgress, isActive: isHeroActive, autoplay: reduced, smoothing: 7 });

  const videoRef = useCallback((el: HTMLVideoElement | null) => registerMedia("portrait", el), []);

  useLayoutEffect(() => {
    const section = ref.current, text = copy.current;
    if (!section || !text) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const lines = text.querySelectorAll<HTMLElement>("h1 > .mask-line");
      const meta = text.querySelectorAll<HTMLElement>("[data-hero-meta]");
      const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.6 } });
      tl.to(lines, { yPercent: -60, opacity: 0, letterSpacing: "-0.02em", stagger: 0.04, ease: "power2.in", duration: 0.32 }, 0.16)
        .to(meta, { y: -24, opacity: 0, ease: "power2.in", duration: 0.22 }, 0.2)
        .to(hint.current, { opacity: 0, duration: 0.1 }, 0.02);
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section id="hero" ref={ref} className="relative h-[260vh]" aria-label="Introduction">
      <div className="sticky top-0 h-screen overflow-hidden">
        {src && (
          <video
            ref={videoRef}
            className="plate-media"
            data-plate="portrait"
            src={src}
            poster={asset("/assets/video/portrait-poster.webp")}
            muted
            playsInline
            preload="auto"
            aria-hidden
            tabIndex={-1}
          />
        )}
        <div ref={copy} className="container-x relative z-10 flex h-full flex-col justify-end pb-[9vh] pt-[var(--nav-h)] md:pb-[11vh]">
          <RevealLines
            as="h1"
            lines={HERO.headline}
            immediate
            delay={0.35}
            className="display-xl max-w-[12ch] font-medium"
            lineClassName="[&>span]:inline-block"
          />
          <div className="mt-7 flex flex-col gap-2 md:mt-10 md:flex-row md:items-end md:justify-between">
            <p data-hero-meta className="font-mono text-[0.75rem] uppercase tracking-[0.2em] text-ink-2">{HERO.roles}</p>
            <p data-hero-meta className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ink-3">{HERO.founder}</p>
          </div>
        </div>
        <div ref={hint} className="absolute bottom-6 right-[var(--gutter)] z-10 hidden items-center gap-3 md:flex" aria-hidden>
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.25em] text-ink-3">{HERO.scrollHint}</span>
          <span className="relative block h-10 w-px overflow-hidden bg-rule"><span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollhint_2.2s_var(--ease-in-out)_infinite] bg-ink" /></span>
        </div>
      </div>
    </section>
  );
}
