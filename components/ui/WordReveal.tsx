"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "@/lib/gsap";

/** Scroll-scrubbed word opacity (0.16 → 1) as the paragraph travels through the viewport. */
export function WordReveal({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = useMemo(() => text.split(" "), [text]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const spans = el.querySelectorAll<HTMLElement>("span[data-w]");
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.set(spans, { opacity: 0.16 });
      gsap.to(spans, {
        opacity: 1,
        stagger: 0.08,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.4 },
      });
    }, el);
    return () => ctx.revert();
  }, [words]);
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i} data-w className="inline-block will-change-[opacity]">
          {w}{i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
