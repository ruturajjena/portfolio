"use client";
import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import type { Build } from "@/data/site";
import { MACROVA } from "@/data/site";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { Magnetic } from "@/components/ui/Magnetic";
import { scrollToId } from "@/lib/lenis";
import { Tilt } from "@/components/ui/Tilt";
import { asset } from "@/lib/asset";
import { useFlow } from "@/lib/use-flow";

/** One large project composition: meta column + visual plate, alternating sides. */
export function BuildItem({ build, flip }: { build: Build; flip: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const plate = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current, pl = plate.current;
    if (!el || !pl) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      // entrance
      gsap.set(el.querySelectorAll("[data-rise]"), { y: 28, opacity: 0 });
      ScrollTrigger.create({
        trigger: el, start: "top 78%", once: true,
        onEnter: () => gsap.to(el.querySelectorAll("[data-rise]"), { y: 0, opacity: 1, duration: 1.2, stagger: 0.06, ease: "expo.out" }),
      });
      // plate parallax
      gsap.fromTo(pl.querySelector("[data-parallax]"), { yPercent: 6 }, { yPercent: -6, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 } });
      // drawn diagrams
      const paths = pl.querySelectorAll<SVGPathElement>("[data-draw]");
      paths.forEach((p) => { const len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); });
      if (paths.length) gsap.to(paths, { strokeDashoffset: 0, ease: "none", stagger: 0.02, scrollTrigger: { trigger: pl, start: "top 85%", end: "bottom 55%", scrub: 0.5 } });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <article ref={ref} className="grid grid-cols-12 gap-x-6 gap-y-10 border-b border-white/10 py-[12vh] md:py-[14vh]">
      <div className={`col-span-12 flex flex-col justify-between md:col-span-5 ${flip ? "md:order-2 md:col-start-8" : ""}`}>
        <div>
          <p data-rise className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-white/50">{build.index} — {build.kicker}</p>
          <h3 data-rise className="display-md mt-5 font-medium">{build.name}</h3>
          <p data-rise className="mt-6 max-w-[30rem] text-[1.0625rem] leading-[1.55] text-white/70">{build.description}</p>
        </div>
        <dl data-rise className="mt-12 grid grid-cols-2 gap-6 border-t border-white/15 pt-6">
          <div>
            <dt className="eyebrow !text-white/45">Role</dt>
            <dd className="mt-2 text-[0.9375rem] text-white/85">{build.role}</dd>
          </div>
          <div>
            <dt className="eyebrow !text-white/45">Technology</dt>
            <dd className="mt-2 text-[0.9375rem] text-white/85">{build.tech.join(" · ")}</dd>
          </div>
          {build.href && (
            <div className="col-span-2 pt-2">
              <Magnetic>
                <a href={build.href} target="_blank" rel="noopener noreferrer" data-cursor="VISIT" className="link-underline inline-flex items-center gap-2 font-mono text-[0.75rem] uppercase tracking-[0.2em]">
                  {build.hrefLabel} <span aria-hidden>↗</span><span className="sr-only">(opens in a new tab)</span>
                </a>
              </Magnetic>
            </div>
          )}
          {build.visual === "macrova" && (
            <div className="col-span-2">
              <a href="#macrova" onClick={(e) => { e.preventDefault(); scrollToId("macrova"); }} data-cursor="EXPLORE" className="link-underline font-mono text-[0.75rem] uppercase tracking-[0.2em] text-white/70">
                See the product film ↓
              </a>
            </div>
          )}
        </dl>
      </div>

      <div ref={plate} className={`col-span-12 md:col-span-7 ${flip ? "md:order-1" : ""}`}>
        <div data-parallax className="relative">
          <Tilt max={4}>
            {build.visual === "macrova" && <MacrovaPlate />}
            {build.visual === "lakehouse" && <LakehousePlate />}
            {build.visual === "generative" && <GenerativePlate />}
          </Tilt>
        </div>
      </div>
    </article>
  );
}

