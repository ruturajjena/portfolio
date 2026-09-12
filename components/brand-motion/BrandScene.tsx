"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scroll } from "@/lib/scroll-store";
import { pointer } from "@/lib/pointer";
import { damp, range, seeded, easeInOutCubic } from "@/lib/math";
import type { Tier } from "@/lib/device";

const B = ["1111.", "1...1", "1...1", "1111.", "1...1", "1...1", "1111."];
const M = ["1...1", "11.11", "1.1.1", "1...1", "1...1", "1...1", "1...1"];
const dummy = new THREE.Object3D();
const q = new THREE.Quaternion();
const qi = new THREE.Quaternion();
const e = new THREE.Euler();

/** Scattered graphite fragments assemble into the Brand Motion monogram, then hold and breathe. */
export function BrandScene({ tier, reduced }: { tier: Tier; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const inst = useRef<THREE.InstancedMesh>(null);
  const { camera, viewport } = useThree();
  const sub = tier === "low" ? 1 : 2;

  const data = useMemo(() => {
    const rnd = seeded(11);
    const cell = 0.3, gap = 1;
    const targets: THREE.Vector3[] = [];
    const glyphs = [B, M];
    const totalCols = 5 * 2 + gap;
    glyphs.forEach((rows, gi) => {
      rows.forEach((row, r) => {
        [...row].forEach((ch, c) => {
          if (ch !== "1") return;
          const gx = gi * (5 + gap) + c;
          for (let sx = 0; sx < sub; sx++) for (let sy = 0; sy < sub; sy++) {
            const x = (gx - totalCols / 2 + 0.5) * cell + ((sx + 0.5) / sub - 0.5) * cell;
            const y = (3 - r) * cell + ((sy + 0.5) / sub - 0.5) * cell;
            targets.push(new THREE.Vector3(x, y, 0));
          }
        });
      });
    });
    const n = targets.length;
    const scatter = targets.map(() => {
      const a = rnd() * Math.PI * 2, b = Math.acos(2 * rnd() - 1), r = 3 + rnd() * 3.5;
      return new THREE.Vector3(Math.sin(b) * Math.cos(a) * r, Math.sin(b) * Math.sin(a) * r * 0.7, Math.cos(b) * r - 1);
    });
    const rot = targets.map(() => new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6));
    const delay = targets.map(() => rnd() * 0.45);
    const size = (cell / sub) * 0.78;
    const geo = new THREE.BoxGeometry(size, size, size);
    const mat = new THREE.MeshStandardMaterial({ color: "#2b2b2e", roughness: 0.4, metalness: 0.3, transparent: true, opacity: 0 });
    const colors = new Float32Array(n * 3);
    const accent = new THREE.Color("#2f6bff"), base = new THREE.Color("#2b2b2e");
    for (let i = 0; i < n; i++) { const c = rnd() > 0.955 ? accent : base; colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; }
    return { n, targets, scatter, rot, delay, geo, mat, colors };
  }, [sub]);

  const st = useRef({ ry: 0, rx: 0, t: 0, a: 0 });

  useFrame((_, dtRaw) => {
    const g = group.current, im = inst.current;
    if (!g || !im) return;
    const dt = Math.min(dtRaw, 0.05);
    const v = scroll.view.brand;
    g.visible = v > 0.0005 && v < 0.9995;
    if (!g.visible) return;
    st.current.t += dt;
    const t = st.current.t;
    const assembleTarget = reduced ? 1 : range(v, 0.22, 0.62);
    st.current.a = damp(st.current.a, assembleTarget, 5, dt);
    const a = st.current.a;
    data.mat.opacity = range(v, 0.08, 0.25) * (1 - range(v, 0.85, 1));

    const vp = viewport.getCurrentViewport(camera, [0, 0, 0]);
    const wide = vp.width / vp.height > 1.1;
    const scale = wide ? Math.min(1.15, vp.width / 9) : Math.min(0.85, vp.width / 5.2);
    g.scale.setScalar(scale);
    g.position.set(wide ? vp.width * 0.22 : 0, wide ? 0 : -vp.height * 0.16, 0);

    for (let i = 0; i < data.n; i++) {
      const local = easeInOutCubic(range(a, data.delay[i], data.delay[i] + 0.55));
      const from = data.scatter[i], to = data.targets[i];
      const breathe = reduced ? 0 : Math.sin(t * 0.9 + i * 0.37) * 0.012;
      dummy.position.set(from.x + (to.x - from.x) * local, from.y + (to.y - from.y) * local, from.z + (to.z - from.z) * local + breathe);
      e.set(data.rot[i].x + (reduced ? 0 : t * 0.3), data.rot[i].y + (reduced ? 0 : t * 0.2), data.rot[i].z);
      q.setFromEuler(e);
      qi.identity();
      q.slerp(qi, local);
      dummy.quaternion.copy(q);
      dummy.scale.setScalar(0.6 + 0.4 * local);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;

    st.current.ry = damp(st.current.ry, (reduced ? 0 : pointer.x * 0.25) + (0.5 - v) * 0.6, 2.5, dt);
    st.current.rx = damp(st.current.rx, reduced ? 0 : -pointer.y * 0.12, 2.5, dt);
    g.rotation.set(st.current.rx, st.current.ry, 0);
  });

  return (
    <group ref={group}>
      <instancedMesh ref={inst} args={[data.geo, data.mat, data.n]} frustumCulled={false}>
        <instancedBufferAttribute attach="instanceColor" args={[data.colors, 3]} />
      </instancedMesh>
    </group>
  );
}
