"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { portraitVertex, portraitFragment } from "./shaders/portrait";
import { useMedia } from "@/lib/media-registry";
import { useVideoTexture } from "./useVideoTexture";
import { scroll } from "@/lib/scroll-store";
import { pointer } from "@/lib/pointer";
import { damp, range, easeInOutCubic, panelVisible } from "@/lib/math";

const KEY = new THREE.Vector3(196 / 255, 16 / 255, 16 / 255);

/**
 * The hero portrait: a keyed video texture on a plane that recedes into the
 * scene and dissolves as the hero scrolls out.
 */
export function PortraitPlane({ reduced }: { reduced: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera, viewport } = useThree();
  const video = useMedia("portrait");

  const texture = useVideoTexture(video);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: portraitVertex,
        fragmentShader: portraitFragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMap: { value: null },
          uKey: { value: KEY },
          uSimilarity: { value: 0.11 },
          uSmooth: { value: 0.07 },
          uSpill: { value: 0.9 },
          uOpacity: { value: 0 },
          uDissolve: { value: 0 },
          uSaturation: { value: 1.0 },
          uBottomFade: { value: 0.16 },
          uTime: { value: 0 },
        },
      }),
    [],
  );
  useEffect(() => { material.uniforms.uMap.value = texture; }, [texture, material]);
  useEffect(() => () => material.dispose(), [material]);

  const st = useRef({ opacity: 0, rx: 0, ry: 0 });

  useFrame((_, dtRaw) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(dtRaw, 0.05);
    const view = scroll.view.hero;
    const p = scroll.progress.hero;
    const visible = !!texture && panelVisible(view);
    m.visible = visible;
    if (!visible) return;

    const vp = viewport.getCurrentViewport(camera, [0, 0, 0]);
    const wide = vp.width / vp.height > 1.1;
    const h = wide ? Math.min(vp.height * 0.98, vp.width * 0.62) : Math.min(vp.height * 0.6, vp.width * 1.15);
    const w = h * 0.8;

    // scroll choreography: hold → recede → dissolve
    const recede = easeInOutCubic(range(p, 0.12, 0.85));
    const dissolve = range(p, 0.42, 0.92);
    const z = -recede * 7.5;
    const x = wide ? 1.45 - recede * 0.6 : 0;
    const y = wide
      ? -vp.height * 0.5 + h * 0.5 - h * 0.02 + recede * 1.2
      : vp.height * 0.5 - h * 0.5 - vp.height * 0.09 + recede * 0.8;
    m.position.set(x, y, z);
    m.scale.set(w, h, 1);

    // ready fade
    const ready = texture && texture.userData.frameReady ? 1 : 0;
    st.current.opacity = damp(st.current.opacity, ready, 2.5, dt);
    material.uniforms.uOpacity.value = st.current.opacity * (1 - range(p, 0.8, 0.97));
    material.uniforms.uDissolve.value = reduced ? 0 : dissolve;
    material.uniforms.uTime.value += dt;

    // faint parallax tilt toward the cursor
    const tx = reduced ? 0 : pointer.y * 0.04;
    const ty = reduced ? 0 : pointer.x * 0.07;
    st.current.rx = damp(st.current.rx, tx, 4, dt);
    st.current.ry = damp(st.current.ry, ty, 4, dt);
    m.rotation.set(st.current.rx, st.current.ry, 0);
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={5} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
