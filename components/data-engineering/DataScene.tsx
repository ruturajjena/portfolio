"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { VideoPlane } from "@/components/three/VideoPlane";
import { pointsVertex, pointsFragment } from "@/components/three/shaders/points";
import { scroll } from "@/lib/scroll-store";
import { pointer } from "@/lib/pointer";
import { damp, lerp, range, seeded, smoothstep, panelOffset, panelVisible } from "@/lib/math";
import { budget, type Tier } from "@/lib/device";

const dummy = new THREE.Object3D();
const va = new THREE.Vector3();
const vb = new THREE.Vector3();

type Formations = Float32Array[]; // 5 stages × (n*3)

function buildFormations(n: number): Formations {
  const rnd = seeded(7);
  const g = () => (rnd() + rnd() + rnd() - 1.5) * 1.2;
  const F: Formations = Array.from({ length: 5 }, () => new Float32Array(n * 3));
  const set = (s: number, i: number, x: number, y: number, z: number) => { F[s][i * 3] = x; F[s][i * 3 + 1] = y; F[s][i * 3 + 2] = z; };

  // 0 — raw: chaos
  for (let i = 0; i < n; i++) set(0, i, (rnd() - 0.5) * 11, (rnd() - 0.5) * 6.5, (rnd() - 0.5) * 5);

  // 1 — ingestion: five sources on the left, streams pointing at the centre
  const sources = [[-5, 2.2], [-5.4, 0.9], [-5.1, -0.4], [-4.8, -1.7], [-5.5, -2.6]];
  for (let i = 0; i < n; i++) {
    const s = sources[i % sources.length];
    if (i % 4 === 0) {
      const t = rnd();
      set(1, i, lerp(s[0], 0.6, t) + g() * 0.15, lerp(s[1], 0, t) + g() * 0.15, g() * 0.4);
    } else set(1, i, s[0] + g() * 0.45, s[1] + g() * 0.3, g() * 0.6);
  }

  // 2 — transformation: sources → processing column → outputs
  for (let i = 0; i < n; i++) {
    const lane = i % 3;
    if (lane === 0) set(2, i, -3.8 + g() * 0.35, (rnd() - 0.5) * 4.6, g() * 0.6);
    else if (lane === 1) { const row = i % 5; set(2, i, 0 + g() * 0.12, 1.6 - row * 0.8 + g() * 0.08, g() * 0.15); }
    else set(2, i, 3.8 + g() * 0.35, (rnd() - 0.5) * 4.2, g() * 0.6);
  }

  // 3 — intelligence: interconnected sphere (fibonacci) with radial jitter
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = phi * i;
    const rad = 2.4 + g() * 0.25;
    set(3, i, Math.cos(th) * r * rad * 1.25, y * rad * 0.9, Math.sin(th) * r * rad);
  }

  // 4 — production: four tidy layers
  const layers = [[1.9, 7], [0.65, 11], [-0.6, 9], [-1.85, 6]];
  const total = layers.reduce((a, l) => a + l[1], 0);
  for (let i = 0; i < n; i++) {
    let idx = i % total, li = 0;
    while (idx >= layers[li][1]) { idx -= layers[li][1]; li++; }
    const [y, cols] = layers[li];
    const w = cols * 0.85;
    const depth = Math.floor(i / total);
    set(4, i, -w / 2 + (idx + 0.5) * (w / cols), y, -depth * 1.1 + 0.4);
  }
  return F;
}

/**
 * Data network synchronised with the scrubbed plate: nodes, hair-thin streams,
 * and particles travelling along the streams. Five formations blend by scroll.
 */
