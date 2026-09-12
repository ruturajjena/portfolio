"use client";
import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useDevice, budget } from "@/lib/device";
import { scroll } from "@/lib/scroll-store";
import { pointer } from "@/lib/pointer";
import { damp } from "@/lib/math";
import { AmbientField } from "./AmbientField";
import { HeroScene } from "@/components/hero/HeroScene";
import { PositioningScene } from "@/components/positioning/PositioningScene";
import { DataScene } from "@/components/data-engineering/DataScene";
import { MacrovaScene } from "@/components/macrova/MacrovaScene";
import { DesignScene } from "@/components/web-design/DesignScene";
import { BrandScene } from "@/components/brand-motion/BrandScene";

const LIGHT_BG = new THREE.Color("#f6f4ef");
const DARK_BG = new THREE.Color("#0b0b0c");
const tmp = new THREE.Color();

/** Background colour lerp + subtle camera parallax. Runs for the entire page. */
function Environment({ reduced }: { reduced: boolean }) {
  const { gl, camera } = useThree();
  const dark = useRef(0);
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    dark.current = damp(dark.current, scroll.darkTarget, 6, dt);
    tmp.copy(LIGHT_BG).lerp(DARK_BG, dark.current);
    gl.setClearColor(tmp, 1);
    if (!reduced) {
      const tx = pointer.active ? pointer.x * 0.22 : 0;
      const ty = pointer.active ? pointer.y * 0.14 : 0;
      camera.position.x = damp(camera.position.x, tx, 2.2, dt);
      camera.position.y = damp(camera.position.y, ty, 2.2, dt);
      camera.lookAt(0, 0, 0);
    }
  });
  return null;
}

/** Pause rendering when the tab is hidden; R3F's loop is rAF-driven, but this also stops video texture uploads. */
function VisibilityGuard() {
  const { setFrameloop } = useThree();
  useEffect(() => {
    const onVis = () => setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [setFrameloop]);
  return null;
}

export function Stage() {
  const device = useDevice();
  const reduced = device.reducedMotion;
  const particles = budget(device.tier, 900, 450, 260);

  useEffect(() => {
    // graceful degradation flag for CSS
    try {
      const c = document.createElement("canvas");
      const ok = !!(c.getContext("webgl2") || c.getContext("webgl"));
      document.documentElement.classList.toggle("no-webgl", !ok);
    } catch { document.documentElement.classList.add("no-webgl"); }
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <Canvas
        dpr={device.dpr}
        camera={{ fov: 32, near: 0.1, far: 60, position: [0, 0, 9] }}
        gl={{ antialias: device.tier !== "low", alpha: false, powerPreference: "high-performance", stencil: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(LIGHT_BG, 1);
          gl.toneMapping = THREE.NoToneMapping;
        }}
        frameloop="always"
        eventSource={undefined}
      >
        <VisibilityGuard />
        <Environment reduced={reduced} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 4, 6]} intensity={1.4} />
        <directionalLight position={[-4, -2, 3]} intensity={0.35} color="#7cc7ff" />
        <Suspense fallback={null}>
          <AmbientField count={particles} reduced={reduced} dpr={device.dpr} />
          <HeroScene tier={device.tier} reduced={reduced} />
          <PositioningScene reduced={reduced} />
          <DataScene tier={device.tier} reduced={reduced} />
          <MacrovaScene tier={device.tier} reduced={reduced} />
          <DesignScene tier={device.tier} reduced={reduced} />
          <BrandScene tier={device.tier} reduced={reduced} />
        </Suspense>
      </Canvas>
    </div>
  );
}
