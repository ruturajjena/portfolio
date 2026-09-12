"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { SKILL_GROUPS, DATA_CONCEPTS, PIPELINE, PIPELINE_INTRO } from "@/data/site";
import { useSectionProgress } from "@/lib/use-section-progress";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { FadeIn } from "@/components/ui/FadeIn";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealLines } from "@/components/ui/RevealLines";
import { ServiceLogo } from "./ServiceLogo";
import { Pipeline } from "./Pipeline";
import { Magnetic } from "@/components/ui/Magnetic";

/**
 * The stack as a living system: the pipeline diagram up top, the indexed tool
 * list beneath. Hovering either side highlights the same service on the other.
 */
export function DataSkills() {
  const ref = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<string | null>(null);
  useSectionProgress("skills", ref);

  useLayoutEffect(() => {
    const el = grid.current;
    if (!el) return;
    const rows = el.querySelectorAll<HTMLElement>("[data-skill-row]");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { gsap.set(rows, { opacity: 1, y: 0 }); return; }
    const ctx = gsap.context(() => {
      gsap.set(rows, { opacity: 0, y: 16 });
      ScrollTrigger.batch(rows, { start: "top 92%", once: true, onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.05 }) });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section id="skills" ref={ref} className="container-x relative py-[18vh] md:py-[22vh]" aria-label="Data engineering stack">
      <div className="grid grid-cols-12 gap-x-6 gap-y-10">
        <div className="col-span-12 md:col-span-5">
          <Eyebrow>Stack</Eyebrow>
          <RevealLines as="h2" lines={["The tools", "behind the system."]} className="display-md mt-4 font-medium" />
        </div>
        <FadeIn as="p" className="lede col-span-12 md:col-span-6 md:col-start-7 md:pt-9">{PIPELINE_INTRO}</FadeIn>
      </div>

      <div className="mt-14">
        <Pipeline focus={focus} onFocus={setFocus} />
      </div>

      <div ref={grid} className="mt-20 grid grid-cols-1 gap-x-10 sm:grid-cols-3">
        {SKILL_GROUPS.map((g) => (
          <div key={g.title}>
            <p className="eyebrow border-t border-rule pt-4">{g.title}</p>
            <ul className="mt-6" onPointerLeave={() => setFocus(null)}>
              {g.items.map((skill, i) => {
                const node = PIPELINE.skillToNode[skill.name] ?? null;
                return (
                  <li
                    key={skill.name}
                    data-skill-row
                    onPointerEnter={() => setFocus(node)}
                    className={`skill-row group flex items-center gap-4 border-b border-rule py-3 transition-colors duration-300 hover:border-ink focus-within:border-ink ${node && node === focus ? "is-active border-ink" : ""}`}
                  >
                    <span className="font-mono text-[0.625rem] tracking-[0.2em] text-ink-3 transition-colors duration-300 group-hover:text-accent">{String(i + 1).padStart(2, "0")}</span>
                    <Magnetic strength={0.18}><ServiceLogo skill={skill} /></Magnetic>
                    <span className="font-display text-[1.25rem] font-medium tracking-[-0.02em] md:text-[1.5rem]">{skill.name}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <FadeIn className="mt-16" delay={0.2}>
        <p className="eyebrow">Working knowledge</p>
        <p className="mt-4 max-w-[46rem] font-display text-[1.125rem] leading-[1.5] tracking-[-0.01em] text-ink-2 md:text-[1.375rem]">
          {DATA_CONCEPTS.map((c, i) => (
            <span key={c}><span className="text-ink">{c}</span>{i < DATA_CONCEPTS.length - 1 && <span className="mx-3 text-ink-3">·</span>}</span>
          ))}
        </p>
      </FadeIn>
    </section>
  );
}
