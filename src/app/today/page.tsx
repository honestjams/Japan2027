"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { itemsForDay, useTrip } from "@/components/TripProvider";
import { DayBlock } from "@/components/DayBlock";
import { Loading } from "@/components/Loading";
import { MapView, stayPoints, toPoints } from "@/components/MapView";
import { staysForDay } from "@/lib/stays";
import { toBook, unbookedStays } from "@/lib/bookings";
import { Petals } from "@/components/Petals";
import { SectionLabel, spring } from "@/components/ui";
import {
  TRIP_DATES,
  TRIP_END,
  TRIP_START,
  dayNumber,
  diffDays,
  longDate,
  pad2,
  shortDate,
  todayInJapan,
  vhsStamp,
} from "@/lib/dates";

export default function TodayPage() {
  const { days, items, stays, checklist, loading } = useTrip();
  const pendingBookings = toBook(items);
  const bookCount = pendingBookings.length + unbookedStays(stays).length;
  const nextBooking = pendingBookings.find((i) => i.book_by);
  if (loading) return <Loading />;

  const today = todayInJapan();
  const before = today < TRIP_START;
  const after = today > TRIP_END;
  // Before the trip, "today" previews Day 1 so there's always something to plan.
  const focusDate = before ? TRIP_START : after ? TRIP_END : today;
  const day = days.find((d) => d.date === focusDate);
  const dayItems = itemsForDay(items, focusDate);
  const dayPoints = [
    ...stayPoints(staysForDay(stays, focusDate)),
    ...toPoints(dayItems),
  ];
  const ideas = items.filter((i) => !i.date).length;
  const prepLeft = checklist.filter((c) => !c.done);
  const prepNext = prepLeft
    .filter((c) => c.due_by)
    .sort((a, b) => a.due_by!.localeCompare(b.due_by!))[0];

  return (
    <>
      <Petals />
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="scanlines relative -mx-4 mb-8 overflow-hidden border-b border-paper-edge px-4 pb-14 pt-6"
      >
        <div className="flex justify-between">
          <p className="vhs-text text-2xl text-tape-red">
            {after ? "■ STOP" : before ? "❚❚ PAUSE" : "▶ PLAY"}
          </p>
          <p className="vhs-text text-2xl">SP</p>
        </div>

        {before ? (
          <>
            <p className="mt-8 font-display text-[72px] font-extrabold leading-none tracking-tight">
              {diffDays(today, TRIP_START)}
            </p>
            <p className="mt-2 font-display text-2xl font-bold">
              sleeps until Tokyo.
            </p>
            <p className="mt-3 max-w-sm text-ink-soft">
              {items.filter((i) => i.date).length} tickets planned so far,{" "}
              {ideas} ideas waiting for a day.
            </p>
          </>
        ) : after ? (
          <>
            <p className="mt-8 font-display text-5xl font-extrabold leading-tight">
              That&apos;s a wrap.
            </p>
            <p className="mt-2 text-ink-soft">
              {items.filter((i) => i.status === "done").length} things done
              across {TRIP_DATES.length} days.
            </p>
          </>
        ) : (
          <>
            <p className="vhs-text mt-8 text-2xl uppercase text-ink-soft">
              Day {pad2(dayNumber(today))} of {TRIP_DATES.length}
            </p>
            <p className="font-display text-4xl font-extrabold leading-tight">
              {longDate(today)}
            </p>
            <p className="mt-1 text-lg">{day?.city}</p>
          </>
        )}

        <p className="vhs-text absolute bottom-3 right-4 text-xl">
          {vhsStamp(focusDate)}
        </p>
      </motion.section>

      {before && (
        <p className="vhs-text mb-4 text-lg uppercase text-ink-soft">
          ▶ Preview · Day 01
        </p>
      )}

      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {day && <DayBlock day={day} />}
        {dayPoints.length > 0 && (
          <div>
            <MapView points={dayPoints} className="h-80" />
          </div>
        )}
      </div>

      {before && prepLeft.length > 0 && (
        <>
          <SectionLabel>Before you go</SectionLabel>
          <Link
            href="/prep"
            className="paper-card block p-4 hover:-translate-y-0.5 transition-transform"
          >
            <p className="font-display text-lg font-bold">
              {prepLeft.length} thing{prepLeft.length === 1 ? "" : "s"} left to
              sort →
            </p>
            {prepNext && (
              <p className="text-sm text-ink-soft">
                Next: {prepNext.title}, by {shortDate(prepNext.due_by!)}
              </p>
            )}
          </Link>
        </>
      )}

      {before && bookCount > 0 && (
        <Link
          href="/bookings"
          className="paper-card mt-3 block border-l-4 border-tape-red p-4 transition-transform hover:-translate-y-0.5"
        >
          <p className="font-display text-lg font-bold">
            予 {bookCount} thing{bookCount === 1 ? "" : "s"} to book ahead →
          </p>
          {nextBooking?.book_by && (
            <p className="text-sm text-ink-soft">
              Next: {nextBooking.title}, by {shortDate(nextBooking.book_by)}
            </p>
          )}
        </Link>
      )}

      {ideas > 0 && (
        <>
          <SectionLabel>Loose ideas</SectionLabel>
          <Link
            href="/ideas?tab=ours"
            className="paper-card block p-4 hover:-translate-y-0.5 transition-transform"
          >
            <p className="font-display text-lg font-bold">
              {ideas} idea{ideas === 1 ? "" : "s"} without a day yet →
            </p>
            <p className="text-sm text-ink-soft">
              Give them a slot so they don&apos;t get forgotten.
            </p>
          </Link>
        </>
      )}
    </>
  );
}
