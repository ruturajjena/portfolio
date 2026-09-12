/**
 * Soft, editorial text protection over a cinematic plate: a gentle lift at the
 * top (nav + intro) and a deeper one at the bottom (stage captions). Sits above
 * the WebGL stage and below the copy.
 *
 * `tone` must match the plate underneath: a light plate is lifted toward the page
 * colour, a dark plate toward the dark environment. Using the wrong tone washes
 * the footage out.
 */
export function PlateProtection({ tone = "light" }: { tone?: "light" | "dark" }) {
  const base = tone === "dark" ? "var(--env-dark)" : "var(--bg)";
  const mix = (pct: number) => `color-mix(in srgb, ${base} ${pct}%, transparent)`;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]">
      <div
        className="absolute inset-x-0 top-0 h-[34vh]"
        style={{ background: `linear-gradient(to bottom, ${mix(tone === "dark" ? 78 : 88)} 0%, ${mix(tone === "dark" ? 34 : 40)} 45%, transparent 100%)` }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[52vh]"
        style={{ background: `linear-gradient(to top, ${mix(tone === "dark" ? 88 : 96)} 0%, ${mix(tone === "dark" ? 68 : 78)} 30%, ${mix(tone === "dark" ? 26 : 30)} 65%, transparent 100%)` }}
      />
    </div>
  );
}
