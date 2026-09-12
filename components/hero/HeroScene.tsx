"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PortraitPlane } from "@/components/three/PortraitPlane";
import { scroll } from "@/lib/scroll-store";
import { pointer } from "@/lib/pointer";
import { damp, range, seeded, easeInOutCubic, panelOffset } from "@/lib/math";
import type { Tier } from "@/lib/device";

const GRAPHITE = "#2b2b2e";

/**
 * Hero environment: the keyed portrait plus sparse geometric fragments and a
 * few hair-thin connecting lines. On scroll the fragments drift past the
 * camera while the portrait recedes — the feeling of moving through the scene.
 */
export function HeroScene({ tier, reduced }: { tier: Tier; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const fragments = useRef<THREE.Group>(null);
  const { camera, viewport } = useThree();
  const count = tier === "high" ? 26 : tier === "mid" ? 16 : 9;

  const { frags, lines, lineMat, fragMat } = useMemo(() => {
    const rnd = seeded(42);
    const geos = [
      new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(1)),
      new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1)),
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1)),
    ];
    const frags = Array.from({ length: count }, (_, i) => {
      const a = rnd() * Math.PI * 2;
      const r = 2.2 + rnd() * 3.2;
      return {
        geo: geos[i % geos.length],
        pos: new THREE.Vector3(Math.cos(a) * r * 1.2 + 0.8, Math.sin(a) * r * 0.7, -2 + rnd() * 4 - 1),
        scale: 0.06 + rnd() * 0.16,
        rot: new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6),
        speed: (0.1 + rnd() * 0.25) * (rnd() > 0.5 ? 1 : -1),
      };
    });
    // thin lines between nearby anchors
    const anchors = frags.map((f) => f.pos);
    const verts: number[] = [];
    for (let i = 0; i < anchors.length; i++)
      for (let j = i + 1; j < anchors.length; j++)
        if (anchors[i].distanceTo(anchors[j]) < 2.4) verts.push(...anchors[i].toArray(), ...anchors[j].toArray());
    const lines = new THREE.BufferGeometry();
    lines.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: GRAPHITE, transparent: true, opacity: 0.16 });
    const fragMat = new THREE.LineBasicMaterial({ color: GRAPHITE, transparent: true, opacity: 0.55 });
    return { frags, lines, lineMat, fragMat };
  }, [count]);

  const st = useRef({ rx: 0, ry: 0, t: 0 });

  useFrame((_, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    const view = scroll.view.hero;
    const p = scroll.progress.hero;
    g.visible = view < 1;
    if (!g.visible) return;
    st.current.t += dt;

    const fly = easeInOutCubic(range(p, 0.1, 0.95));
    g.position.z = fly * 9;              // fragments travel past the camera
    g.position.y = -panelOffset(view, 260) * viewport.getCurrentViewport(camera, [0, 0, 0]).height;
    const fade = 1 - range(p, 0.55, 0.9);
    lineMat.opacity = 0.16 * fade;
    fragMat.opacity = 0.55 * fade;

    const tx = reduced ? 0 : pointer.y * 0.05;
    const ty = reduced ? 0 : pointer.x * 0.08;
    st.current.rx = damp(st.current.rx, tx, 2.5, dt);
    st.current.ry = damp(st.current.ry, ty, 2.5, dt);
    g.rotation.set(st.current.rx, st.current.ry, 0);

    if (fragments.current && !reduced) {
      fragments.current.children.forEach((c, i) => {
        const f = frags[i];
        c.rotation.y += f.speed * dt;
        c.rotation.x += f.speed * 0.6 * dt;
      });
    }
  });

  return (
    <group ref={group}>
      <PortraitPlane reduced={reduced} />
      <group ref={fragments}>
        {frags.map((f, i) => (
          <lineSegments key={i} geometry={f.geo} material={fragMat} position={f.pos} rotation={f.rot} scale={f.scale} />
        ))}
      </group>
      <lineSegments geometry={lines} material={lineMat} />
    </group>
  );
}
