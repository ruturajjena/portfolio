# Ruturaj Jena — portfolio

**Live → https://ruturajjena.github.io/portfolio/**

A scroll-driven portfolio built as one continuous film: a keyed 3D portrait,
two cinematic plates scrubbed frame-by-frame by the scroll position, and a
live AWS pipeline diagram that moves real data between real service icons.

**Stack** — Next.js 16 (App Router, static export) · TypeScript · Tailwind v4 ·
Three.js / React Three Fiber · GSAP + ScrollTrigger · Lenis.

---

## Run it

```bash
npm install
npm run dev
```

Production build (static export into `out/`):

```bash
npm run build
```

The deployed site lives under `/portfolio`, so a local production preview needs
the same prefix:

```bash
NEXT_PUBLIC_BASE_PATH=/portfolio npm run build
```

## How it is put together

**One WebGL stage, many scenes.** A single `<Canvas>` is fixed behind the whole
page (`components/three/Stage.tsx`). Every section contributes a scene that
reads its own scroll progress and hides itself when off-screen, so there is
exactly one renderer and one frame loop for the entire site.

**Scroll is the projector.** Section progress is written into a plain mutable
store (`lib/scroll-store.ts`) by ScrollTrigger and read inside the frame loop.
Scroll position never enters React state, so scrolling causes no re-renders.

**Video as a material, not an element.** The three films are decoded into
`THREE.VideoTexture`s and composited by a shader: light plates multiply against
the page, dark plates feather into the environment colour. The `<video>` tags
stay in the DOM only as decode sources. They are re-encoded with a two-frame GOP
so `currentTime` seeks land on exact frames under a scrub.

**The pipeline diagram** (`components/data-engineering/Pipeline.tsx`) is SVG, not
WebGL: packets ride real path geometry via GSAP MotionPath, so the flow follows
the curves exactly and stays crisp at any zoom.

## Assets

Service marks are the official [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/);
other tool logos come from [Simple Icons](https://simpleicons.org). They are used
to identify the technologies behind the work.

## Accessibility

Semantic landmarks and headings, keyboard-reachable diagram nodes with visible
focus, a skip link, and alt text on every product screenshot. Under
`prefers-reduced-motion` the particles, packets, tilts and camera moves stop and
the films play normally instead of scrubbing.
