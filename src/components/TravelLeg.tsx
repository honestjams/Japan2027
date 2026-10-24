"use client";

import { motion } from "framer-motion";
import {
  MODE,
  directionsLink,
  formatKm,
  formatMinutes,
  type Leg,
} from "@/lib/travel";

/** The dotted bit between two tickets: how we get from one to the next. */
export function TravelLeg({
  leg,
  compact = false,
  note,
}: {
  leg: Leg;
  compact?: boolean;
  /** e.g. "from Tokyo Airbnb" for the first leg of the day. */
  note?: string;
}) {
  const m = MODE[leg.mode];
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex items-center gap-2 ${compact ? "pl-4" : "pl-7"}`}
    >
      {/* Dotted travel line, like a route on a paper map. */}
      <span
        aria-hidden
        className={`self-stretch border-l-2 border-dotted border-ink-soft/50 ${compact ? "min-h-5" : "min-h-8"}`}
      />
      <span
        className="hanko flex h-6 w-6 shrink-0 items-center justify-center text-sm"
        style={{ color: "var(--cat-drive)" }}
        aria-hidden
      >
        {m.kanji}
      </span>
      <p
        className={`vhs-text min-w-0 flex-1 uppercase text-ink-soft ${compact ? "text-sm" : "text-base"}`}
      >
        ~{formatMinutes(leg.minutes)} {compact ? "" : m.label}
        {!compact && <span> · {formatKm(leg.km)}</span>}
        {note && !compact && <span className="normal-case"> · {note}</span>}
      </p>
      {!compact && (
        <a
          href={directionsLink(leg)}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 shrink-0 items-center px-1 text-sm underline"
          aria-label={`Directions from ${leg.from.title} to ${leg.to.title}`}
        >
          Directions ↗
        </a>
      )}
    </motion.div>
  );
}
