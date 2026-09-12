"use client";
import { useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { pointsVertex, pointsFragment } from "@/components/three/shaders/points";
import { MACROVA } from "@/data/site";
import { asset } from "@/lib/asset";
import { scroll } from "@/lib/scroll-store";
import { pointer } from "@/lib/pointer";
import { damp, lerp, range, seeded, smoothstep, easeInOutCubic, panelOffset, panelVisible } from "@/lib/math";
import { budget, type Tier } from "@/lib/device";

const screenVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const screenFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap; uniform float uOpacity; uniform float uRadius; uniform vec2 uSize;
  varying vec2 vUv;
  float rbox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  void main(){
    vec2 p = (vUv - 0.5) * uSize;
    float d = rbox(p, uSize * 0.5, uRadius);
    float a = 1.0 - smoothstep(-0.006, 0.006, d);
    vec4 c = texture2D(uMap, vUv);
    gl_FragColor = vec4(c.rgb, a * uOpacity);
    #include <colorspace_fragment>
  }
`;

const W = 1.62, H = 3.42, D = 0.15;
const SW = W - 0.1, SH = H - 0.1;
/** Web dashboard backdrop, 16:10 like the source capture. */
const DW = 5.0, DH = DW / 1.6;

/**
 * Product film: the device floats, its interface layers lift apart, an
 * intelligence field swirls through, the screens fan into an interface
 * gallery, then everything reassembles. All per-frame updates are imperative.
 */
export function MacrovaScene({ tier, reduced }: { tier: Tier; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const device = useRef<THREE.Group>(null);
  const screens = useRef<(THREE.Mesh | null)[]>([]);
  const dash = useRef<THREE.Mesh>(null);
  const { camera, viewport } = useThree();
  const loaded = useLoader(THREE.TextureLoader, [asset(MACROVA.dashboard.src), ...MACROVA.screens.map((s) => asset(s.src))]);
  const dashTex = loaded[0];
  const textures = useMemo(() => loaded.slice(1), [loaded]);

  const screenMats = useMemo(() => {
    textures.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; });
    return textures.map(
      (t) =>
        new THREE.ShaderMaterial({
          vertexShader: screenVertex, fragmentShader: screenFragment, transparent: true, depthWrite: false,
          uniforms: { uMap: { value: t }, uOpacity: { value: 1 }, uRadius: { value: 0.16 }, uSize: { value: new THREE.Vector2(SW, SH) } },
        }),
    );
  }, [textures]);

  const dashMat = useMemo(() => {
    dashTex.colorSpace = THREE.SRGBColorSpace;
    dashTex.anisotropy = 8;
    return new THREE.ShaderMaterial({
      vertexShader: screenVertex, fragmentShader: screenFragment, transparent: true, depthWrite: false,
      uniforms: { uMap: { value: dashTex }, uOpacity: { value: 0 }, uRadius: { value: 0.09 }, uSize: { value: new THREE.Vector2(DW, DH) } },
    });
  }, [dashTex]);

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1a1a1c", metalness: 0.55, roughness: 0.38, transparent: true }), []);
  const rimMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3a3a3e", metalness: 0.8, roughness: 0.25, transparent: true }), []);

  const pCount = budget(tier, 520, 260, 120);
  const particles = useMemo(() => {
    const rnd = seeded(21);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    const rand = new Float32Array(pCount);
    const seeds = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) { rand[i] = rnd(); seeds[i * 3] = rnd() * Math.PI * 2; seeds[i * 3 + 1] = rnd(); seeds[i * 3 + 2] = rnd(); }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
    const mat = new THREE.ShaderMaterial({
      vertexShader: pointsVertex, fragmentShader: pointsFragment, transparent: true, depthWrite: false,
      uniforms: {
        uTime: { value: 0 }, uSize: { value: 3.4 }, uDpr: { value: 1 }, uMouse: { value: new THREE.Vector3(999, 999, 0) },
        uMouseRadius: { value: 0 }, uDrift: { value: 0 }, uColor: { value: new THREE.Color("#f6f4ef") },
        uAccent: { value: new THREE.Color("#7cc7ff") }, uOpacity: { value: 0 },
      },
    });
    return { geo, mat, seeds };
  }, [pCount]);

  const st = useRef({ t: 0, ry: 0, rx: 0 });

  useFrame((state, dtRaw) => {
    const g = group.current, dev = device.current;
    if (!g || !dev) return;
    const dt = Math.min(dtRaw, 0.05);
    const v = scroll.view.macrova;
    const p = reduced ? 0 : scroll.progress.macrova;
    g.visible = panelVisible(v);
    if (!g.visible) return;
    st.current.t += dt;
    const t = st.current.t;

    const vp = viewport.getCurrentViewport(camera, [0, 0, 0]);
    const wide = vp.width / vp.height > 1.1;
    const scale = wide ? Math.min(1, vp.height / 5.6) : Math.min(0.5, vp.width / 6.4);
    g.position.set(wide ? vp.width * 0.23 : 0, (wide ? -0.15 : vp.height * 0.24) - panelOffset(v, 420) * vp.height, 0);

    const enter = smoothstep(0.04, 0.2, v);
    const separate = easeInOutCubic(range(p, 0.18, 0.38)) * (1 - easeInOutCubic(range(p, 0.78, 0.92)));
    const fan = easeInOutCubic(range(p, 0.56, 0.72)) * (1 - easeInOutCubic(range(p, 0.78, 0.92)));
    const intel = smoothstep(0.36, 0.48, p) * (1 - smoothstep(0.66, 0.8, p));
    const float = reduced ? 0 : Math.sin(t * 0.8) * 0.06;
    // pull back slightly while fanned so the outer screens clear the copy column and the viewport edge
    g.scale.setScalar(scale * (1 - 0.12 * fan));

    for (let i = 0; i < 3; i++) {
      const m = screens.current[i];
      if (!m) continue;
      const off = i - 1;
      const sepZ = i === 0 ? 0 : i === 1 ? 0.45 : 0.9;
      const sepY = i === 0 ? 0 : i === 1 ? 0.18 : 0.36;
      m.position.set(
        lerp(0, off * 1.7, fan),
        lerp(0, sepY, separate) * (1 - fan),
        D / 2 + 0.004 + lerp(0, sepZ, separate) * (1 - fan) + fan * 0.3,
      );
      m.rotation.set(0, lerp(0, -off * 0.26, fan), 0);
      screenMats[i].uniforms.uOpacity.value = (i === 0 ? 1 : Math.max(separate, fan)) * enter;
    }
    bodyMat.opacity = (1 - fan * 0.45) * enter;
    rimMat.opacity = (1 - fan * 0.45) * enter * 0.9;

    // The web dashboard rises behind the reassembling phone: the finale shows the product on web and mobile.
    const d = dash.current;
    if (d) {
      const rise = easeInOutCubic(range(p, 0.8, 0.95));
      const dScale = wide ? 1 : 0.5;
      d.visible = rise > 0.001 || reduced;
      d.scale.setScalar(dScale * (0.94 + 0.06 * rise));
      d.position.set(0, 0.25 + (1 - rise) * -0.5, -1.5);
      d.rotation.set(-0.04, st.current.ry * 0.35, 0);
      dashMat.uniforms.uOpacity.value = (reduced ? 1 : rise) * enter;
    }

    const baseRy = lerp(-0.32, 0.08, easeInOutCubic(range(p, 0, 0.35)));
    st.current.ry = damp(st.current.ry, baseRy + (reduced ? 0 : pointer.x * 0.16), 2.5, dt);
    st.current.rx = damp(st.current.rx, (reduced ? 0 : -pointer.y * 0.08) - 0.04, 2.5, dt);
    dev.rotation.set(st.current.rx, st.current.ry, 0);
    dev.position.y = float + (1 - enter) * -0.6;

    const pa = particles.geo.attributes.position as THREE.BufferAttribute;
    const arr = pa.array as Float32Array;
    for (let i = 0; i < pCount; i++) {
      const a = particles.seeds[i * 3] + t * (0.25 + particles.seeds[i * 3 + 1] * 0.35);
      const r = 1.2 + particles.seeds[i * 3 + 2] * 1.4;
      const y = (particles.seeds[i * 3 + 1] - 0.5) * 4.2 + Math.sin(a * 0.5) * 0.2;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(a) * r * 0.6 + 0.4;
    }
    pa.needsUpdate = true;
    particles.mat.uniforms.uTime.value = t;
    particles.mat.uniforms.uDpr.value = state.gl.getPixelRatio();
    particles.mat.uniforms.uOpacity.value = intel * 0.85;
  });

  return (
    <group ref={group}>
      <group ref={device}>
        <RoundedBox args={[W, H, D]} radius={0.2} smoothness={6} material={bodyMat} renderOrder={1} />
        <RoundedBox args={[W + 0.012, H + 0.012, D - 0.02]} radius={0.205} smoothness={6} material={rimMat} renderOrder={0} />
        {screenMats.map((mat, i) => (
          <mesh key={i} ref={(el) => { screens.current[i] = el; }} material={mat} renderOrder={2 + i}>
            <planeGeometry args={[SW, SH]} />
          </mesh>
        ))}
      </group>
      <mesh ref={dash} material={dashMat} renderOrder={-1} visible={false}>
        <planeGeometry args={[DW, DH]} />
      </mesh>
      <points geometry={particles.geo} material={particles.mat} frustumCulled={false} />
    </group>
  );
}
