"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { setLenis } from "@/lib/lenis";
import { scroll } from "@/lib/scroll-store";
import { bindPointer } from "@/lib/pointer";

/** Lenis ↔ GSAP ScrollTrigger bridge. Lenis drives the ticker; ScrollTrigger reads it. */
export function SmoothScroll() {
  useEffect(() => {
    bindPointer();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = new Lenis({
      lerp: reduced ? 1 : 0.085,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      smoothWheel: !reduced,
      syncTouch: false,
    });
    setLenis(lenis);
    lenis.on("scroll", (e: { scroll: number; velocity: number }) => {
      scroll.scrollY = e.scroll;
      scroll.velocity = e.velocity;
      ScrollTrigger.update();
    });
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    // Fonts + media can shift layout after first paint.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => {
      gsap.ticker.remove(raf);
      window.removeEventListener("load", refresh);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
  return null;
}
