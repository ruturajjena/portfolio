"use client";
import { useEffect, useState } from "react";

export type Tier = "high" | "mid" | "low";

export type Device = {
  tier: Tier;
  isTouch: boolean;
  isMobile: boolean;
  reducedMotion: boolean;
  dpr: number;
};

const SERVER: Device = { tier: "mid", isTouch: false, isMobile: false, reducedMotion: false, dpr: 1 };

export function detectDevice(): Device {
  if (typeof window === "undefined") return SERVER;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const isMobile = window.innerWidth < 768;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  let tier: Tier = "high";
  if (isMobile || cores <= 4 || mem <= 4) tier = "mid";
  if ((isMobile && (cores <= 4 || mem <= 3)) || window.innerWidth < 420) tier = "low";
  const dpr = Math.min(window.devicePixelRatio || 1, tier === "high" ? 1.5 : tier === "mid" ? 1.25 : 1);
  return { tier, isTouch, isMobile, reducedMotion, dpr };
}

/** Snapshot of device capabilities; re-evaluated on resize and motion-preference change. */
export function useDevice(): Device {
  const [device, setDevice] = useState<Device>(SERVER);
  useEffect(() => {
    const update = () => setDevice(detectDevice());
    update();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    window.addEventListener("resize", update);
    mq.addEventListener("change", update);
    return () => {
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
    };
  }, []);
  return device;
}

export function useReducedMotion() {
  return useDevice().reducedMotion;
}

/** Scale a particle budget for the current tier. */
export const budget = (tier: Tier, high: number, mid = Math.round(high * 0.5), low = Math.round(high * 0.28)) =>
  tier === "high" ? high : tier === "mid" ? mid : low;
