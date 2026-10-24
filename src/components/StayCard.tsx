"use client";

import { motion } from "framer-motion";
import { useTrip } from "./TripProvider";
import { Tape, spring } from "./ui";
import type { Stay } from "@/lib/types";
import { formatTime, shortDate, weekday } from "@/lib/dates";
import { mapsLink, tilt } from "@/lib/places";
import { costLabel, hasPrice } from "@/lib/money";
import { useAudRate } from "@/lib/useAudRate";
import { nights } from "@/lib/stays";

/** A stay as a hotel key-tag: dark tag with the room-key hole and 宿 stamp. */
export function StayCard({
  stay,
  tonight,
}: {
  stay: Stay;
  /** When shown on a day: is this the check-in night? */
  tonight?: { date: string };
}) {
  const { openStay } = useTrip();
  const rate = useAudRate().jpyPerAud;
  const n = nights(stay);
  const checkingIn = tonight && tonight.date === stay.check_in;
  const booked = stay.status === "booked";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, rotate: tilt(stay.id, 0.6) }}
      whileHover={{ y: -2, rotate: 0 }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className="relative"
    >
      <Tape
        color="var(--cat-stay)"
        width={54}
        className="-top-1.5 right-8 z-10 rotate-3"
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => openStay(stay)}
        onKeyDown={(e) => e.key === "Enter" && openStay(stay)}
        className="paper-card flex cursor-pointer items-stretch overflow-hidden"
      >
        <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-1.5 bg-ink py-3 text-washi">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full border-2 border-washi/70"
          />
          <span className="font-display text-2xl font-bold leading-none">
            宿
          </span>
        </div>
        <div className="min-w-0 flex-1 px-4 py-3">
          {tonight && (
            <p className="vhs-text text-base uppercase text-ink-soft">
              {checkingIn
                ? `Check in${stay.check_in_time ? ` from ${formatTime(stay.check_in_time)}` : ""}`
                : "Tonight"}
            </p>
          )}
          <p className="font-display text-lg font-bold leading-snug">
            {stay.name}
          </p>
          <p className="truncate text-sm text-ink-soft">
            {[stay.area, stay.city].filter(Boolean).join(" · ")}
            {!tonight &&
              ` · ${weekday(stay.check_in)} ${shortDate(stay.check_in)} → ${shortDate(stay.check_out)}`}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2 font-bold leading-5 ${booked ? "bg-[var(--cat-cars)] text-white" : "border border-paper-edge text-ink-soft"}`}
            >
              {booked ? "Booked" : "Considering"}
            </span>
            <span className="vhs-text text-sm uppercase text-ink-soft">
              {n} night{n === 1 ? "" : "s"}
              {hasPrice(stay) && ` · ${costLabel(stay, rate)}`}
            </span>
            {(stay.lat != null || stay.address) && (
              <a
                href={
                  stay.address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stay.address)}`
                    : mapsLink({ ...stay, title: stay.name })
                }
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="ml-auto underline"
              >
                Directions ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
