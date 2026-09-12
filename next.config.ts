import type { NextConfig } from "next";

/**
 * GitHub Pages serves plain files, so the site is exported statically.
 * On a project page the site lives under /<repo>, which `basePath` handles for
 * routes and next/image. Raw paths handed to <video>, CSS masks or Three.js are
 * prefixed explicitly through `asset()` in lib/asset.ts.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
