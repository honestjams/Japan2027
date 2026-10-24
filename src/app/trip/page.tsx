"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTrip } from "@/components/TripProvider";
import { Loading } from "@/components/Loading";
import { MapView, stayPoints, toPoints } from "@/components/MapView";
import { StayCard } from "@/components/StayCard";
import { Button, SectionLabel, Tape, spring } from "@/components/ui";
import { CATEGORIES, type TripDay } from "@/lib/types";
import {
  TRIP_DATES,
  TRIP_END,
  TRIP_START,
  dayNumber,
  pad2,
  shortDate,
  todayInJapan,
  vhsStamp,
  weekday,
} from "@/lib/dates";
import { tilt } from "@/lib/places";
import { aud, budgetLines, summarise } from "@/lib/money";
import { useAudRate } from "@/lib/useAudRate";
import { sortStays, stayForNight, unbookedNights } from "@/lib/stays";

/** Consecutive days in the same city collapse into one leg of the route. */
function legs(days: TripDay[]) {
  const out: { city: string; from: string; nights: number }[] = [];
  for (const d of days) {
    const last = out.at(-1);
    if (last && last.city === d.city) last.nights++;
    else out.push({ city: d.city, from: d.date, nights: 1 });
  }
  return out;
}

export default function TripPage() {
  const { days, items, stays, loading, openStay } = useTrip();
  const rate = useAudRate();
  if (loading) return <Loading />;

  const scheduled = items.filter((i) => i.date);
  const count = (s: string) => items.filter((i) => i.status === s).length;
  const budget = summarise(budgetLines(items, stays, rate.jpyPerAud)).total;
  const gaps = unbookedNights(stays);
  const mapPoints = [...stayPoints(stays), ...toPoints(scheduled)];
  const today = todayInJapan();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
    >
      <p className="vhs-text text-lg uppercase text-ink-soft">
        {vhsStamp(TRIP_START).slice(0, 6)} → {vhsStamp(TRIP_END)} ·{" "}
        {TRIP_DATES.length} days
      </p>
      <h1 className="font-display text-4xl font-extrabold leading-tight">
        Tokyo → Osaka
      </h1>

      {/* Route ribbon: one tape segment per city stay. */}
      <div className="no-scrollbar -mx-4 mt-6 flex gap-1 overflow-x-auto px-4 pb-2">
        {legs(days).map((leg, i) => (
          <div
            key={leg.from}
            className="relative min-w-0 shrink-0 pr-3 pt-4"
            style={{
              flexGrow: leg.nights,
              width: 96 * Math.min(leg.nights, 2),
            }}
          >
            <span
              className="tape left-0 top-0 h-3 w-full"
              style={{
                background: i % 2 ? "var(--sakura)" : "var(--cat-drinks)",
              }}
            />
            <p className="truncate font-display font-bold leading-tight">
              {leg.city}
            </p>
            <p className="vhs-text text-base text-ink-soft">
              {leg.nights}D · {shortDate(leg.from)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2 text-center">
        {[
          ["Ideas", count("idea")],
          ["Planned", count("planned")],
          ["Booked", count("booked")],
        ].map(([label, value]) => (
          <div key={label} className="paper-card px-1 py-3">
            <p className="font-display text-xl font-extrabold leading-none">
              {value}
            </p>
            <p className="vhs-text mt-1 text-sm uppercase text-ink-soft">
              {label}
            </p>
          </div>
        ))}
        <motion.div whileTap={{ scale: 0.95 }} whileHover={{ y: -2 }}>
          <Link
            href="/budget"
            className="paper-card relative flex h-full flex-col items-center justify-center px-1 py-3"
            aria-label="Open budget"
          >
            <span
              aria-hidden
              className="tape -top-1.5 left-1/2 -translate-x-1/2"
              style={{ background: "var(--cat-cars)", width: 36 }}
            />
            <p className="font-display text-base font-extrabold leading-none">
              {budget ? aud(budget, rate.jpyPerAud) : "—"}
            </p>
            <p className="vhs-text mt-1 text-sm uppercase text-ink-soft">
              Budget ›
            </p>
          </Link>
        </motion.div>
      </div>

      <div className="flex items-end justify-between">
        <SectionLabel>Where we&apos;re staying</SectionLabel>
        <Button
          variant="ghost"
          className="mb-2"
          onClick={() =>
            openStay({
              check_in: gaps[0] ?? TRIP_START,
              city: days.find((d) => d.date === (gaps[0] ?? TRIP_START))?.city,
            })
          }
        >
          + Add stay
        </Button>
      </div>
      {stays.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {sortStays(stays).map((s) => (
            <StayCard key={s.id} stay={s} />
          ))}
        </div>
      )}
      {gaps.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-ink-soft">
            {gaps.length} night{gaps.length === 1 ? "" : "s"} without a bed yet.
            Tap one to add where you&apos;ll sleep:
          </p>
          <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
            {gaps.map((g) => (
              <motion.button
                key={g}
                whileTap={{ scale: 0.92 }}
                onClick={() =>
                  openStay({
                    check_in: g,
                    city: days.find((d) => d.date === g)?.city,
                  })
                }
                className="vhs-text shrink-0 rounded-full border border-dashed px-3 py-1.5 text-base uppercase"
                style={{ borderColor: "var(--cat-stay)" }}
              >
                {weekday(g)} {shortDate(g)}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <SectionLabel>Every day</SectionLabel>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {days.map((d, i) => {
          const dayItems = scheduled.filter((it) => it.date === d.date);
          return (
            <motion.div
              key={d.date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, rotate: tilt(d.date, 1.2) }}
              transition={{ ...spring, delay: i * 0.025 }}
              whileHover={{ y: -4, rotate: 0 }}
              whileTap={{ scale: 0.96 }}
            >
              <Link
                href={`/day/${d.date}`}
                className={`paper-card relative flex min-h-36 flex-col p-3 ${d.date === today ? "ring-2 ring-tape-red" : ""}`}
              >
                {d.is_drive_day && (
                  <Tape
                    color="var(--cat-drive)"
                    width={48}
                    className="-right-2 -top-1.5 rotate-6"
                  />
                )}
                <p className="vhs-text text-base uppercase text-ink-soft">
                  {pad2(dayNumber(d.date))} · {weekday(d.date)}
                </p>
                <p className="font-display text-lg font-bold leading-tight">
                  {shortDate(d.date)}
                </p>
                <p className="truncate text-sm">{d.city}</p>
                <StayLine date={d.date} />
                <div className="mt-auto flex flex-wrap gap-1 pt-3">
                  {dayItems.map((it) => (
                    <span
                      key={it.id}
                      title={it.title}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: CATEGORIES[it.category].color }}
                    />
                  ))}
                  {dayItems.length === 0 && (
                    <span className="text-xs italic text-ink-soft">blank</span>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <SectionLabel>On the map</SectionLabel>
      <MapView points={mapPoints} className="h-[420px]" />
      <p className="mt-2 text-sm text-ink-soft">
        {mapPoints.length === 0
          ? "Pins appear here once scheduled tickets and stays have a map location."
          : "Dark 宿 pins are where we sleep."}
      </p>
    </motion.div>
  );
}

/** Where we sleep that night, on a day tile. */
function StayLine({ date }: { date: string }) {
  const { stays } = useTrip();
  if (date === TRIP_END)
    return <p className="mt-1 text-xs text-ink-soft">✈ Flight home</p>;
  const stay = stayForNight(stays, date);
  return stay ? (
    <p className="mt-1 truncate text-xs">
      <span className="font-display">宿</span> {stay.name}
    </p>
  ) : (
    <p className="mt-1 text-xs text-tape-red">
      <span className="font-display">宿</span> no bed yet
    </p>
  );
}
