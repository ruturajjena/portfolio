"use client";
import { useSyncExternalStore } from "react";
/** DOM <video> elements live in their sections; the WebGL stage reads them from here. */
const media = new Map<string, HTMLVideoElement>();
const listeners = new Set<() => void>();
export function registerMedia(key: string, el: HTMLVideoElement | null) {
  if (el) media.set(key, el); else media.delete(key);
  listeners.forEach((l) => l());
}
export const getMedia = (key: string) => media.get(key) ?? null;
export function onMediaChange(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }

const subscribe = (cb: () => void) => onMediaChange(cb);
/** React binding: re-renders only when the requested element is (un)registered. */
export function useMedia(key: string) {
  return useSyncExternalStore(subscribe, () => getMedia(key), () => null);
}
