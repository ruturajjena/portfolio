"use client";
import { useEffect, type RefObject } from "react";
import { gsap } from "@/lib/gsap";

const SVG_NS = "http://www.w3.org/2000/svg";

export type FlowOptions = {
  /** paths inside the svg that carry packets */
  selector: string;
  perPath?: number;
  /** viewBox units per second */
  speed?: number;
  r?: number;
  className?: string;
  /** fired each time a packet reaches the end of a path */
  onArrive?: (path: SVGPathElement) => void;
};

/**
 * Sends small packets along SVG paths, forever, and pauses them while the svg
 * is off-screen. Packets are created imperatively so React never reconciles
 * them; everything is torn down on unmount. No-op under reduced motion.
 */
export function useFlow(ref: RefObject<SVGSVGElement | null>, opts: FlowOptions) {
  const { selector, perPath = 2, speed = 120, r = 3, className = "flow-dot", onArrive } = opts;
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const paths = Array.from(svg.querySelectorAll<SVGPathElement>(selector));
    if (!paths.length) return;
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("data-flow-layer", "");
    svg.appendChild(g);
    const tweens: gsap.core.Tween[] = [];
    paths.forEach((path) => {
      const len = path.getTotalLength();
      for (let i = 0; i < perPath; i++) {
        const c = document.createElementNS(SVG_NS, "circle");
        c.setAttribute("r", String(r));
        c.setAttribute("class", className);
        c.dataset.from = path.dataset.from ?? "";
        c.dataset.to = path.dataset.to ?? "";
        g.appendChild(c);
        const t = gsap.to(c, {
          motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
          duration: len / speed,
          ease: "none",
          repeat: -1,
          paused: true,
          onRepeat: onArrive ? () => onArrive(path) : undefined,
        });
        t.progress(i / perPath);
        tweens.push(t);
      }
    });
    let visible = false;
    const sync = () => tweens.forEach((t) => (visible && !document.hidden ? t.play() : t.pause()));
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { rootMargin: "10% 0px" });
    io.observe(svg);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      tweens.forEach((t) => t.kill());
      g.remove();
    };
  }, [ref, selector, perPath, speed, r, className, onArrive]);
}
