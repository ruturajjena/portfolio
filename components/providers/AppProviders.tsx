"use client";
import dynamic from "next/dynamic";
import { SmoothScroll } from "./SmoothScroll";
import { ThemeSync } from "./ThemeSync";
import { Nav } from "@/components/navigation/Nav";
import { Cursor } from "@/components/cursor/Cursor";

// The WebGL stage is client-only and heavy; never render it on the server.
const Stage = dynamic(() => import("@/components/three/Stage").then((m) => m.Stage), { ssr: false });

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[100] rounded bg-ink px-3 py-2 text-sm text-bg">
        Skip to content
      </a>
      <SmoothScroll />
      <ThemeSync />
      <Stage />
      <Nav />
      {children}
      <Cursor />
    </>
  );
}
