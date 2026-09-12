/* eslint-disable react-hooks/immutability -- driving the DOM media element is the purpose of this hook */
"use client";
import { useEffect } from "react";
import { useMedia } from "@/lib/media-registry";
import { gsap } from "@/lib/gsap";
import { damp } from "@/lib/math";

type Options = {
  /** returns 0..1 */
  getProgress: () => number;
  /** returns true when the video is on screen and should be updated */
  isActive: () => boolean;
  /** if true, the video simply plays in a loop instead of being scrubbed */
  autoplay?: boolean;
  smoothing?: number;
};

/**
 * Scroll-scrubs a <video>. currentTime follows sectionProgress * duration
 * through an exponential damp so that discrete scroll events feel like a
 * continuous film. Seeks are throttled: a new seek is issued only when the
 * previous one has completed and the delta exceeds one frame.
 */
export function useVideoScrub(mediaKey: string, opts: Options) {
  const { getProgress, isActive, autoplay = false, smoothing = 9 } = opts;
  const video = useMedia(mediaKey);
  useEffect(() => {
    if (!video) return;

    if (autoplay) {
      video.loop = true;
      const tryPlay = () => video.play().catch(() => {});
      const onVisible = () => { if (isActive()) tryPlay(); else video.pause(); };
      const t = setInterval(onVisible, 500);
      tryPlay();
      return () => { clearInterval(t); video.pause(); };
    }

    // iOS needs one play() to unlock frame decoding for currentTime seeks.
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      const park = () => { video.pause(); video.currentTime = Math.max(0.001, getProgress() * (video.duration || 0)); };
      video.play().then(() => setTimeout(park, 120)).catch(() => { video.currentTime = 0.001; });
    };
    video.addEventListener("loadedmetadata", unlock, { once: true });
    if (video.readyState >= 1) unlock();

    let current = 0;
    let seeking = false;
    let lastSeekTs = 0;
    const onSeeked = () => { seeking = false; };
    video.addEventListener("seeked", onSeeked);

    const tick = (_t: number, dtMs: number) => {
      if (!video.duration || video.readyState < 2) return;
      const target = getProgress() * video.duration;
      if (!isActive()) {
        // Off-screen: park on the exact target frame so re-entry is never stale.
        if (!seeking && Math.abs(video.currentTime - target) > 0.25) { current = target; seeking = true; lastSeekTs = performance.now(); video.currentTime = target; }
        return;
      }
      const dt = Math.min(dtMs / 1000, 0.05);
      current = damp(current, target, smoothing, dt);
      // If the previous seek is stuck (some browsers skip 'seeked' when
      // seeking to the same frame), release after 250ms.
      if (seeking && performance.now() - lastSeekTs > 250) seeking = false;
      if (seeking) return;
      if (Math.abs(video.currentTime - current) > 1 / 60) {
        seeking = true;
        lastSeekTs = performance.now();
        video.currentTime = current;
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("loadedmetadata", unlock);
    };
  }, [video, getProgress, isActive, autoplay, smoothing]);
}
