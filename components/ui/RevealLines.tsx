"use client";
import { useLayoutEffect, useRef, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

type Props = {
  lines: readonly string[];
  as?: "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  lineClassName?: string;
  /** delay in seconds before the first line */
  delay?: number;
  /** trigger immediately (hero) instead of on scroll */
  immediate?: boolean;
  stagger?: number;
};

/** Masked line-by-line reveal. Each line rises out of an overflow-hidden mask. */
export function RevealLines({ lines, as = "h2", className = "", lineClassName = "", delay = 0, immediate = false, stagger = 0.09 }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const spans = el.querySelectorAll<HTMLElement>(".mask-line > span");
    if (reduced) { gsap.set(spans, { y: 0, opacity: 1 }); return; }
    const ctx = gsap.context(() => {
      gsap.set(spans, { yPercent: 110, opacity: 0 });
      const tween = gsap.to(spans, {
        yPercent: 0, opacity: 1, duration: 1.4, ease: "expo.out", stagger, delay,
        paused: !immediate,
      });
      if (!immediate) {
        ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: () => tween.play() });
      }
    }, el);
    return () => ctx.revert();
  }, [lines, delay, immediate, stagger]);
  const Tag = as as "h2";
  return (
    <Tag ref={ref as RefObject<HTMLHeadingElement>} className={className}>
      {lines.map((line, i) => (
        <span key={i} className={`mask-line ${lineClassName}`}>
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  );
}
