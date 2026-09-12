"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  PIPELINE, PIPELINE_RUN, PIPELINE_RUN_LABELS, skillByName,
  type PipelineEdge, type PipelineNode, type Skill,
} from "@/data/site";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useFlow } from "@/lib/use-flow";
import { ServiceLogo } from "./ServiceLogo";
import { Magnetic } from "@/components/ui/Magnetic";

const W = 1440, H = 800, HALF = 28;
const ZONE_BOTTOM = 625; // vertical zone dividers stop above the platform row
const SVG_NS = "http://www.w3.org/2000/svg";
const RING = 2 * Math.PI * 9; // progress ring circumference
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
 * A living architecture diagram. Packets ride the edges continuously; hovering a
 * service isolates its connections; "Trace a record" follows one record along a
 * lane; "Run pipeline" plays the whole system stage by stage, lighting each
 * service as its turn comes and ticking it off when it completes.
 */
export function Pipeline({ focus, onFocus }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const tracer = useRef<SVGCircleElement>(null);
  const nodeEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const litTimers = useRef<Record<string, number>>({});
  const tracing = useRef(false);
  const traceTl = useRef<gsap.core.Timeline | null>(null);
  const laneIdx = useRef(0);

  // run state
  const runBtn = useRef<HTMLButtonElement>(null);
  const runRing = useRef<SVGCircleElement>(null);
  const runLabel = useRef<HTMLSpanElement>(null);
  const runStatus = useRef<HTMLParagraphElement>(null);
  const runTl = useRef<gsap.core.Timeline | null>(null);
  const runTweens = useRef<gsap.core.Tween[]>([]);
  const running = useRef(false);

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
  useFlow(svg, { selector: "path[data-kind='data']", perPath: 2, speed: 130, r: 3.5, className: "pipe-packet", onArrive });

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
    if (!s || !dot || !r || tracing.current || running.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lane = PIPELINE.lanes[laneIdx.current++ % PIPELINE.lanes.length];
    tracing.current = true;
    r.classList.add("is-tracing");
    const tl = gsap.timeline({ onComplete: () => { r.classList.remove("is-tracing"); tracing.current = false; } });
    traceTl.current = tl;
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

  /** Sends a burst of packets down one edge and resolves when they land. */
  const burst = useCallback((path: SVGPathElement, layer: SVGGElement, count: number, duration: number) => {
    for (let i = 0; i < count; i++) {
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("r", "4.5");
      c.setAttribute("class", "pipe-run-packet");
      layer.appendChild(c);
      runTweens.current.push(
        gsap.to(c, {
          motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
          duration,
          delay: i * (duration / (count * 2.2)),
          ease: "power1.inOut",
          onComplete: () => { gsap.to(c, { opacity: 0, scale: 2.2, duration: 0.3, transformOrigin: "50% 50%", onComplete: () => c.remove() }); },
        }),
      );
    }
  }, []);

  const setRunState = useCallback((state: "idle" | "running" | "done") => {
    const b = runBtn.current, l = runLabel.current, r = root.current;
    if (!b || !l || !r) return;
    b.dataset.state = state;
    b.disabled = state === "running";
    l.textContent = PIPELINE_RUN_LABELS[state];
    r.classList.toggle("is-running", state === "running");
  }, []);

  const runPipeline = useCallback(() => {
    const s = svg.current, r = root.current, ring = runRing.current, status = runStatus.current;
    if (!s || !r || running.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // a run supersedes a trace that is still playing
    traceTl.current?.kill();
    tracing.current = false;
    r.classList.remove("is-tracing");
    if (tracer.current) gsap.set(tracer.current, { opacity: 0 });

    // tear down anything left from a previous run
    runTl.current?.kill();
    gsap.killTweensOf(".pipe-run-packet");
    runTweens.current.forEach((t) => t.kill());
    runTweens.current = [];
    s.querySelectorAll(".pipe-run-packet").forEach((c) => c.remove());
    Object.values(nodeEls.current).forEach((el) => el?.classList.remove("is-done", "is-active-run"));

    const layer = document.createElementNS(SVG_NS, "g");
    layer.setAttribute("data-run-layer", "");
    s.appendChild(layer);

    running.current = true;
    setRunState("running");

    const tl = gsap.timeline({
      onUpdate: () => { if (ring) ring.style.strokeDashoffset = String(RING * (1 - tl.progress())); },
      onComplete: () => {
        running.current = false;
        setRunState("done");
        if (status) status.textContent = PIPELINE_RUN_LABELS.doneStatus;
        gsap.delayedCall(2.2, () => {
          setRunState("idle");
          if (status) status.textContent = "";
          Object.values(nodeEls.current).forEach((el) => el?.classList.remove("is-done"));
          layer.remove();
          if (ring) ring.style.strokeDashoffset = String(RING);
        });
      },
    });
    runTl.current = tl;

    const stageTime = reduced ? 0.35 : 1.0;
    PIPELINE_RUN.forEach((stage, i) => {
      tl.call(() => {
        if (status) status.textContent = `${String(i + 1).padStart(2, "0")} / ${String(PIPELINE_RUN.length).padStart(2, "0")} — ${stage.label}`;
        stage.nodes.forEach((id) => {
          const el = nodeEls.current[id];
          if (!el) return;
          el.classList.add("is-active-run");
          light(id, true);
        });
        if (!reduced) {
          stage.edges.forEach(([from, to]) => {
            const path = s.querySelector<SVGPathElement>(`#pe-${from}-${to}`);
            if (path) burst(path, layer, 3, stageTime * 0.9);
          });
        }
      });
      // let the packets land, then tick the stage off
      tl.to({}, { duration: stageTime });
      tl.call(() => {
        stage.nodes.forEach((id) => {
          const el = nodeEls.current[id];
          el?.classList.remove("is-active-run");
          el?.classList.add("is-done");
        });
        stage.edges.forEach(([, to]) => nodeEls.current[to]?.classList.add("is-done"));
      });
    });
    tl.to({}, { duration: 0.4 });
  }, [burst, light, setRunState]);

  // build-in on first view: nodes rise, edges draw, packets fade up, then one trace
  useLayoutEffect(() => {
    const r = root.current, s = svg.current;
    if (!r || !s) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodeList = Object.values(nodeEls.current).filter(Boolean) as HTMLElement[];
    const data = Array.from(s.querySelectorAll<SVGPathElement>("path[data-kind='data']"));
    const control = Array.from(s.querySelectorAll<SVGPathElement>("path[data-kind='control'], text.pipe-edge-label"));
    const ctx = gsap.context(() => {
      if (!reduced) s.querySelectorAll<SVGPathElement>("path[data-kind='control']").forEach((p) => gsap.fromTo(p, { strokeDashoffset: 0 }, { strokeDashoffset: -24, duration: 1.6, ease: "none", repeat: -1 }));
      if (reduced) return;
      gsap.set(nodeList, { opacity: 0, scale: 0.82, transformOrigin: "50% 50%" });
      data.forEach((p) => { const len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); });
      gsap.set(control, { opacity: 0 });
      gsap.set(s.querySelector("[data-flow-layer]"), { opacity: 0 });
      ScrollTrigger.create({
        trigger: r, start: "top 78%", once: true,
        onEnter: () => {
          gsap.timeline()
            .to(nodeList, { opacity: 1, scale: 1, duration: 0.9, ease: "expo.out", stagger: 0.04 })
            .to(data, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.05 }, 0.25)
            .to(control, { opacity: 1, duration: 0.6 }, "-=0.5")
            .to(s.querySelector("[data-flow-layer]"), { opacity: 1, duration: 0.7 }, ">")
            .call(trace, [], "+=0.1");
        },
      });
    }, r);
    return () => ctx.revert();
  }, [trace]);

  useEffect(() => () => {
    traceTl.current?.kill();
    runTl.current?.kill();
    runTweens.current.forEach((t) => t.kill());
    Object.values(litTimers.current).forEach((t) => window.clearTimeout(t));
  }, []);

  const nodeClass = (id: string) => `pipe-node ${!focus ? "" : focus === id ? "is-active" : related?.has(id) ? "is-related" : "is-dim"}`;
  const edgeClass = (e: PipelineEdge) => `pipe-edge pipe-edge--${e.kind} ${!focus ? "" : e.from === focus || e.to === focus ? "is-related" : "is-dim"}`;
  const resolveSkill = (n: PipelineNode): Skill => (typeof n.skill === "string" ? skillByName(n.skill)! : n.skill);

  return (
    <div ref={root} className="pipe-wrap" onPointerLeave={() => onFocus(null)}>
      <p className="mb-3 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink-3 md:hidden" aria-hidden>Swipe sideways to explore →</p>
      <div className="-mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)] md:mx-0 md:overflow-visible md:px-0" data-lenis-prevent>
        <div className="pipe min-w-[1180px] md:min-w-0">
          <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="pipe-svg" aria-hidden>
            {/* zone dividers + labels */}
            {PIPELINE.zones.map((z, i) => (
              <g key={z.label} className="pipe-zone">
                {i > 0 && <path d={`M${z.x} 44 V ${ZONE_BOTTOM}`} className="pipe-zone-rule" vectorEffect="non-scaling-stroke" />}
                <text x={z.x + 14} y={30} className="pipe-zone-label">{z.label}</text>
              </g>
            ))}
            <path d={`M0 ${ZONE_BOTTOM} H ${W}`} className="pipe-zone-rule" vectorEffect="non-scaling-stroke" />
            <text x={14} y={ZONE_BOTTOM + 26} className="pipe-zone-label">Platform &amp; governance</text>

            {/* boundaries, e.g. the VPC */}
            {PIPELINE.groups.map((g) => (
              <g key={g.id} className="pipe-group">
                <rect x={g.x} y={g.y} width={g.w} height={g.h} rx="10" className="pipe-group-box" vectorEffect="non-scaling-stroke" />
                <text x={g.x + 100} y={g.y + 20} className="pipe-group-label">{g.label}</text>
              </g>
            ))}

            {geometry.map(({ e, d }) => (
              <path key={edgeId(e)} id={edgeId(e)} d={d} className={edgeClass(e)} data-kind={e.kind} data-from={e.from} data-to={e.to} vectorEffect="non-scaling-stroke" />
            ))}
            {geometry.filter(({ e }) => e.label).map(({ e, mid }) => (
              <text key={`l-${edgeId(e)}`} x={mid[0] + 9} y={mid[1] - 6} className="pipe-edge-label">{e.label}</text>
            ))}
            <circle ref={tracer} r="6" className="pipe-tracer" style={{ opacity: 0 }} />
          </svg>

          {nodes.map((n) => (
            <button
              key={n.id}
              ref={(el) => { nodeEls.current[n.id] = el; }}
              type="button"
              className={nodeClass(n.id)}
              style={{ left: `${((n.x - HALF) / W) * 100}%`, top: `${((n.y - HALF) / H) * 100}%`, width: `${((HALF * 2) / W) * 100}%` }}
              onPointerEnter={() => onFocus(n.id)}
              onFocus={() => onFocus(n.id)}
              onBlur={() => onFocus(null)}
              onClick={trace}
              aria-label={`${n.label} — ${n.sub}`}
              data-cursor=""
            >
              <ServiceLogo skill={resolveSkill(n)} />
              <span className="pipe-node__tick" aria-hidden>
                <svg viewBox="0 0 12 12"><path d="M3 6.2 L5 8.2 L9 4" /></svg>
              </span>
              {n.labelPos !== "none" && (
                <span className={`pipe-node__label ${n.labelPos === "top" ? "pipe-node__label--top" : ""}`}>
                  <span className="block font-display font-medium tracking-[-0.01em]">{n.label}</span>
                  <span className="pipe-node__sub block font-mono uppercase tracking-[0.14em]">{n.sub}</span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="pipe-caption">
        <div className="min-h-[3.4rem] flex-1">
          <div className="pipe-caption__info">
            {focus && byId[focus] ? (
              <>
                <p className="font-display text-[1.0625rem] font-medium tracking-[-0.01em] md:text-[1.125rem]">{byId[focus].label} <span className="text-ink-3">— {byId[focus].sub}</span></p>
                <p className="mt-1 max-w-[38rem] text-[0.9375rem] leading-[1.5] text-ink-2">{byId[focus].body}</p>
              </>
            ) : (
              <p className="max-w-[38rem] text-[0.9375rem] leading-[1.5] text-ink-3">Solid lines carry data. Dashed lines carry control. Hover a service to isolate its connections.</p>
            )}
          </div>
          <p ref={runStatus} className="pipe-run-status" role="status" aria-live="polite" />
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
          <Magnetic strength={0.25}>
            <button ref={runBtn} type="button" onClick={runPipeline} data-state="idle" className="run-btn" data-cursor="">
              <span className="run-btn__icon" aria-hidden>
                <svg viewBox="0 0 24 24" className="run-btn__svg">
                  <circle cx="12" cy="12" r="9" className="run-btn__track" />
                  <circle ref={runRing} cx="12" cy="12" r="9" className="run-btn__ring" style={{ strokeDasharray: RING, strokeDashoffset: RING }} />
                  <path d="M10 8 L16 12 L10 16 Z" className="run-btn__play" />
                  <path d="M8.4 12.2 L11 14.8 L15.6 9.6" className="run-btn__check" />
                </svg>
              </span>
              <span ref={runLabel} className="run-btn__label">{PIPELINE_RUN_LABELS.idle}</span>
            </button>
          </Magnetic>
          <button type="button" onClick={trace} data-cursor="" className="link-underline font-mono text-[0.75rem] uppercase tracking-[0.2em] text-ink-2">
            Trace a record <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
