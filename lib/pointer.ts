/** Normalised pointer, -1..1 on both axes, plus a smoothed copy for parallax. */
export const pointer = {
  x: 0,
  y: 0,
  sx: 0,
  sy: 0,
  /** raw client coords */
  cx: -9999,
  cy: -9999,
  active: false,
};

let bound = false;
export function bindPointer() {
  if (bound || typeof window === "undefined") return;
  bound = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.cx = e.clientX;
      pointer.cy = e.clientY;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      pointer.active = true;
    },
    { passive: true },
  );
  window.addEventListener("pointerleave", () => { pointer.active = false; });
}
