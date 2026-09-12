"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { pointer } from "@/lib/pointer";
import { damp } from "@/lib/math";

/**
 * Minimal custom cursor: a 6px dot that expands on interactive elements and
 * shows an optional label from `data-cursor="VIEW"`. Disabled on touch devices
 * and when reduced motion is requested.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced || !dot.current) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");
    const el = dot.current;
    const lab = label.current!;
    let x = -100, y = -100, scale = 1, targetScale = 1, text = "";
    let visible = false;

    const onOver = (e: Event) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("a, button, [data-cursor]");
      if (t) {
        const custom = t.dataset.cursor;
        text = custom ?? "";
        targetScale = custom ? 11 : 3.2;
        lab.textContent = text;
      } else {
        text = "";
        targetScale = 1;
      }
    };
    const onDown = () => { targetScale *= 0.8; };
    const onUp = () => { onOver({ target: document.elementFromPoint(pointer.cx, pointer.cy) } as unknown as Event); };
    const onLeave = () => { visible = false; };
    const onEnter = () => { visible = true; };
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    const tick = (_t: number, dtMs: number) => {
      const dt = Math.min(dtMs / 1000, 0.05);
      if (pointer.active && !visible) visible = true;
      x = damp(x, pointer.cx, 28, dt);
      y = damp(y, pointer.cy, 28, dt);
      scale = damp(scale, targetScale, 14, dt);
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
      el.style.opacity = visible ? "1" : "0";
      lab.style.opacity = text && scale > 8 ? "1" : "0";
      lab.style.transform = `scale(${1 / Math.max(scale, 0.001)})`;
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      root.classList.remove("has-cursor");
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  return (
    <div
      ref={dot}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] h-1.5 w-1.5 rounded-full opacity-0 mix-blend-difference will-change-transform"
      style={{ background: "#fff" }}
    >
      <span
        ref={label}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-black opacity-0 transition-opacity duration-200"
      />
    </div>
  );
}
