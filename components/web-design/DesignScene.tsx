"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { VideoPlane } from "@/components/three/VideoPlane";
import { scroll } from "@/lib/scroll-store";
import { pointer } from "@/lib/pointer";
import { damp, lerp, range, seeded, smoothstep, easeInOutCubic, panelOffset, panelVisible } from "@/lib/math";
import type { Tier } from "@/lib/device";

type Surface = { x: number; y: number; w: number; h: number; tone: "dark" | "mid" | "light" | "accent"; z: number; text?: string };

const FRAME_W = 7.2, FRAME_H = 4.3, COLS = 12;
const col = (c: number) => -FRAME_W / 2 + (c / COLS) * FRAME_W;

// A twelve-column editorial layout, described in grid units.
const LAYOUT: Surface[] = [
  { x: col(0), y: 1.95, w: FRAME_W, h: 0.16, tone: "light", z: 0 },                 // nav bar
  { x: col(0), y: 1.4, w: FRAME_W * (7 / 12), h: 1.35, tone: "dark", z: 0.9, text: "Aa" }, // hero type block
  { x: col(7.4), y: 1.4, w: FRAME_W * (4.6 / 12), h: 1.35, tone: "mid", z: 0.5 },   // hero image
  { x: col(0), y: -0.15, w: FRAME_W * (3.8 / 12), h: 1.0, tone: "light", z: 0.3, text: "01" },
  { x: col(4.1), y: -0.15, w: FRAME_W * (3.8 / 12), h: 1.0, tone: "light", z: 0.6, text: "02" },
  { x: col(8.2), y: -0.15, w: FRAME_W * (3.8 / 12), h: 1.0, tone: "accent", z: 1.2, text: "03" },
  { x: col(0), y: -1.35, w: FRAME_W * (5 / 12), h: 0.7, tone: "mid", z: 0.2 },
  { x: col(5.3), y: -1.35, w: FRAME_W * (6.7 / 12), h: 0.7, tone: "dark", z: 0.7, text: "Grid 12" },
  { x: col(0), y: -2.1, w: FRAME_W, h: 0.05, tone: "dark", z: 0 },                   // footer rule
];

const TONES: Record<Surface["tone"], { color: string; opacity: number }> = {
  dark: { color: "#2b2b2e", opacity: 0.92 },
  mid: { color: "#c9c4b9", opacity: 0.75 },
  light: { color: "#ffffff", opacity: 0.85 },
  accent: { color: "#2f6bff", opacity: 0.8 },
};

function makeTextTexture(text: string, dark: boolean) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = dark ? "#f6f4ef" : "#0e0e0f";
  ctx.font = "500 150px 'Inter Tight', 'Inter', system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 28, 132);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/**
 * Design environment: an empty canvas, then a grid, then surfaces and type,
 * then everything lifts into depth, then it settles into a layered interface.
 */
