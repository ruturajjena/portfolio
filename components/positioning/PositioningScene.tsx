"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scroll } from "@/lib/scroll-store";
import { pointer } from "@/lib/pointer";
import { damp, smoothstep } from "@/lib/math";

/** Two hair-thin wireframe solids drifting behind the positioning statement. */
export function PositioningScene({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { camera, viewport } = useThree();
  const { geoA, geoB, mat } = useMemo(() => ({
    geoA: new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.3, 1)),
    geoB: new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1.1, 0)),
    mat: new THREE.LineBasicMaterial({ color: "#2b2b2e", transparent: true, opacity: 0 }),
  }), []);
  const st = useRef({ ry: 0 });
  useFrame((_, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    const v = scroll.view.positioning;
    g.visible = v > 0.0005 && v < 0.9995;
    if (!g.visible) { mat.opacity = 0; return; }
    const vp = viewport.getCurrentViewport(camera, [0, 0, -2]);
    mat.opacity = 0.14 * smoothstep(0, 0.25, v) * (1 - smoothstep(0.75, 1, v));
    g.position.set(vp.width * 0.28, (0.5 - v) * 4.5, -2);
    st.current.ry = damp(st.current.ry, reduced ? 0 : pointer.x * 0.2, 2, dt);
    g.rotation.y = st.current.ry + (reduced ? 0 : v * 1.4);
    g.rotation.x = -0.3 + (reduced ? 0 : v * 0.5);
  });
  return (
    <group ref={group}>
      <lineSegments geometry={geoA} material={mat} />
      <lineSegments geometry={geoB} material={mat} position={[-4.2, -1.4, 0.6]} />
    </group>
  );
}
