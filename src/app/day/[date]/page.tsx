"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { itemsForDay, useTrip } from "@/components/TripProvider";
import { DayBlock } from "@/components/DayBlock";
import { Loading } from "@/components/Loading";
import { MapView, stayPoints, toPoints } from "@/components/MapView";
import { staysForDay } from "@/lib/stays";
import { spring } from "@/components/ui";
import { addDays, longDate, vhsStamp } from "@/lib/dates";

export default function DayPage() {
  const { date } = useParams<{ date: string }>();
  const { days, items, stays, loading } = useTrip();
  if (loading) return <Loading />;

  const day = days.find((d) => d.date === date);
  if (!day)
    return (
      <p className="vhs-text py-20 text-center text-2xl">
        NO SIGNAL — that day isn&apos;t part of the trip.
      </p>
    );

  const prev = days.find((d) => d.date === addDays(date, -1));
  const next = days.find((d) => d.date === addDays(date, 1));
  const points = [
    ...stayPoints(staysForDay(stays, date)),
    ...toPoints(itemsForDay(items, date)),
  ];

  return (
    <motion.div
      key={date}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
    >
      <div className="mb-6 flex items-center justify-between">
        <NavLink date={prev?.date} label="◀◀" />
        <div className="text-center">
          <p className="vhs-text text-lg text-tape-red">{vhsStamp(date)}</p>
          <p className="font-display text-lg font-bold">{longDate(date)}</p>
        </div>
        <NavLink date={next?.date} label="▶▶" />
      </div>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <DayBlock day={day} />
        <div className="space-y-4">
          <MapView points={points} className="h-80 md:h-[460px]" />
          {day.notes && (
            <div className="paper-card p-4">
              <p className="vhs-text text-base uppercase text-ink-soft">
                Notes
              </p>
              <p className="whitespace-pre-line">{day.notes}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function NavLink({ date, label }: { date?: string; label: string }) {
  if (!date) return <span className="w-12" />;
  return (
    <motion.div whileTap={{ scale: 0.88 }}>
      <Link
        href={`/day/${date}`}
        className="paper-card vhs-text flex h-11 w-12 items-center justify-center text-xl"
      >
        {label}
      </Link>
    </motion.div>
  );
}
