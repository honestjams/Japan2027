/**
 * Travel between the stops of a day. Each leg starts as a rough estimate
 * from the map pins (computed on the phone, so it works offline) and can be
 * overridden with our own mode, minutes and note. Every leg links to Google
 * Maps for the exact route and live times.
 */

export type TravelMode = "walk" | "train" | "bus" | "taxi" | "drive" | "ferry";

export interface Stop {
  /** Plan item id, or "stay-<id>" for a stay. */
  id: string;
  title: string;
  lat: number | null;
  lng: number | null;
  city?: string | null;
}

/** Our own details for a leg, keyed by the stop we're travelling to. */
export interface TravelOverride {
  date: string;
  /** A plan item's id, or "home" for the last leg back to tonight's stay. */
  to_key: string;
  mode: TravelMode | null;
  minutes: number | null;
  note: string | null;
}

export interface Leg {
  from: Stop;
  to: Stop;
  /** Key the leg is saved under (see TravelOverride.to_key). */
  toKey: string;
  /** Null when there's no estimate and nothing set yet. */
  mode: TravelMode | null;
  minutes: number | null;
  /** Straight-line distance, when both stops are pinned. */
  km: number | null;
  note: string | null;
  /** True when mode/minutes come from us rather than the estimate. */
  edited: boolean;
}

export const MODE: Record<
  TravelMode,
  { kanji: string; label: string; gmaps: string }
> = {
  walk: { kanji: "歩", label: "walk", gmaps: "walking" },
  train: { kanji: "電", label: "by train", gmaps: "transit" },
  bus: { kanji: "バ", label: "by bus", gmaps: "transit" },
  taxi: { kanji: "タ", label: "by taxi", gmaps: "driving" },
  drive: { kanji: "車", label: "drive", gmaps: "driving" },
  ferry: { kanji: "船", label: "by ferry", gmaps: "transit" },
};

export const MODE_KEYS = Object.keys(MODE) as TravelMode[];

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

const pinned = (s: Stop) => s.lat != null && s.lng != null;

/**
 * One leg per pair of consecutive stops; `toKeys[k]` is the key for the leg
 * arriving at stops[k + 1]. Our overrides win field by field, so setting
 * only a note (or only the mode) keeps the estimated minutes.
 */
export function legsFor(
  stops: Stop[],
  toKeys: string[],
  drive: boolean,
  overrides: TravelOverride[] = [],
  date?: string,
): (Leg | null)[] {
  return stops.slice(1).map((to, i) => {
    const from = stops[i];
    const toKey = toKeys[i];
    const o = overrides.find((x) => x.date === date && x.to_key === toKey);
    const km =
      pinned(from) && pinned(to)
        ? haversineKm(
            { lat: from.lat!, lng: from.lng! },
            { lat: to.lat!, lng: to.lng! },
          )
        : null;
    // Same place (two things in one building) and nothing set: no leg.
    if (km != null && km < 0.05 && !o) return null;
    const est = km != null ? estimate(km, drive) : null;
    return {
      from,
      to,
      toKey,
      mode: o?.mode ?? est?.mode ?? null,
      minutes: o?.minutes ?? est?.minutes ?? null,
      km,
      note: o?.note ?? null,
      edited: !!o && (o.mode != null || o.minutes != null),
    };
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

const place = (s: Stop) =>
  pinned(s)
    ? `${s.lat},${s.lng}`
    : encodeURIComponent([s.title, s.city, "Japan"].filter(Boolean).join(", "));

/** Google Maps directions for the leg, in the matching travel mode. */
export const directionsLink = (leg: Leg) =>
  `https://www.google.com/maps/dir/?api=1&origin=${place(leg.from)}&destination=${place(leg.to)}&travelmode=${MODE[leg.mode ?? "train"].gmaps}`;
