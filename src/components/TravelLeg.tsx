"use client";

import { motion } from "framer-motion";
import { useTrip } from "./TripProvider";
import {
  MODE,
  directionsLink,
  formatKm,
  formatMinutes,
  type Leg,
} from "@/lib/travel";

/** The dotted bit between two tickets: how we get from one to the next. Tap to edit. */
export function TravelLeg({
  leg,
  date,
  compact = false,
  label,
}: {
  leg: Leg;
  date: string;
  compact?: boolean;
  /** e.g. "from Tokyo Airbnb" for the first leg of the day. */
  label?: string;
}) {
  const { openLeg } = useTrip();
  const m = leg.mode ? MODE[leg.mode] : null;
  const empty = leg.minutes == null && !m;

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
      <button
        type="button"
        onClick={() => openLeg({ ...leg, date })}
        aria-label={`Edit travel to ${leg.to.title}`}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span
          className={`hanko flex h-6 w-6 shrink-0 items-center justify-center text-sm ${empty ? "border-dashed opacity-60" : ""}`}
          style={{ color: "var(--cat-drive)" }}
          aria-hidden
        >
          {m?.kanji ?? "＋"}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`vhs-text block uppercase text-ink-soft ${compact ? "text-sm" : "text-base"}`}
          >
            {empty ? (
              compact ? (
                "＋ travel"
              ) : (
                "＋ Add travel"
              )
            ) : (
              <>
                {leg.minutes != null &&
                  `${leg.edited ? "" : "~"}${formatMinutes(leg.minutes)} `}
                {!compact && m?.label}
                {!compact && leg.km != null && (
                  <span> · {formatKm(leg.km)}</span>
                )}
                {leg.edited && <span aria-label="set by us"> ✎</span>}
              </>
            )}
            {label && !compact && (
              <span className="normal-case"> · {label}</span>
            )}
          </span>
          {leg.note && !compact && (
            <span className="block truncate text-sm text-ink">{leg.note}</span>
          )}
        </span>
      </button>
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
