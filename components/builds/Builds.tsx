"use client";
import { useRef } from "react";
import { BUILDS } from "@/data/site";
import { useSectionProgress } from "@/lib/use-section-progress";
import { BuildItem } from "./BuildItem";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealLines } from "@/components/ui/RevealLines";

/** Selected builds — large editorial compositions on the dark environment. */
export function Builds() {
  const ref = useRef<HTMLElement>(null);
  useSectionProgress("builds", ref, { dark: true });
  return (
    <section id="builds" ref={ref} className="dark-section container-x relative pb-[10vh] pt-[34vh] text-[#f6f4ef]" aria-label="Selected builds">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/15 pb-8">
        <div>
          <Eyebrow className="!text-white/50">Work</Eyebrow>
          <RevealLines as="h2" lines={["Selected Builds"]} className="display-lg mt-4 font-medium" />
        </div>
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-white/50">{String(BUILDS.length).padStart(2, "0")} — products, platforms, systems</p>
      </div>
      <div>
        {BUILDS.map((b, i) => (
          <BuildItem key={b.id} build={b} flip={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
