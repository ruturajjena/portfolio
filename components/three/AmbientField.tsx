"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { pointsVertex, pointsFragment } from "./shaders/points";
import { formation } from "./formations";
import { scroll } from "@/lib/scroll-store";
import { pointer } from "@/lib/pointer";
import { damp, lerp, range, smoothstep, seeded } from "@/lib/math";
import type { SectionId } from "@/data/site";

const LIGHT = new THREE.Color("#2b2b2e");
const DARK = new THREE.Color("#f6f4ef");
const ACCENT = new THREE.Color("#2f6bff");
const tmpColor = new THREE.Color();

/**
 * One persistent Points cloud that lives for the entire page. Its positions
 * damp toward the active section's formation each frame; nothing is ever
 * re-allocated after mount.
 */
export function AmbientField({ count, reduced, dpr }: { count: number; reduced: boolean; dpr: number }) {
  const points = useRef<THREE.Points>(null);
  const { viewport, camera } = useThree();

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const current = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    const rnd = seeded(2024);
    for (let i = 0; i < count; i++) rand[i] = rnd();
    geometry.setAttribute("position", new THREE.BufferAttribute(current, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
    const material = new THREE.ShaderMaterial({
      vertexShader: pointsVertex,
      fragmentShader: pointsFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 4.2 },
        uDpr: { value: dpr },
        uMouse: { value: new THREE.Vector3(999, 999, 0) },
        uMouseRadius: { value: reduced ? 0 : 1.4 },
        uDrift: { value: reduced ? 0 : 0.06 },
        uColor: { value: LIGHT.clone() },
        uAccent: { value: ACCENT.clone() },
        uOpacity: { value: 0 },
      },
    });
    return { geometry, material };
  }, [count, dpr, reduced]);

  const state = useRef({ initialised: false, opacity: 0, lastKey: "" });

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const vp = viewport.getCurrentViewport(camera, [0, 0, -2]);
    const active = scroll.active;

    // Choose a target formation. Contact blends converge → disperse.
    let target: Float32Array;
    let mix = 1;
    let blendTarget: Float32Array | null = null;
    if (active === "contact") {
      const p = scroll.progress.contact;
      const converge = formation("contact-converge", count, vp.width, vp.height);
      const disperse = formation("contact-disperse", count, vp.width, vp.height);
      const wide = formation("about", count, vp.width, vp.height);
      if (p < 0.55) { target = wide; blendTarget = converge; mix = smoothstep(0.0, 0.55, p); }
      else { target = converge; blendTarget = disperse; mix = smoothstep(0.55, 1, p); }
    } else {
      target = formation(active as SectionId, count, vp.width, vp.height);
    }

    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    if (!state.current.initialised) {
      arr.set(target);
      state.current.initialised = true;
    }
    const k = 1 - Math.exp(-(reduced ? 6 : 1.7) * dt);
    for (let i = 0; i < arr.length; i++) {
      const t = blendTarget ? lerp(target[i], blendTarget[i], mix) : target[i];
      arr[i] += (t - arr[i]) * k;
    }
    pos.needsUpdate = true;

    // Opacity: quieter behind busy scenes, brighter for the hero and the final convergence.
    const dark = scroll.darkTarget;
    let targetOpacity = 0.55;
    if (active === "data" || active === "design") targetOpacity = 0.28;
    if (active === "skills") targetOpacity = 0.26; // the diagram carries this section
    if (active === "builds" || active === "macrova") targetOpacity = 0.4;
    if (active === "contact") targetOpacity = 0.75 * (1 - range(scroll.progress.contact, 0.86, 1) * 0.8);
    if (active === "hero") targetOpacity = 0.6 * (1 - range(scroll.progress.hero, 0.85, 1) * 0.5);
    state.current.opacity = damp(state.current.opacity, targetOpacity, 3, dt);

    const u = material.uniforms;
    u.uTime.value += dt;
    u.uOpacity.value = state.current.opacity;
    tmpColor.copy(LIGHT).lerp(DARK, dark);
    (u.uColor.value as THREE.Color).copy(tmpColor);
    // pointer in world units on the z=-2 plane
    if (pointer.active && !reduced) {
      (u.uMouse.value as THREE.Vector3).set(pointer.x * vp.width * 0.5, pointer.y * vp.height * 0.5, -2);
    }
    // Sizes scale with viewport so mobile does not get giant dots.
    u.uSize.value = active === "contact" ? 5.5 : 4.2;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} renderOrder={-5} />;
}
