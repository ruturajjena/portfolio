"use client";
import { useRef } from "react";
import { BRAND_MOTION } from "@/data/site";
import { useSectionProgress } from "@/lib/use-section-progress";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealLines } from "@/components/ui/RevealLines";
import { FadeIn } from "@/components/ui/FadeIn";

/** Founder-led studio, treated typographically. The monogram assembles in WebGL beside the copy. */
export function BrandMotion() {
  const ref = useRef<HTMLElement>(null);
  useSectionProgress("brand", ref);
  return (
    <section id="brand" ref={ref} className="container-x relative min-h-[150vh] py-[22vh]" aria-label="Brand Motion Studios">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 md:col-span-6 lg:col-span-5">
          <Eyebrow>{BRAND_MOTION.eyebrow}</Eyebrow>
          <RevealLines as="h2" lines={["Brand Motion", "Studios"]} className="display-lg mt-4 font-medium" />
          <FadeIn as="p" className="lede mt-8 max-w-[30rem]">{BRAND_MOTION.positioning}</FadeIn>
          <FadeIn delay={0.1} className="mt-14">
            <ol className="border-t border-rule">
              {BRAND_MOTION.services.map((s, i) => (
                <li key={s} className="group flex items-baseline gap-5 border-b border-rule py-4 transition-colors duration-300 hover:border-ink">
                  <span className="font-mono text-[0.625rem] tracking-[0.2em] text-ink-3 transition-colors duration-300 group-hover:text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-[1.5rem] font-medium uppercase tracking-[-0.02em] md:text-[2rem]">{s}</span>
                </li>
              ))}
            </ol>
          </FadeIn>
        </div>
        {/* right column is reserved for the WebGL monogram */}
        <div className="col-span-12 h-[46vh] md:col-span-6 md:h-auto lg:col-span-7" aria-hidden />
      </div>
    </section>
  );
}
