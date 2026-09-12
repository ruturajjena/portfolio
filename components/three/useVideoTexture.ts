"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * VideoTexture whose uploads are driven by requestVideoFrameCallback, so a
 * scroll-scrubbed (paused, constantly seeking) video still presents every new
 * frame. Three's built-in update only fires at readyState >= 2, which a seeking
 * video rarely holds. Falls back to per-frame flagging where rVFC is missing.
 */
export function useVideoTexture(video: HTMLVideoElement | null) {
  const texture = useMemo(() => {
    if (!video) return null;
    const t = new THREE.VideoTexture(video);
    t.colorSpace = THREE.NoColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.userData.frameReady = false;
    return t;
  }, [video]);

  useEffect(() => {
    if (!video || !texture) return;
    type RVFC = HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number; cancelVideoFrameCallback?: (h: number) => void };
    const v = video as RVFC;
    let handle = 0;
    let raf = 0;
    let alive = true;
    if (typeof v.requestVideoFrameCallback === "function") {
      const loop = () => { if (!alive) return; texture.needsUpdate = true; texture.userData.frameReady = true; handle = v.requestVideoFrameCallback!(loop); };
      handle = v.requestVideoFrameCallback(loop);
    }
    // Until the first presented frame arrives (a paused, never-played video may not
    // trigger rVFC), upload whenever decodable data exists.
    const seed = () => {
      if (!alive) return;
      if (!texture.userData.frameReady && v.videoWidth > 0 && v.readyState >= 2) { texture.needsUpdate = true; texture.userData.frameReady = true; }
      if (!texture.userData.frameReady || typeof v.requestVideoFrameCallback !== "function") {
        if (texture.userData.frameReady) texture.needsUpdate = true;
        raf = requestAnimationFrame(seed);
      }
    };
    raf = requestAnimationFrame(seed);
    return () => {
      alive = false;
      if (handle && v.cancelVideoFrameCallback) v.cancelVideoFrameCallback(handle);
      if (raf) cancelAnimationFrame(raf);
      texture.dispose();
    };
  }, [video, texture]);

  return texture;
}
