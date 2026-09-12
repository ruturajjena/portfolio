"use client";
import { useCallback, useLayoutEffect, useRef } from "react";
import { DATA_INTRO, DATA_STAGES } from "@/data/site";
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

const getProgress = () => scroll.progress.data;
const isActive = () => scroll.view.data > 0 && scroll.view.data < 1;

/** Pinned cinematic sequence: the data plate is scrubbed by scroll while the WebGL network reorganises. */
export function DataSection() {
  const ref = useRef<HTMLElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const near = useInView(ref, "120% 0px 120% 0px");
  const src = useMediaSrc(asset("/assets/video/data.mp4"), asset("/assets/video/data-sm.mp4"));
  useSectionProgress("data", ref, { dark: true });
  useVideoScrub("data", { getProgress, isActive, autoplay: reduced, smoothing: 8 });
  const setVideo = useCallback((el: HTMLVideoElement | null) => registerMedia("data", el), []);

  useLayoutEffect(() => {
    const el = intro.current;
    if (!el) return;
    const tick = () => {
      const p = scroll.progress.data;
      const o = 1 - Math.min(1, Math.max(0, (p - 0.04) / 0.1));
      el.style.opacity = String(o);
      el.style.transform = `translate3d(0, ${(1 - o) * -12}px, 0)`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <section id="data" ref={ref} className="dark-section relative h-[520vh] text-[#f6f4ef]" aria-label="Data engineering">
      <div className="sticky top-0 h-screen overflow-hidden">
        {src && (
          <video
            ref={setVideo}
            className="plate-media"
            data-plate="data"
            src={near ? src : undefined}
            poster={asset("/assets/video/data-poster.jpg")}
            muted
            playsInline
            preload={near ? "auto" : "none"}
            aria-hidden
            tabIndex={-1}
          />
        )}
        <PlateProtection tone="dark" />
        <div className="container-x relative z-10 flex h-full flex-col justify-between pb-[8vh] pt-[calc(var(--nav-h)+4vh)]">
          <div ref={intro} className="max-w-[40rem]">
            <Eyebrow>{DATA_INTRO.eyebrow}</Eyebrow>
            <h2 className="display-md mt-4 font-medium">{DATA_INTRO.title}</h2>
          </div>
          <StageLabels stages={DATA_STAGES} getProgress={getProgress} label="Data engineering stages" />
        </div>
      </div>
    </section>
  );
}
