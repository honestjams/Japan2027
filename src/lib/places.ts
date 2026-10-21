import type { PlanItem, Suggestion } from "./types";

type Place = Pick<PlanItem, "title" | "area" | "city" | "lat" | "lng">;

export function mapsLink(p: Place | Suggestion) {
  const q =
    p.lat != null && p.lng != null
      ? `${p.lat},${p.lng}`
      : [p.title, p.area, p.city, "Japan"].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export { geocode } from "./geocode";

export const yen = (n: number | null) =>
  n == null ? null : `¥${n.toLocaleString("en-GB")}`;

/** Stable small tilt per item so the cards look hand-placed, not random on every render. */
export function tilt(id: string, max = 0.8) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 1000) / 1000 - 0.5) * 2 * max;
}
