"use client";
import { useRef } from "react";
import { CONTACT, SITE } from "@/data/site";
import { useSectionProgress } from "@/lib/use-section-progress";
import { RevealLines } from "@/components/ui/RevealLines";
import { FadeIn } from "@/components/ui/FadeIn";
import { Magnetic } from "@/components/ui/Magnetic";

/** Final movement. The ambient field converges behind the headline, then disperses as the page ends. */
export function Contact() {
  const ref = useRef<HTMLElement>(null);
  useSectionProgress("contact", ref, { dark: true });
  const year = new Date().getFullYear();
  return (
    <section id="contact" ref={ref} className="dark-section relative h-[230vh] text-[#f6f4ef]" aria-label="Contact">
      <div className="sticky top-0 flex h-screen flex-col justify-end overflow-hidden">
        <div className="container-x pb-8 md:pb-10">
          <RevealLines as="h2" lines={CONTACT.headline} className="display-lg max-w-[14ch] font-medium" />
          <FadeIn as="p" className="mt-8 text-[1.125rem] text-white/70 md:text-[1.375rem]">{CONTACT.sub}</FadeIn>
          <FadeIn delay={0.1} className="mt-14">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/15 pt-6 md:grid-cols-4">
              {CONTACT.channels.map((c) => (
                <li key={c.id}>
                  <p className="eyebrow !text-white/45">{c.label}</p>
                  <Magnetic strength={0.2}>
                    <a
                      href={c.href}
                      target={c.id === "email" ? undefined : "_blank"}
                      rel={c.id === "email" ? undefined : "noopener noreferrer"}
                      data-cursor={c.id === "email" ? "WRITE" : "OPEN"}
                      className="link-underline mt-2 inline-block break-all font-display text-[1rem] font-medium tracking-[-0.01em] md:text-[1.125rem]"
                    >
                      {c.value}
                      {c.id !== "email" && <span className="sr-only"> (opens in a new tab)</span>}
                    </a>
                  </Magnetic>
                </li>
              ))}
            </ul>
          </FadeIn>
          <footer className="mt-[10vh] flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-white/40">
            <p>© {year} {SITE.name}</p>
            <p>{SITE.location}</p>
            <p>Next.js · Three.js · GSAP · Lenis</p>
          </footer>
        </div>
      </div>
    </section>
  );
}
