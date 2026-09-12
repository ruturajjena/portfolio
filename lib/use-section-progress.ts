"use client";
import { useLayoutEffect, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scroll, setDarkness } from "@/lib/scroll-store";
import type { SectionId } from "@/data/site";

type Options = {
  /** Section is dark (black environment). Drives the WebGL background + nav theme. */
  dark?: boolean;
  /** Called with 0..1 progress; runs alongside the store write. */
  onProgress?: (p: number) => void;
};

/**
 * Registers two ScrollTriggers for a section:
 *  - progress: 0→1 across the sticky range (start top-top, end bottom-bottom)
 *  - view:     0→1 from entering the viewport bottom to leaving the top
 * Both write into the shared scroll store. Pinned sections use CSS sticky,
 * so ScrollTrigger only measures — nothing is repositioned by GSAP.
 */
export function useSectionProgress(id: SectionId, ref: RefObject<HTMLElement | null>, opts: Options = {}) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (st) => {
          scroll.progress[id] = st.progress;
          opts.onProgress?.(st.progress);
        },
      });
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (st) => { scroll.view[id] = st.progress; },
        onEnter: () => { scroll.active = id; },
        onEnterBack: () => { scroll.active = id; },
      });
      if (opts.dark) {
        // Darken while the section top travels from 80% -> 20% of the viewport,
        // lighten again while its bottom travels the same band.
        let enter = 0, leave = 0;
        const apply = () => setDarkness(id, enter * (1 - leave));
        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          end: "top 25%",
          onUpdate: (st) => { enter = st.progress; apply(); },
          onRefresh: (st) => { enter = st.progress; apply(); },
        });
        ScrollTrigger.create({
          trigger: el,
          start: "bottom 85%",
          end: "bottom 25%",
          onUpdate: (st) => { leave = st.progress; apply(); },
          onRefresh: (st) => { leave = st.progress; apply(); },
        });
      }
    });
    return () => ctx.revert();
  }, [id, ref, opts.dark]); // eslint-disable-line react-hooks/exhaustive-deps
}
