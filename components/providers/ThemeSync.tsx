"use client";
import { useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { scroll } from "@/lib/scroll-store";

/** Mirrors the WebGL environment darkness onto <html> so DOM chrome (nav, cursor) can flip contrast. */
export function ThemeSync() {
  useEffect(() => {
    const root = document.documentElement;
    let dark = false;
    const tick = () => {
      const next = scroll.darkTarget > 0.5;
      if (next !== dark) {
        dark = next;
        root.classList.toggle("theme-dark", dark);
        root.style.setProperty("--theme-fg", dark ? "#f6f4ef" : "#0e0e0f");
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  return null;
}
