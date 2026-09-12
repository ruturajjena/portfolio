"use client";
import { useEffect, useState, type RefObject } from "react";

/** IntersectionObserver hook. `margin` extends the root so media can preload early. */
export function useInView(ref: RefObject<Element | null>, margin = "0px", once = false) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); if (once) io.disconnect(); }
        else if (!once) setInView(false);
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, once]);
  return inView;
}