export function DataScene({ tier, reduced }: { tier: Tier; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const inst = useRef<THREE.InstancedMesh>(null);
  const { camera, viewport } = useThree();
  const n = budget(tier, 120, 80, 50);
  const flowCount = budget(tier, 720, 320, 140);

  const data = useMemo(() => {
    const F = buildFormations(n);
    const rnd = seeded(99);
    const scales = new Float32Array(n);
    for (let i = 0; i < n; i++) scales[i] = 0.55 + rnd() * 0.9;
    // edges: each node → 2 nearest neighbours in the production formation
    const pairs = new Set<string>();
    const edges: number[] = [];
    for (let i = 0; i < n; i++) {
      const d: { j: number; dist: number }[] = [];
      for (let j = 0; j < n; j++) if (j !== i) {
        const dx = F[4][i * 3] - F[4][j * 3], dy = F[4][i * 3 + 1] - F[4][j * 3 + 1], dz = F[4][i * 3 + 2] - F[4][j * 3 + 2];
        d.push({ j, dist: dx * dx + dy * dy + dz * dz });
      }
      d.sort((a, b) => a.dist - b.dist);
      for (let k = 0; k < 2; k++) {
        const j = d[k].j; const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!pairs.has(key)) { pairs.add(key); edges.push(i, j); }
      }
    }
    const edgeCount = edges.length / 2;
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(edgeCount * 6), 3).setUsage(THREE.DynamicDrawUsage));
    lineGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
    const lineMat = new THREE.LineBasicMaterial({ color: "#bcd8ff", transparent: true, opacity: 0 });

    const flowGeo = new THREE.BufferGeometry();
    flowGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(flowCount * 3), 3).setUsage(THREE.DynamicDrawUsage));
    const fr = new Float32Array(flowCount);
    const flowEdge = new Uint16Array(flowCount);
    const flowPhase = new Float32Array(flowCount);
    const flowSpeed = new Float32Array(flowCount);
    for (let i = 0; i < flowCount; i++) { fr[i] = rnd(); flowEdge[i] = Math.floor(rnd() * edgeCount); flowPhase[i] = rnd(); flowSpeed[i] = 0.12 + rnd() * 0.2; }
    flowGeo.setAttribute("aRand", new THREE.BufferAttribute(fr, 1));
    flowGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
    const flowMat = new THREE.ShaderMaterial({
      vertexShader: pointsVertex, fragmentShader: pointsFragment, transparent: true, depthWrite: false,
      uniforms: {
        uTime: { value: 0 }, uSize: { value: 3.2 }, uDpr: { value: 1 }, uMouse: { value: new THREE.Vector3(999, 999, 0) },
        uMouseRadius: { value: 0 }, uDrift: { value: 0 }, uColor: { value: new THREE.Color("#2f6bff") },
        uAccent: { value: new THREE.Color("#7cc7ff") }, uOpacity: { value: 0 },
      },
    });
    const nodeGeo = new THREE.OctahedronGeometry(0.048, 0);
    const nodeMat = new THREE.MeshStandardMaterial({ color: "#eaf2ff", roughness: 0.35, metalness: 0.2, emissive: new THREE.Color("#4f8fff"), emissiveIntensity: 0.35 });
    const current = new Float32Array(n * 3);
    current.set(F[0]);
    return { F, scales, edges, edgeCount, lineGeo, lineMat, flowGeo, flowMat, flowEdge, flowPhase, flowSpeed, nodeGeo, nodeMat, current };
  }, [n, flowCount]);

  const st = useRef({ ry: 0, rx: 0, t: 0 });

  useFrame((state, dtRaw) => {
    const g = group.current, im = inst.current;
    if (!g || !im) return;
    const dt = Math.min(dtRaw, 0.05);
    const v = scroll.view.data;
    const p = reduced ? 1 : scroll.progress.data;
    g.visible = panelVisible(v);
    if (!g.visible) return;
    st.current.t += dt;

    // Stage blend: hold each formation, transition through the middle of each 20% window.
    const s = Math.min(p * 4, 3.999);
    const i0 = Math.floor(s), i1 = Math.min(i0 + 1, 4);
    const f = smoothstep(0.2, 0.8, s - i0);
    const A = data.F[i0], B = data.F[i1];
    const cur = data.current;
    const k = 1 - Math.exp(-4 * dt);
    for (let i = 0; i < cur.length; i++) cur[i] += (lerp(A[i], B[i], f) - cur[i]) * k;

    // subtle organic motion in the raw stage only
    const chaos = 1 - range(p, 0.1, 0.3);
    const t = st.current.t;
    for (let i = 0; i < n; i++) {
      const x = cur[i * 3] + (reduced ? 0 : Math.sin(t * 0.6 + i) * 0.12 * chaos);
      const y = cur[i * 3 + 1] + (reduced ? 0 : Math.cos(t * 0.5 + i * 1.3) * 0.12 * chaos);
      const z = cur[i * 3 + 2];
      dummy.position.set(x, y, z);
      const sc = data.scales[i] * (0.6 + 0.4 * range(p, 0.15, 0.5));
      dummy.scale.setScalar(sc);
      dummy.rotation.set(t * 0.2 + i, t * 0.15, 0);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;

    // streams
    const lp = data.lineGeo.attributes.position as THREE.BufferAttribute;
    const la = lp.array as Float32Array;
    for (let e = 0; e < data.edgeCount; e++) {
      const a = data.edges[e * 2], b = data.edges[e * 2 + 1];
      la[e * 6] = cur[a * 3]; la[e * 6 + 1] = cur[a * 3 + 1]; la[e * 6 + 2] = cur[a * 3 + 2];
      la[e * 6 + 3] = cur[b * 3]; la[e * 6 + 4] = cur[b * 3 + 1]; la[e * 6 + 5] = cur[b * 3 + 2];
    }
    lp.needsUpdate = true;
    const edgeVis = range(p, 0.22, 0.45) * 0.12 + range(p, 0.6, 0.8) * 0.1;
    data.lineMat.opacity = edgeVis;

    // particles travelling along streams
    const fp = data.flowGeo.attributes.position as THREE.BufferAttribute;
    const fa = fp.array as Float32Array;
    for (let i = 0; i < flowCount; i++) {
      const e = data.flowEdge[i];
      const a = data.edges[e * 2], b = data.edges[e * 2 + 1];
      const tt = (data.flowPhase[i] + t * data.flowSpeed[i]) % 1;
      va.set(cur[a * 3], cur[a * 3 + 1], cur[a * 3 + 2]);
      vb.set(cur[b * 3], cur[b * 3 + 1], cur[b * 3 + 2]);
      va.lerp(vb, tt);
      fa[i * 3] = va.x; fa[i * 3 + 1] = va.y; fa[i * 3 + 2] = va.z;
    }
    fp.needsUpdate = true;
    data.flowMat.uniforms.uTime.value = t;
    data.flowMat.uniforms.uDpr.value = state.gl.getPixelRatio();
    data.flowMat.uniforms.uOpacity.value = range(p, 0.25, 0.45) * 0.5;

    // scene placement & parallax
    const vp = viewport.getCurrentViewport(camera, [0, 0, 0]);
    const wide = vp.width / vp.height > 1.1;
    const scale = wide ? Math.min(1, vp.width / 10.5) : Math.min(0.8, vp.width / 7.5);
    g.scale.setScalar(scale);
    g.position.set(0, (wide ? 0.3 : vp.height * 0.12) - panelOffset(v, 520) * vp.height, 0);
    st.current.ry = damp(st.current.ry, (reduced ? 0 : pointer.x * 0.12) + p * 0.5 - 0.25, 2, dt);
    st.current.rx = damp(st.current.rx, reduced ? 0 : -pointer.y * 0.06, 2, dt);
    g.rotation.set(st.current.rx, st.current.ry, 0);
  });

  return (
    <>
      <VideoPlane mediaKey="data" getOpacity={() => (panelVisible(scroll.view.data) ? 1 : 0)} getView={() => scroll.view.data} sectionVh={520} z={-2.2} scale={1.08} contrast={1.04} dark />
      <group ref={group}>
        <instancedMesh ref={inst} args={[data.nodeGeo, data.nodeMat, n]} frustumCulled={false} />
        <lineSegments geometry={data.lineGeo} material={data.lineMat} frustumCulled={false} />
        <points geometry={data.flowGeo} material={data.flowMat} frustumCulled={false} />
      </group>
    </>
  );
}
