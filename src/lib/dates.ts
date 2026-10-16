export const TRIP_START = "2027-03-29";
export const TRIP_END = "2027-04-11";

// Trip dates are plain calendar days, so all maths happens in UTC to avoid
// the viewer's timezone shifting a day either way.
const toUTC = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toISO = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(iso: string, n: number) {
  const d = toUTC(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

export function diffDays(a: string, b: string) {
  return Math.round((toUTC(b).getTime() - toUTC(a).getTime()) / 86_400_000);
}

export const TRIP_DATES: string[] = Array.from(
  { length: diffDays(TRIP_START, TRIP_END) + 1 },
  (_, i) => addDays(TRIP_START, i),
);

export const dayNumber = (iso: string) => diffDays(TRIP_START, iso) + 1;

/** "Today" is whatever day it is in Japan, since that's where the trip is. */
export function todayInJapan() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(
    new Date(),
  );
}

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts }).format(
    toUTC(iso),
  );

export const weekday = (iso: string) => fmt(iso, { weekday: "short" });
export const shortDate = (iso: string) =>
  fmt(iso, { day: "numeric", month: "short" });
export const longDate = (iso: string) =>
  fmt(iso, { weekday: "long", day: "numeric", month: "long" });

/** VHS camcorder style stamp, e.g. "29.MAR.2027". */
export function vhsStamp(iso: string) {
  const [y, , d] = iso.split("-");
  return `${d}.${fmt(iso, { month: "short" }).toUpperCase()}.${y}`;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

export const formatTime = (t: string | null) => (t ? t.slice(0, 5) : null);
