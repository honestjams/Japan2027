import type { PlanItem, Suggestion } from "./types";

type Place = Pick<PlanItem, "title" | "area" | "city" | "lat" | "lng">;

export function mapsLink(p: Place | Suggestion) {
  const q =
    p.lat != null && p.lng != null
      ? `${p.lat},${p.lng}`
      : [p.title, p.area, p.city, "Japan"].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Free OpenStreetMap geocoder; fine for the handful of lookups we make. */
export async function geocode(query: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp&q=${encodeURIComponent(query)}`,
    { headers: { "Accept-Language": "en" } },
  );
  if (!res.ok) return null;
  const [hit] = (await res.json()) as {
    lat: string;
    lon: string;
    display_name: string;
  }[];
  return hit
    ? { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name }
    : null;
}

export const yen = (n: number | null) =>
  n == null ? null : `¥${n.toLocaleString("en-GB")}`;

/** Stable small tilt per item so the cards look hand-placed, not random on every render. */
export function tilt(id: string, max = 0.8) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 1000) / 1000 - 0.5) * 2 * max;
}
