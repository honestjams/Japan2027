import type { PlanItem, Stay } from "./types";
import { diffDays } from "./dates";

export const isBooked = (i: Pick<PlanItem, "status">) =>
  i.status === "booked" || i.status === "done";

export type Urgency = "overdue" | "soon" | "later" | "none";

/** How pressing a book-by date is, relative to today (YYYY-MM-DD). */
export function urgency(bookBy: string | null, today: string): Urgency {
  if (!bookBy) return "none";
  const left = diffDays(today, bookBy);
  return left < 0 ? "overdue" : left <= 14 ? "soon" : "later";
}

export function deadlineLabel(bookBy: string | null, today: string) {
  if (!bookBy) return null;
  const left = diffDays(today, bookBy);
  if (left < 0) return `${-left} day${left === -1 ? "" : "s"} overdue`;
  if (left === 0) return "Today";
  if (left === 1) return "Tomorrow";
  return `in ${left} days`;
}

/** Tickets that still need booking: deadlines first (soonest), then by trip date. */
export function toBook(items: PlanItem[]) {
  return items
    .filter((i) => i.book_ahead && !isBooked(i))
    .sort(
      (a, b) =>
        (a.book_by ?? "9999").localeCompare(b.book_by ?? "9999") ||
        (a.date ?? "9999").localeCompare(b.date ?? "9999"),
    );
}

export const bookedAhead = (items: PlanItem[]) =>
  items
    .filter((i) => i.book_ahead && isBooked(i))
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));

export const unbookedStays = (stays: Stay[]) =>
  stays
    .filter((s) => s.status !== "booked")
    .sort((a, b) => a.check_in.localeCompare(b.check_in));

/** Suggestion tags that mean "you'll need to book this". */
export const needsBooking = (tags: string[]) =>
  tags.includes("booking") || tags.includes("must-book");
