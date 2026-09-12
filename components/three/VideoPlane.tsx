"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { videoVertex, videoFragment } from "./shaders/video";
import { useMedia } from "@/lib/media-registry";
import { useVideoTexture } from "./useVideoTexture";
import { panelOffset } from "@/lib/math";

type Props = {
  mediaKey: string;
  /** distance behind the origin */
  z?: number;
  /** getter for 0..1 opacity, evaluated per frame */
  getOpacity: () => number;
  /** the footage's ambient white, sRGB 0..1 */
  white?: [number, number, number];
  contrast?: number;
  /** extra scale beyond "cover" */
  scale?: number;
  feather?: number;
  /** vertical bias in viewport heights (positive = show more of the top) */
  bias?: number;
  /** the footage is lit against black: composite normally instead of multiplying */
  dark?: boolean;
  /** view progress + section height (vh) so the plate travels with its sticky panel */
  getView?: () => number;
  sectionVh?: number;
};

/** Full-bleed, multiply-blended, edge-feathered plate that stays "cover"-fitted to the viewport. */
export function VideoPlane({ mediaKey, z = -1.6, getOpacity, white = [0.93, 0.905, 0.87], contrast = 1.06, scale = 1.04, feather = 0.12, bias = 0, dark = false, getView, sectionVh = 100 }: Props) {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera, viewport } = useThree();
  const video = useMedia(mediaKey);

  const texture = useVideoTexture(video);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: videoVertex,
        fragmentShader: videoFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: dark ? THREE.NormalBlending : THREE.MultiplyBlending,
        premultipliedAlpha: true,
        uniforms: {
          uMap: { value: null },
          uOpacity: { value: 0 },
          uWhite: { value: new THREE.Vector3(...white) },
          uContrast: { value: contrast },
          uFeather: { value: feather },
          uUvScale: { value: new THREE.Vector2(1, 1) },
          uUvOffset: { value: new THREE.Vector2(0, 0) },
          uDark: { value: dark ? 1 : 0 },
          uEnv: { value: new THREE.Color("#0b0b0c") },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dark],
  );

  useEffect(() => { material.uniforms.uMap.value = texture; }, [texture, material]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const op = getOpacity() * 0.9;
    m.visible = op > 0.005 && !!texture;
    material.uniforms.uOpacity.value = op;
    if (!m.visible) return;
    // cover-fit the 16:9 plate to the viewport at this depth
    const vp = viewport.getCurrentViewport(camera, [0, 0, z]);
    const aspect = 16 / 9;
    let w = vp.width * scale, h = w / aspect;
    if (h < vp.height * scale) { h = vp.height * scale; w = h * aspect; }
    m.scale.set(w, h, 1);
    const off = getView ? panelOffset(getView(), sectionVh) : 0;
    m.position.set(0, (bias - off) * vp.height, z);
    // keep UVs 1:1; cropping happens by scaling the plane beyond the viewport
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={-10} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