/** The web dashboard as the base of the spread, with the AI scan screen overlapping it. */
function MacrovaPlate() {
  const dash = MACROVA.dashboard;
  const scan = MACROVA.screens.find((s) => s.id === "scan") ?? MACROVA.screens[0];
  return (
    <div className="group relative aspect-[4/3] w-full" data-cursor="VIEW">
      <div className="absolute left-0 top-[8%] w-[86%] overflow-hidden rounded-[0.9rem] border border-white/10 shadow-[0_50px_100px_-40px_rgba(0,0,0,0.9)] transition-transform duration-700 [transition-timing-function:var(--ease-out-expo)] group-hover:-translate-y-1.5">
        <Image src={asset(dash.src)} alt={dash.alt} width={dash.w} height={dash.h} sizes="(max-width: 768px) 86vw, 50vw" className="block h-auto w-full" />
      </div>
      <div className="absolute bottom-[2%] right-[2%] w-[27%] overflow-hidden rounded-[1.3rem] border border-white/15 shadow-[0_40px_80px_-24px_rgba(0,0,0,0.95)] transition-transform duration-700 [transition-timing-function:var(--ease-out-expo)] group-hover:-translate-y-3">
        <Image src={asset(scan.src)} alt={scan.alt} width={scan.w} height={scan.h} sizes="(max-width: 768px) 30vw, 16vw" className="block h-auto w-full" />
      </div>
    </div>
  );
}

/** Three-zone lakehouse, drawn as a line diagram: many sources → landing → curated → consumption. */
function LakehousePlate() {
  const sources = Array.from({ length: 29 }, (_, i) => 30 + i * 12);
  const svg = useRef<SVGSVGElement>(null);
  // a few records at a time travel from the sources through the zones
  useFlow(svg, { selector: "path[data-flow]", perPath: 1, speed: 90, r: 2.6 });
  return (
    <figure className="aspect-[4/3] w-full">
      <svg ref={svg} viewBox="0 0 800 600" className="h-full w-full" role="img" aria-label="Diagram of an ingestion platform: many source systems flowing into landing, curated and consumption zones, governed by audit-balance-control">
        <g stroke="rgba(246,244,239,0.55)" strokeWidth="1" fill="none">
          {sources.map((y, i) => (
            <path key={i} data-draw {...(i % 4 === 1 ? { "data-flow": "" } : {})} d={`M40 ${y + 120} H 150 Q 190 ${y + 120} 200 ${300 + (i - 14) * 4} H 250`} />
          ))}
          <rect data-draw x="250" y="150" width="90" height="300" rx="2" />
          <rect data-draw x="420" y="180" width="90" height="240" rx="2" />
          <rect data-draw x="590" y="215" width="170" height="170" rx="2" />
          <path data-draw data-flow d="M340 300 H 420" />
          <path data-draw data-flow d="M510 300 H 590" />
          <path data-draw d="M295 480 V 520 H 675 V 385" strokeDasharray="4 6" />
        </g>
        <g fill="rgba(246,244,239,0.85)" fontFamily="var(--font-geist-mono), monospace" fontSize="11" letterSpacing="2">
          <text x="40" y="128">145+ SOURCES</text>
          <text x="250" y="138">LANDING</text>
          <text x="420" y="168">CURATED</text>
          <text x="590" y="203">CONSUMPTION</text>
          <text x="295" y="548">AUDIT · BALANCE · CONTROL</text>
        </g>
        <circle cx="675" cy="300" r="3" fill="#2f6bff" />
      </svg>
    </figure>
  );
}

/** Prompt-to-sequence: a strip of frames that resolve from outline to solid. */
function GenerativePlate() {
  const frames = Array.from({ length: 12 }, (_, i) => i);
  return (
    <figure className="aspect-[4/3] w-full">
      <svg viewBox="0 0 800 600" className="h-full w-full" role="img" aria-label="Abstract film strip: twelve frames resolving from outline to solid, representing prompt-to-sequence generation">
        <g stroke="rgba(246,244,239,0.5)" strokeWidth="1">
          <path data-draw d="M60 300 H 740" fill="none" />
          {frames.map((i) => {
            const x = 60 + i * 57, fill = Math.min(1, i / 9);
            return (
              <g key={i}>
                <rect data-draw x={x} y={240} width={44} height={120} rx="2" fill={`rgba(246,244,239,${fill * 0.9})`} />
                <text x={x} y={228} fill="rgba(246,244,239,0.5)" stroke="none" fontFamily="var(--font-geist-mono), monospace" fontSize="10" letterSpacing="2">{String(i + 1).padStart(2, "0")}</text>
              </g>
            );
          })}
          <path data-draw d="M60 420 Q 300 380 740 440" fill="none" strokeDasharray="3 7" />
        </g>
        <g fill="rgba(246,244,239,0.85)" fontFamily="var(--font-geist-mono), monospace" fontSize="11" letterSpacing="2">
          <text x="60" y="470">PROMPT</text>
          <text x="690" y="470">SEQUENCE</text>
        </g>
        <circle cx="740" cy="300" r="3" fill="#2f6bff" />
      </svg>
    </figure>
  );
}
