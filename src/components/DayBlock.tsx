"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { itemsForDay, useTrip } from "./TripProvider";
import { TicketCard } from "./TicketCard";
import { StayCard } from "./StayCard";
import { Tape } from "./ui";
import type { TripDay } from "@/lib/types";
import {
  TRIP_END,
  addDays,
  dayNumber,
  formatTime,
  pad2,
  shortDate,
  todayInJapan,
  weekday,
} from "@/lib/dates";
import { checkOutOn, stayForNight } from "@/lib/stays";

/** One day of the trip: header + its ticket stubs + an add button. */
export function DayBlock({
  day,
  compact = false,
}: {
  day: TripDay;
  compact?: boolean;
}) {
  const { items, stays, openItem, openDay, openStay } = useTrip();
  const list = itemsForDay(items, day.date);
  const tonight = stayForNight(stays, day.date);
  // Only call out a check-out when we're actually moving on (or flying home).
  const leaving = checkOutOn(stays, day.date);
  const showCheckOut = leaving && leaving.id !== tonight?.id;
  const isToday = todayInJapan() === day.date;

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-end justify-between gap-2 border-b border-dashed border-paper-edge pb-2">
        <Link href={`/day/${day.date}`} className="group min-w-0">
          <p className="vhs-text text-base uppercase text-ink-soft">
            Day {pad2(dayNumber(day.date))} · {weekday(day.date)}
            {isToday && <span className="text-tape-red"> ● TODAY</span>}
          </p>
          <h3 className="truncate font-display text-xl font-bold group-hover:underline">
            {shortDate(day.date)} · {day.city}
          </h3>
        </Link>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => openDay(day.date)}
          className="vhs-text min-h-11 shrink-0 px-1 text-base uppercase text-ink-soft"
          aria-label="Edit day"
        >
          Edit
        </motion.button>
      </div>

      {day.is_drive_day && (
        <div className="relative mb-4 mt-1 pl-1">
          <Tape color="var(--cat-drive)" width={92} className="-top-1 left-0" />
          <p className="vhs-text relative pl-2 text-base uppercase text-white">
            道 Drive day
          </p>
          {day.car && !compact && (
            <p className="mt-1 text-sm text-ink-soft">{day.car}</p>
          )}
        </div>
      )}

      {showCheckOut && (
        <p className="vhs-text mb-3 text-base uppercase text-ink-soft">
          <span className="font-display">宿</span> Check out of {leaving.name}
          {leaving.check_out_time &&
            ` by ${formatTime(leaving.check_out_time)}`}
        </p>
      )}

      <div className={compact ? "space-y-3" : "space-y-4"}>
        <AnimatePresence initial={false}>
          {list.map((item) => (
            <TicketCard key={item.id} item={item} compact={compact} />
          ))}
        </AnimatePresence>
        {list.length === 0 && (
          <p className="py-2 text-sm italic text-ink-soft">
            Blank tape. Nothing planned yet.
          </p>
        )}
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: -1 }}
          onClick={() =>
            openItem({ date: day.date, city: day.city, status: "planned" })
          }
          className="flex min-h-11 w-full items-center justify-center rounded-md border-2 border-dashed border-paper-edge text-sm text-ink-soft hover:border-sakura-deep hover:text-ink"
        >
          + Add to {compact ? "day" : `Day ${dayNumber(day.date)}`}
        </motion.button>
      </div>

      {day.date !== TRIP_END && (
        <div className="mt-5">
          {tonight ? (
            compact ? (
              <button
                onClick={() => openStay(tonight)}
                className="flex min-h-11 w-full items-center gap-2 rounded-md bg-ink px-3 text-left text-sm text-washi"
              >
                <span className="font-display">宿</span>
                <span className="truncate">{tonight.name}</span>
              </button>
            ) : (
              <StayCard stay={tonight} tonight={{ date: day.date }} />
            )
          ) : (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                openStay({
                  check_in: day.date,
                  check_out: addDays(day.date, 1),
                  city: day.city,
                })
              }
              className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md border-2 border-dashed text-sm text-ink-soft hover:text-ink"
              style={{ borderColor: "var(--cat-stay)" }}
            >
              <span className="font-display">宿</span>
              {compact ? "Where to sleep?" : "Where are we sleeping tonight?"}
            </motion.button>
          )}
        </div>
      )}
    </section>
  );
}
