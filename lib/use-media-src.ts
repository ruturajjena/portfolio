"use client";
import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 767px)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getIsSmall = () => window.matchMedia(QUERY).matches;

/** Picks the small encode on narrow viewports. Returns null during SSR/hydration so no media is requested early. */
export function useMediaSrc(desktop: string, small: string): string | null {
  const isSmall = useSyncExternalStore(subscribe, getIsSmall, () => null);
  if (isSmall === null) return null;
  return isSmall ? small : desktop;
}
