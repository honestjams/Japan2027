/**
 * Rough door-to-door travel estimates between pins, with no network calls so
 * they work offline in Japan. Each leg also links to Google Maps for the
 * exact route and live times.
 */

export type TravelMode = "walk" | "train" | "drive";

export interface Stop {
  id: string;
  title: string;
  lat: number | null;
  lng: number | null;
}

export interface Leg {
  from: Stop;
  to: Stop;
  mode: TravelMode;
  km: number;
  minutes: number;
}

export const MODE = {
  walk: { kanji: "歩", label: "walk", gmaps: "walking" },
  train: { kanji: "電", label: "by train", gmaps: "transit" },
  drive: { kanji: "車", label: "drive", gmaps: "driving" },
} as const;

/** Straight-line distance in km. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Short hops are walked; anything longer goes by train (or car on drive days). */
export const WALK_LIMIT_KM = 1.5;

const round5 = (m: number) => Math.max(5, Math.round(m / 5) * 5);

/**
 * Minutes for a straight-line distance. Streets wind, so real distance is
 * roughly 1.3× the straight line. Train times include walking to and from
 * stations and waiting; longer trips get faster lines, then the Shinkansen.
 */
export function estimate(
  km: number,
  drive: boolean,
): { mode: TravelMode; minutes: number } {
  if (km <= WALK_LIMIT_KM)
    return { mode: "walk", minutes: round5(((km * 1.3) / 4.5) * 60) };
  if (drive) {
    const road = km * 1.3;
    // City streets, then mixed roads, then mostly expressway.
    const speed = road <= 10 ? 25 : road <= 60 ? 45 : 70;
    return { mode: "drive", minutes: round5((road / speed) * 60) };
  }
  let minutes: number;
  if (km <= 15)
    minutes = 12 + (km / 28) * 60; // metro / JR loop
  else if (km <= 100)
    minutes = 15 + (km / 50) * 60; // rapid / limited express
  else minutes = 30 + (km / 170) * 60; // Shinkansen
  return { mode: "train", minutes: round5(minutes) };
}

/** Legs between consecutive stops that both have a pin. */
export function legsFor(stops: Stop[], drive: boolean): (Leg | null)[] {
  return stops.slice(1).map((to, i) => {
    const from = stops[i];
    if (
      from.lat == null ||
      from.lng == null ||
      to.lat == null ||
      to.lng == null
    )
      return null;
    const km = haversineKm(
      { lat: from.lat, lng: from.lng },
      { lat: to.lat, lng: to.lng },
    );
    // Same place (e.g. two things in one building): no travel to show.
    if (km < 0.05) return null;
    return { from, to, km, ...estimate(km, drive) };
  });
}

export function formatMinutes(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export const formatKm = (km: number) =>
  km < 1
    ? `${Math.round(km * 1000)} m`
    : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;

/** Google Maps directions for the leg, in the matching travel mode. */
export const directionsLink = (leg: Leg) =>
  `https://www.google.com/maps/dir/?api=1&origin=${leg.from.lat},${leg.from.lng}&destination=${leg.to.lat},${leg.to.lng}&travelmode=${MODE[leg.mode].gmaps}`;
