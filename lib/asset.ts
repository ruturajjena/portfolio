/**
 * Prefixes a root-relative path with the deployment base path.
 *
 * Next rewrites routes and next/image sources itself, but anything handed to a
 * raw DOM attribute (<video src>), a CSS mask URL, or a Three.js loader bypasses
 * that — those paths must go through here or they 404 on a project page.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (path: string) => (path.startsWith("/") ? `${BASE}${path}` : path);
