"use client";
import Image from "next/image";
import type { Skill } from "@/data/site";
import { asset } from "@/lib/asset";

/**
 * Renders one technology mark inside a tile.
 *
 * - "aws"   Official AWS Architecture Icons. The SVG carries AWS's own category
 *           colour, so it is an <img>; it rests muted (grayscale) and blooms into
 *           its real colour when the row/node is hovered, focused or lit.
 * - "brand" Single-colour brand marks. An <img> cannot inherit CSS colour, so the
 *           SVG is used as a mask over a `currentColor` fill — that lets the tile
 *           animate from graphite to the real brand colour.
 * - "mono"  No logo exists (SQL is a language, not a company): typographic monogram.
 */
export function ServiceLogo({ skill }: { skill: Skill }) {
  if (skill.kind === "mono" || !skill.logo) {
    return (
      <span className="skill-tile skill-tile--mono" aria-hidden>
        <span className="skill-tile__mono font-mono font-medium tracking-[0.04em]">{skill.monogram ?? skill.name.slice(0, 3).toUpperCase()}</span>
      </span>
    );
  }
  if (skill.kind === "brand") {
    return (
      <span className="skill-tile skill-tile--brand" style={{ "--brand": skill.color } as React.CSSProperties} aria-hidden>
        <span className="skill-tile__mark" style={{ WebkitMaskImage: `url(${asset(skill.logo)})`, maskImage: `url(${asset(skill.logo)})` }} />
      </span>
    );
  }
  return (
    <span className="skill-tile skill-tile--aws" aria-hidden>
      <Image src={asset(skill.logo)} alt="" width={38} height={38} className="skill-tile__img" unoptimized />
    </span>
  );
}
