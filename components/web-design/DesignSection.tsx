"use client";
import { useCallback, useLayoutEffect, useRef } from "react";
import { DESIGN_INTRO, DESIGN_STAGES } from "@/data/site";
import { useSectionProgress } from "@/lib/use-section-progress";
import { useVideoScrub } from "@/lib/use-video-scrub";
import { registerMedia } from "@/lib/media-registry";
import { asset } from "@/lib/asset";
import { useMediaSrc } from "@/lib/use-media-src";
import { useInView } from "@/lib/use-in-view";
import { useReducedMotion } from "@/lib/device";
import { scroll } from "@/lib/scroll-store";
import { gsap } from "@/lib/gsap";
import { StageLabels } from "@/components/ui/StageLabels";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlateProtection } from "@/components/ui/PlateProtection";

const getProgress = () => scroll.progress.design;
const isActive = () => scroll.view.design > 0 && scroll.view.design < 1;

/** Pinned cinematic sequence: the design plate is scrubbed by scroll while the WebGL layout composes itself. */
export function DesignSection() {
  const ref = useRef<HTMLElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const near = useInView(ref, "120% 0px 120% 0px");
  const src = useMediaSrc(asset("/assets/video/design.mp4"), asset("/assets/video/design-sm.mp4"));
  useSectionProgress("design", ref);
  useVideoScrub("design", { getProgress, isActive, autoplay: reduced, smoothing: 8 });
  const setVideo = useCallback((el: HTMLVideoElement | null) => registerMedia("design", el), []);

  useLayoutEffect(() => {
    const el = intro.current;
    if (!el) return;
    const tick = () => {
      const p = scroll.progress.design;
      const o = 1 - Math.min(1, Math.max(0, (p - 0.04) / 0.1));
      el.style.opacity = String(o);
      el.style.transform = `translate3d(0, ${(1 - o) * -12}px, 0)`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <section id="design" ref={ref} className="relative h-[520vh]" aria-label="Web design">
      <div className="sticky top-0 h-screen overflow-hidden">
        {src && (
          <video
            ref={setVideo}
            className="plate-media"
            data-plate="design"
            src={near ? src : undefined}
            poster={asset("/assets/video/design-poster.jpg")}
            muted
            playsInline
            preload={near ? "auto" : "none"}
            aria-hidden
            tabIndex={-1}
          />
        )}
        <PlateProtection />
        <div className="container-x relative z-10 flex h-full flex-col justify-between pb-[8vh] pt-[calc(var(--nav-h)+4vh)]">
          <div ref={intro} className="max-w-[40rem]">
            <Eyebrow>{DESIGN_INTRO.eyebrow}</Eyebrow>
            <h2 className="display-md mt-4 font-medium">{DESIGN_INTRO.title}</h2>
          </div>
          <StageLabels stages={DESIGN_STAGES} getProgress={getProgress} label="Web design stages" />
        </div>
      </div>
    </section>
  );
}
