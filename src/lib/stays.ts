import type { Stay } from "./types";
import { TRIP_DATES, diffDays } from "./dates";

/** The stay we sleep at on the night of `date`. */
export const stayForNight = (stays: Stay[], date: string) =>
  stays.find((s) => s.check_in <= date && date < s.check_out);

/** A stay we leave on the morning of `date` (only when moving somewhere else). */
export const checkOutOn = (stays: Stay[], date: string) =>
  stays.find((s) => s.check_out === date);

export const nights = (s: Pick<Stay, "check_in" | "check_out">) =>
  diffDays(s.check_in, s.check_out);

/** Trip nights with nowhere to sleep yet (the last day is the flight home). */
export const unbookedNights = (stays: Stay[]) =>
  TRIP_DATES.slice(0, -1).filter((d) => !stayForNight(stays, d));

export const sortStays = (stays: Stay[]) =>
  [...stays].sort((a, b) => a.check_in.localeCompare(b.check_in));

/** Stays that matter on a given day: the one we leave and the one we sleep at. */
export const staysForDay = (stays: Stay[], date: string) => {
  const list = [checkOutOn(stays, date), stayForNight(stays, date)].filter(
    (s): s is Stay => !!s,
  );
  return list.filter((s, i) => list.findIndex((x) => x.id === s.id) === i);
};
