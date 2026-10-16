"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTrip } from "@/components/TripProvider";
import { DayBlock } from "@/components/DayBlock";
import { Loading } from "@/components/Loading";
import { Button, spring } from "@/components/ui";
import { TRIP_DATES, shortDate, todayInJapan } from "@/lib/dates";

const SPANS = [3, 5, 7] as const;

const cols = {
  3: "md:grid-cols-3",
  5: "md:grid-cols-3 lg:grid-cols-5",
  7: "md:grid-cols-4 xl:grid-cols-7",
};

export default function SpanView() {
  const { n } = useParams<{ n: string }>();
  const span = (SPANS as readonly number[]).includes(Number(n))
    ? (Number(n) as (typeof SPANS)[number])
    : 3;
  const { days, loading } = useTrip();

  const todayIdx = TRIP_DATES.indexOf(todayInJapan());
  const [wanted, setStart] = useState(Math.max(todayIdx, 0));
  const [dir, setDir] = useState(1);
  const maxStart = TRIP_DATES.length - span;
  // Keep the window inside the trip when switching to a wider span.
  const start = Math.min(wanted, maxStart);

  if (loading) return <Loading />;

  const visible = days.slice(start, start + span);
  const step = (d: number) => {
    setDir(d);
    setStart(Math.min(Math.max(start + d * span, 0), maxStart));
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="paper-card flex p-1">
          {SPANS.map((s) => (
            <Link
              key={s}
              href={`/view/${s}`}
              className="relative flex h-10 w-16 items-center justify-center"
            >
              {s === span && (
                <motion.span
                  layoutId="span-pill"
                  transition={spring}
                  className="absolute inset-0 rounded bg-ink"
                />
              )}
              <span
                className={`vhs-text relative text-xl ${s === span ? "text-washi" : "text-ink-soft"}`}
              >
                {s} DAY
              </span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            aria-label="Earlier days"
            onClick={() => step(-1)}
            disabled={start === 0}
            className="vhs-text w-12 text-xl"
          >
            ◀◀
          </Button>
          <Button
            aria-label="Later days"
            onClick={() => step(1)}
            disabled={start >= maxStart}
            className="vhs-text w-12 text-xl"
          >
            ▶▶
          </Button>
        </div>
      </div>

      {visible.length > 0 && (
        <p className="vhs-text mt-4 text-lg uppercase text-ink-soft">
          {shortDate(visible[0].date)} – {shortDate(visible.at(-1)!.date)}
        </p>
      )}

      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div
          key={`${span}-${start}`}
          custom={dir}
          initial={{ opacity: 0, x: dir * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -40 }}
          transition={spring}
          className={`mt-6 grid gap-10 md:gap-6 ${cols[span]}`}
        >
          {visible.map((d) => (
            <DayBlock key={d.date} day={d} compact={span === 7} />
          ))}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
