"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { PIPELINE, skillByName, type PipelineEdge, type PipelineNode, type Skill } from "@/data/site";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useFlow } from "@/lib/use-flow";
import { ServiceLogo } from "./ServiceLogo";
import { Magnetic } from "@/components/ui/Magnetic";

const W = 1200, H = 520, HALF = 32;
type Pt = [number, number];

function anchors(a: PipelineNode, b: PipelineNode, route?: "h" | "v"): [Pt, Pt, "h" | "v"] {
  const dx = b.x - a.x, dy = b.y - a.y;
  const o = route ?? (Math.abs(dx) >= Math.abs(dy) * 1.1 ? "h" : "v");
  if (o === "h") return [[a.x + HALF, a.y], [b.x - HALF, b.y], "h"];
  return dy < 0 ? [[a.x, a.y - HALF], [b.x, b.y + HALF], "v"] : [[a.x, a.y + HALF], [b.x, b.y - HALF], "v"];
}
function edgeD(a: PipelineNode, b: PipelineNode, route?: "h" | "v") {
  const [[x1, y1], [x2, y2], o] = anchors(a, b, route);
  if (o === "h") { const mx = (x1 + x2) / 2; return `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`; }
  const my = (y1 + y2) / 2; return `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
}
const edgeId = (e: PipelineEdge) => `pe-${e.from}-${e.to}`;

type Props = { focus: string | null; onFocus: (id: string | null) => void };

/**
 * A living architecture diagram. Nodes are the real service marks; edges carry
 * packets forever; a node blooms into colour each time a packet arrives.
 * Hover isolates one service's connections. "Trace a record" follows a single
 * highlighted record through a lane, lighting each service as it passes.
 */
export function Pipeline({ focus, onFocus }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const tracer = useRef<SVGCircleElement>(null);
  const nodeEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const litTimers = useRef<Record<string, number>>({});
  const tracing = useRef(false);
  const laneIdx = useRef(0);
  const built = useRef(false);

  const nodes = PIPELINE.nodes;
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const geometry = useMemo(() => PIPELINE.edges.map((e) => {
    const a = byId[e.from], b = byId[e.to];
    const [[x1, y1], [x2, y2]] = anchors(a, b, e.route);
    return { e, d: edgeD(a, b, e.route), mid: [(x1 + x2) / 2, (y1 + y2) / 2] as Pt };
  }), [byId]);

  const related = useMemo(() => {
    if (!focus) return null;
    const s = new Set<string>();
    PIPELINE.edges.forEach((e) => { if (e.from === focus || e.to === focus) { s.add(e.from); s.add(e.to); } });
    return s;
  }, [focus]);

  const light = useCallback((id: string, strong = false) => {
    const el = nodeEls.current[id];
    if (!el) return;
    el.classList.add("is-lit");
    if (strong) el.classList.add("is-traced");
    window.clearTimeout(litTimers.current[id]);
    litTimers.current[id] = window.setTimeout(() => { el.classList.remove("is-lit", "is-traced"); }, strong ? 900 : 650);
  }, []);

  // ambient packets on every data edge
  const onArrive = useCallback((p: SVGPathElement) => { if (p.dataset.to) light(p.dataset.to); }, [light]);
  useFlow(svg, { selector: "path[data-kind='data']", perPath: 3, speed: 130, r: 3.5, className: "pipe-packet", onArrive });

  // dim packets that do not touch the focused node
  useEffect(() => {
    const s = svg.current;
    if (!s) return;
    s.querySelectorAll<SVGCircleElement>(".pipe-packet").forEach((c) => {
      const touches = !focus || c.dataset.from === focus || c.dataset.to === focus;
      c.classList.toggle("is-dim", !touches);
    });
  }, [focus]);

  const trace = useCallback(() => {
    const s = svg.current, dot = tracer.current, r = root.current;
    if (!s || !dot || !r || tracing.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lane = PIPELINE.lanes[laneIdx.current++ % PIPELINE.lanes.length];
    tracing.current = true;
    r.classList.add("is-tracing");
    const tl = gsap.timeline({
      onComplete: () => { r.classList.remove("is-tracing"); tracing.current = false; },
    });
    tl.set(dot, { opacity: 1, scale: 0.4, transformOrigin: "50% 50%" }).to(dot, { scale: 1, duration: 0.3, ease: "back.out(2)" });
    lane.forEach(([from, to], i) => {
      const path = s.querySelector<SVGPathElement>(`#pe-${from}-${to}`);
      if (!path) return;
      tl.to(dot, {
        motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
        duration: path.getTotalLength() / 300,
        ease: i === 0 ? "power2.in" : i === lane.length - 1 ? "power2.out" : "none",
        onStart: () => light(from, true),
        onComplete: () => light(to, true),
      });
    });
    tl.to(dot, { opacity: 0, scale: 1.8, duration: 0.45, ease: "power2.out" });
  }, [light]);

  // build-in on first view: nodes rise, edges draw, packets fade up, then one trace
  useLayoutEffect(() => {
    const r = root.current, s = svg.current;
    if (!r || !s) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodeList = Object.values(nodeEls.current).filter(Boolean) as HTMLElement[];
    const data = Array.from(s.querySelectorAll<SVGPathElement>("path[data-kind='data']"));
    const control = Array.from(s.querySelectorAll<SVGPathElement>("path[data-kind='control'], text.pipe-edge-label"));
    const ctx = gsap.context(() => {
      // control edges march forever (dash period 12)
      if (!reduced) s.querySelectorAll<SVGPathElement>("path[data-kind='control']").forEach((p) => gsap.fromTo(p, { strokeDashoffset: 0 }, { strokeDashoffset: -24, duration: 1.6, ease: "none", repeat: -1 }));
      if (reduced) { built.current = true; return; }
      gsap.set(nodeList, { opacity: 0, scale: 0.82, transformOrigin: "50% 50%" });
      data.forEach((p) => { const len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); });
      gsap.set(control, { opacity: 0 });
      gsap.set(s.querySelector("[data-flow-layer]"), { opacity: 0 });
      ScrollTrigger.create({
        trigger: r, start: "top 78%", once: true,
        onEnter: () => {
          const tl = gsap.timeline({ onComplete: () => { built.current = true; } });
          tl.to(nodeList, { opacity: 1, scale: 1, duration: 0.9, ease: "expo.out", stagger: 0.06 })
            .to(data, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.07 }, 0.25)
            .to(control, { opacity: 1, duration: 0.6 }, "-=0.5")
            .to(s.querySelector("[data-flow-layer]"), { opacity: 1, duration: 0.7 }, ">")
            .call(trace, [], "+=0.1");
        },
      });
    }, r);
    return () => ctx.revert();
  }, [trace]);

  const nodeClass = (id: string) => `pipe-node ${!focus ? "" : focus === id ? "is-active" : related?.has(id) ? "is-related" : "is-dim"}`;
  const edgeClass = (e: PipelineEdge) => `pipe-edge pipe-edge--${e.kind} ${!focus ? "" : e.from === focus || e.to === focus ? "is-related" : "is-dim"}`;
  const resolveSkill = (n: PipelineNode): Skill => (typeof n.skill === "string" ? skillByName(n.skill)! : n.skill);

  return (
    <div ref={root} className="pipe-wrap" onPointerLeave={() => onFocus(null)}>
      <p className="mb-3 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink-3 md:hidden" aria-hidden>Swipe sideways to explore →</p>
      <div className="-mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)] md:mx-0 md:overflow-visible md:px-0" data-lenis-prevent>
        <div className="pipe min-w-[880px] md:min-w-0">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="pipe-svg" aria-hidden>
        {geometry.map(({ e, d }) => (
          <path key={edgeId(e)} id={edgeId(e)} d={d} className={edgeClass(e)} data-kind={e.kind} data-from={e.from} data-to={e.to} vectorEffect="non-scaling-stroke" />
        ))}
        {geometry.filter(({ e }) => e.label).map(({ e, mid }) => (
          <text key={`l-${edgeId(e)}`} x={mid[0] + 10} y={mid[1] + 4} className="pipe-edge-label">{e.label}</text>
        ))}
        <circle ref={tracer} r="6" className="pipe-tracer" style={{ opacity: 0 }} />
      </svg>

      {nodes.map((n) => (
        <button
          key={n.id}
          ref={(el) => { nodeEls.current[n.id] = el; }}
          type="button"
          className={nodeClass(n.id)}
          style={{ left: `${((n.x - HALF) / W) * 100}%`, top: `${((n.y - HALF) / H) * 100}%` }}
          onPointerEnter={() => onFocus(n.id)}
          onFocus={() => onFocus(n.id)}
          onBlur={() => onFocus(null)}
          onClick={trace}
          aria-label={`${n.label} — ${n.sub}`}
          data-cursor=""
        >
          <ServiceLogo skill={resolveSkill(n)} />
          <span className={`pipe-node__label ${n.labelPos === "top" ? "pipe-node__label--top" : ""}`}>
            <span className="block font-display font-medium tracking-[-0.01em]">{n.label}</span>
            <span className="pipe-node__sub block font-mono uppercase tracking-[0.14em]">{n.sub}</span>
          </span>
        </button>
      ))}
        </div>
      </div>

      <div className="pipe-caption">
        <div className="min-h-[3.4rem]">
          {focus && byId[focus] ? (
            <>
              <p className="font-display text-[1.0625rem] font-medium tracking-[-0.01em] md:text-[1.125rem]">{byId[focus].label} <span className="text-ink-3">— {byId[focus].sub}</span></p>
              <p className="mt-1 max-w-[38rem] text-[0.9375rem] leading-[1.5] text-ink-2">{byId[focus].body}</p>
            </>
          ) : (
            <p className="max-w-[38rem] text-[0.9375rem] leading-[1.5] text-ink-3">Solid lines carry data. Dashed lines carry control. Hover a service to isolate its connections.</p>
          )}
        </div>
        <Magnetic>
          <button type="button" onClick={trace} data-cursor="GO" className="link-underline inline-flex items-center gap-2 whitespace-nowrap font-mono text-[0.75rem] uppercase tracking-[0.2em]">
            Trace a record <span aria-hidden>→</span>
          </button>
        </Magnetic>
      </div>
    </div>
  );
}
