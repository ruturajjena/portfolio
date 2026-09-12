"use client";
import { useRef } from "react";
import { ABOUT } from "@/data/site";
import { useSectionProgress } from "@/lib/use-section-progress";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealLines } from "@/components/ui/RevealLines";
import { FadeIn } from "@/components/ui/FadeIn";

export function About() {
  const ref = useRef<HTMLElement>(null);
  useSectionProgress("about", ref);
  return (
    <section id="about" ref={ref} className="container-x relative py-[22vh] md:py-[26vh]" aria-label="About">
      <div className="grid grid-cols-12 gap-x-6 gap-y-12">
        <div className="col-span-12 md:col-span-7">
          <Eyebrow>{ABOUT.eyebrow}</Eyebrow>
          <RevealLines as="h2" lines={ABOUT.headline} className="display-lg mt-4 font-medium" />
        </div>
        <div className="col-span-12 md:col-span-5 md:col-start-8 md:pt-[4.5rem]">
          {ABOUT.body.map((p, i) => (
            <FadeIn key={i} as="p" delay={i * 0.08} className="lede mb-6 max-w-[30rem]">{p}</FadeIn>
          ))}
          <FadeIn delay={0.2}>
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-rule pt-6">
              {ABOUT.facts.map((f) => (
                <div key={f.k}>
                  <dt className="eyebrow">{f.k}</dt>
                  <dd className="mt-2 font-display text-[1rem] font-medium tracking-[-0.01em] md:text-[1.125rem]">{f.v}</dd>
                </div>
              ))}
            </dl>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