export function DesignScene({ tier, reduced }: { tier: Tier; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const layoutGroup = useRef<THREE.Group>(null);
  const { camera, viewport } = useThree();

  const built = useMemo(() => {
    const rnd = seeded(5);
    // frame
    const frame = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-FRAME_W / 2, -FRAME_H / 2, 0), new THREE.Vector3(FRAME_W / 2, -FRAME_H / 2, 0),
      new THREE.Vector3(FRAME_W / 2, FRAME_H / 2, 0), new THREE.Vector3(-FRAME_W / 2, FRAME_H / 2, 0), new THREE.Vector3(-FRAME_W / 2, -FRAME_H / 2, 0),
    ]);
    // grid
    const gv: number[] = [];
    for (let c = 0; c <= COLS; c++) { const x = col(c); gv.push(x, -FRAME_H / 2, 0, x, FRAME_H / 2, 0); }
    const rows = 8;
    for (let r = 0; r <= rows; r++) { const y = -FRAME_H / 2 + (r / rows) * FRAME_H; gv.push(-FRAME_W / 2, y, 0, FRAME_W / 2, y, 0); }
    const grid = new THREE.BufferGeometry();
    grid.setAttribute("position", new THREE.Float32BufferAttribute(gv, 3));
    const gridMat = new THREE.LineBasicMaterial({ color: "#2b2b2e", transparent: true, opacity: 0 });
    const frameMat = new THREE.LineBasicMaterial({ color: "#2b2b2e", transparent: true, opacity: 0 });
    const frameLine = new THREE.Line(frame, frameMat);

    const surfaces = LAYOUT.map((s, i) => {
      const geo = new THREE.PlaneGeometry(s.w, s.h);
      const edges = new THREE.EdgesGeometry(geo);
      const tone = TONES[s.tone];
      const fill = new THREE.MeshBasicMaterial({ color: tone.color, transparent: true, opacity: 0, depthWrite: false });
      const edge = new THREE.LineBasicMaterial({ color: "#2b2b2e", transparent: true, opacity: 0 });
      const text = s.text && tier !== "low" ? makeTextTexture(s.text, s.tone === "dark" || s.tone === "accent") : null;
      const textMat = text ? new THREE.MeshBasicMaterial({ map: text, transparent: true, opacity: 0, depthWrite: false }) : null;
      return { s, geo, edges, fill, edge, textMat, cx: s.x + s.w / 2, cy: s.y - s.h / 2, tilt: (rnd() - 0.5) * 0.4, delay: i / LAYOUT.length };
    });
    return { frame, frameMat, frameLine, grid, gridMat, surfaces };
  }, [tier]);

  const st = useRef({ ry: 0, rx: 0, t: 0 });

  useFrame((_, dtRaw) => {
    const g = group.current, lg = layoutGroup.current;
    if (!g || !lg) return;
    const dt = Math.min(dtRaw, 0.05);
    const v = scroll.view.design;
    const p = reduced ? 1 : scroll.progress.design;
    g.visible = panelVisible(v);
    if (!g.visible) return;
    st.current.t += dt;
    const fadeIO = 1;

    const vp = viewport.getCurrentViewport(camera, [0, 0, 0]);
    const wide = vp.width / vp.height > 1.1;
    const scale = (wide ? Math.min(1, vp.width / 9.4) : Math.min(0.6, vp.width / 7.6)) * 0.94;
    g.scale.setScalar(scale);
    g.position.set(0, (wide ? 0.32 : vp.height * 0.12) - panelOffset(v, 520) * vp.height, 0);

    // stages
    const brief = range(p, 0.02, 0.16);                 // frame draws on
    const structure = range(p, 0.2, 0.38);              // grid + outlines
    const visual = range(p, 0.42, 0.58);                // fills + type
    const motion = easeInOutCubic(range(p, 0.6, 0.76)); // lift into depth
    const settle = easeInOutCubic(range(p, 0.82, 0.96)); // compose

    built.frameMat.opacity = 0.5 * brief * fadeIO;
    built.gridMat.opacity = 0.22 * structure * (1 - motion * 0.6) * fadeIO;
    // draw-on: scale the frame from the centre horizontally
    lg.scale.set(1, 1, 1);

    const depth = motion * (1 - settle * 0.72);
    built.surfaces.forEach((sf, i) => {
      const tone = TONES[sf.s.tone];
      const outline = smoothstep(sf.delay * 0.5, sf.delay * 0.5 + 0.5, structure);
      const fill = smoothstep(sf.delay * 0.5, sf.delay * 0.5 + 0.5, visual);
      sf.edge.opacity = 0.35 * outline * (1 - fill * 0.7) * fadeIO;
      sf.fill.opacity = tone.opacity * fill * fadeIO;
      if (sf.textMat) sf.textMat.opacity = fill * fadeIO;
      const obj = lg.children[i + 2] as THREE.Group; // after frame + grid
      if (!obj) return;
      obj.position.set(sf.cx, sf.cy, sf.s.z * depth * 1.6);
      obj.rotation.set(0, sf.tilt * depth, 0);
      const sc = 0.985 + 0.015 * fill;
      obj.scale.setScalar(sc);
    });

    // camera-like drift of the whole composition
    const targetRy = lerp(0, -0.42, motion) * (1 - settle * 0.55) + (reduced ? 0 : pointer.x * 0.08);
    const targetRx = lerp(0, 0.12, motion) * (1 - settle * 0.55) + (reduced ? 0 : -pointer.y * 0.05);
    st.current.ry = damp(st.current.ry, targetRy, 2.5, dt);
    st.current.rx = damp(st.current.rx, targetRx, 2.5, dt);
    lg.rotation.set(st.current.rx, st.current.ry, 0);
    lg.position.z = lerp(0, -0.8, motion) * (1 - settle);
  });

  return (
    <>
      <VideoPlane mediaKey="design" getOpacity={() => (panelVisible(scroll.view.design) ? 1 : 0)} getView={() => scroll.view.design} sectionVh={520} z={-2.2} scale={1.08} contrast={1.06} white={[0.9, 0.88, 0.86]} />
      <group ref={group}>
        <group ref={layoutGroup}>
          <primitive object={built.frameLine} />
          <lineSegments geometry={built.grid} material={built.gridMat} />
          {built.surfaces.map((sf, i) => (
            <group key={i}>
              <mesh geometry={sf.geo} material={sf.fill} renderOrder={1 + i} />
              <lineSegments geometry={sf.edges} material={sf.edge} />
              {sf.textMat && (
                <mesh material={sf.textMat} position={[-sf.s.w / 2 + Math.min(sf.s.w, sf.s.h) * 0.42, 0, 0.002]} renderOrder={20 + i}>
                  <planeGeometry args={[Math.min(sf.s.w, sf.s.h) * 0.8, Math.min(sf.s.w, sf.s.h) * 0.4]} />
                </mesh>
              )}
            </group>
          ))}
        </group>
      </group>
    </>
  );
}
