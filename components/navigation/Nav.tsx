"use client";
import { useEffect, useRef, useState } from "react";
import { NAV, SITE, type SectionId } from "@/data/site";
import { scrollToId, getLenis } from "@/lib/lenis";
import { Magnetic } from "@/components/ui/Magnetic";
import { gsap } from "@/lib/gsap";

/**
 * Fixed, minimal navigation. Contrast follows the `theme-dark` class on <html>;
 * the active item follows an IntersectionObserver over the section anchors.
 */
export function Nav() {
  const [active, setActive] = useState<SectionId>("hero");
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const progress = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ids: SectionId[] = ["hero", "positioning", "data", "skills", "builds", "macrova", "design", "brand", "about", "contact"];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id as SectionId);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Hide the bar while scrolling fast downward, reveal on any upward movement.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > last + 6 && y > 200);
      if (y < last - 2) setHidden(false);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // reading progress: a hairline that grows across the bottom of the bar
  useEffect(() => {
    const el = progress.current;
    if (!el) return;
    let last = -1;
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      el.style.transform = `scaleX(${p})`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
    const lenis = getLenis();
    if (open) lenis?.stop(); else lenis?.start();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    scrollToId(id);
  };

  const activeGroup: Record<string, SectionId> = { hero: "hero", positioning: "hero", data: "data", skills: "data", builds: "builds", macrova: "builds", design: "design", brand: "design", about: "about", contact: "contact" };
  const current = activeGroup[active] ?? active;

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] ${hidden && !open ? "-translate-y-full" : "translate-y-0"}`}
      style={{ color: open ? "#f6f4ef" : "var(--theme-fg, var(--ink))" }}
    >
      <nav aria-label="Primary" className="container-x flex h-[var(--nav-h)] items-center justify-between">
        <a href="#hero" onClick={go("hero")} className="font-display text-[0.8125rem] font-medium uppercase tracking-[0.22em]" data-cursor="">
          {SITE.name}
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <li key={item.id}>
              <Magnetic strength={0.25}>
                <a
                  href={`#${item.id}`}
                  onClick={go(item.id)}
                  aria-current={current === item.id ? "true" : undefined}
                  className="group relative block px-1 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.2em] transition-opacity duration-300 hover:opacity-100 aria-[current]:opacity-100 opacity-55"
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={`absolute -bottom-0.5 left-1 h-px bg-current transition-[width] duration-500 [transition-timing-function:var(--ease-out-expo)] ${current === item.id ? "w-[calc(100%-0.5rem)]" : "w-0 group-hover:w-[calc(100%-0.5rem)]"}`}
                  />
                </a>
              </Magnetic>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="relative -mr-3 flex h-11 w-11 items-center justify-center md:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className={`absolute h-px w-6 bg-current transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] ${open ? "rotate-45" : "-translate-y-[4px]"}`} />
          <span aria-hidden className={`absolute h-px w-6 bg-current transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] ${open ? "-rotate-45" : "translate-y-[4px]"}`} />
        </button>
      </nav>
      <span ref={progress} aria-hidden className="absolute bottom-0 left-0 h-px w-full origin-left bg-current opacity-30" style={{ transform: "scaleX(0)" }} />

    </header>

      {/* Mobile menu — a sibling of the header: the header animates with transform,
          which would otherwise become the containing block for this fixed layer. */}
      <div
        id="mobile-menu"
        inert={!open}
        className={`fixed inset-0 z-40 flex flex-col justify-end bg-ink px-6 pb-12 pt-24 text-bg transition-[opacity,visibility] duration-500 md:hidden ${open ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        <ul className="flex flex-col gap-2">
          {NAV.map((item, i) => (
            <li key={item.id} className="mask-line">
              <a
                href={`#${item.id}`}
                onClick={go(item.id)}
                className="block py-2 font-display text-[2.75rem] font-medium leading-none tracking-[-0.04em] transition-[transform,opacity] duration-700 [transition-timing-function:var(--ease-out-expo)]"
                style={{ transitionDelay: `${open ? 120 + i * 60 : 0}ms`, transform: open ? "translateY(0)" : "translateY(110%)", opacity: open ? 1 : 0 }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-10 font-mono text-[0.6875rem] uppercase tracking-[0.2em] opacity-50">{SITE.location}</p>
      </div>
    </>
  );
}
