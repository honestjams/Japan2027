"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTrip } from "@/components/TripProvider";
import { Loading } from "@/components/Loading";
import { MapView, toPoints } from "@/components/MapView";
import { SectionLabel, Tape, spring } from "@/components/ui";
import { CATEGORIES, type TripDay } from "@/lib/types";
import { dayNumber, pad2, shortDate, todayInJapan, weekday } from "@/lib/dates";
import { tilt, yen } from "@/lib/places";

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
  const { days, items, loading } = useTrip();
  if (loading) return <Loading />;

  const scheduled = items.filter((i) => i.date);
  const count = (s: string) => items.filter((i) => i.status === s).length;
  const budget = scheduled.reduce((n, i) => n + (i.cost_jpy ?? 0), 0);
  const today = todayInJapan();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
    >
      <p className="vhs-text text-lg uppercase text-ink-soft">
        29.MAR → 11.APR.2027 · 14 days
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
          ["Budget", budget ? yen(budget) : "—"],
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
      </div>

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
      <MapView points={toPoints(scheduled)} className="h-[420px]" />
      {toPoints(scheduled).length === 0 && (
        <p className="mt-2 text-sm text-ink-soft">
          Pins appear here once scheduled tickets have a map location.
        </p>
      )}
    </motion.div>
  );
}
