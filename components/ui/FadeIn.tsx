"use client";
import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/** Subtle rise-and-fade on enter. Used for supporting copy only, never for headlines. */
export function FadeIn({ children, as = "div", className = "", delay = 0, y = 24 }: { children: ReactNode; as?: "div" | "p" | "span" | "ul" | "li"; className?: string; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.set(el, { y, opacity: 0 });
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: () => gsap.to(el, { y: 0, opacity: 1, duration: 1.2, delay, ease: "expo.out" }),
      });
    }, el);
    return () => ctx.revert();
  }, [delay, y]);
  const Tag = as as "div";
  return <Tag ref={ref as RefObject<HTMLDivElement>} className={className}>{children}</Tag>;
}
