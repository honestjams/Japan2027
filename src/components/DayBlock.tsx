"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { itemsForDay, useTrip } from "./TripProvider";
import { TicketCard } from "./TicketCard";
import { StayCard } from "./StayCard";
import { TravelLeg } from "./TravelLeg";
import { formatMinutes, legsFor, type Stop } from "@/lib/travel";
import { Tape } from "./ui";
import type { TripDay } from "@/lib/types";
import {
  TRIP_END,
  TRIP_START,
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

  // The day's route: wake up at last night's stay, visit each ticket in
  // order, end at tonight's stay. Legs only appear between pinned stops.
  const wokeAt =
    day.date !== TRIP_START
      ? stayForNight(stays, addDays(day.date, -1))
      : undefined;
  const asStop = (s: {
    id: string;
    name: string;
    lat: number | null;
    lng: number | null;
  }): Stop => ({
    id: `stay-${s.id}`,
    title: s.name,
    lat: s.lat,
    lng: s.lng,
  });
  const stops: Stop[] = [
    ...(wokeAt && list.length ? [asStop(wokeAt)] : []),
    ...list,
    ...(tonight && list.length ? [asStop(tonight)] : []),
  ];
  const legs = legsFor(stops, day.is_drive_day);
  const offset = wokeAt && list.length ? 1 : 0;
  // legs[k - 1] arrives at stops[k].
  const legInto = (i: number) => legs[i + offset - 1] ?? null;
  const legHome = tonight && list.length ? legs[legs.length - 1] : null;
  const travelMinutes = legs.reduce((n, l) => n + (l?.minutes ?? 0), 0);
  const unpinned = list.filter((i) => i.lat == null || i.lng == null).length;

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
          {list.flatMap((item, i) => {
            const leg = legInto(i);
            return [
              leg && (
                <TravelLeg
                  key={`leg-${item.id}`}
                  leg={leg}
                  compact={compact}
                  note={i === 0 ? `from ${leg.from.title}` : undefined}
                />
              ),
              <TicketCard key={item.id} item={item} compact={compact} />,
            ];
          })}
          {legHome && (
            <TravelLeg
              key="leg-home"
              leg={legHome}
              compact={compact}
              note={`back to ${legHome.to.title}`}
            />
          )}
        </AnimatePresence>
        {list.length > 0 && (travelMinutes > 0 || unpinned > 0) && !compact && (
          <p className="text-sm text-ink-soft">
            {travelMinutes > 0 && (
              <>
                <span className="font-bold text-ink">
                  ~{formatMinutes(travelMinutes)}
                </span>{" "}
                getting around today (estimate).{" "}
              </>
            )}
            {unpinned > 0 &&
              `${unpinned} stop${unpinned === 1 ? " has" : "s have"} no map pin, so ${unpinned === 1 ? "its" : "their"} travel isn't counted.`}
          </p>
        )}
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
