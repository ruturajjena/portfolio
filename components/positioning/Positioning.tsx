"use client";
import { useRef } from "react";
import { POSITIONING } from "@/data/site";
import { useSectionProgress } from "@/lib/use-section-progress";
import { RevealLines } from "@/components/ui/RevealLines";
import { WordReveal } from "@/components/ui/WordReveal";

export function Positioning() {
  const ref = useRef<HTMLElement>(null);
  useSectionProgress("positioning", ref);
  return (
    <section id="positioning" ref={ref} className="container-x relative py-[26vh] md:py-[32vh]" aria-label="Positioning">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 md:col-span-10 lg:col-span-9">
          <RevealLines as="h2" lines={POSITIONING.lines} className="display-lg font-medium" />
        </div>
        <div className="col-span-12 mt-[12vh] md:col-span-7 md:col-start-5 lg:col-span-6 lg:col-start-6">
          <WordReveal text={POSITIONING.body} className="lede text-ink" />
        </div>
      </div>
    </section>
  );
}
