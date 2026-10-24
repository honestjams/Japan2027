"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useTrip } from "@/components/TripProvider";
import { Loading } from "@/components/Loading";
import { Button, Hanko, SectionLabel, spring } from "@/components/ui";
import type { PlanItem } from "@/lib/types";
import {
  dayNumber,
  shortDate,
  todayInJapan,
  vhsStamp,
  weekday,
} from "@/lib/dates";
import {
  bookedAhead,
  deadlineLabel,
  toBook,
  unbookedStays,
  urgency,
  type Urgency,
} from "@/lib/bookings";

const tone: Record<Urgency, { box: string; text: string }> = {
  overdue: { box: "bg-tape-red text-white", text: "text-tape-red" },
  soon: {
    box: "border-2 border-tape-red text-tape-red",
    text: "text-tape-red",
  },
  later: { box: "border-2 border-paper-edge text-ink", text: "text-ink-soft" },
  none: {
    box: "border-2 border-dashed border-paper-edge text-ink-soft",
    text: "text-ink-soft",
  },
};

export default function BookingsPage() {
  const { items, stays, loading, updateItem, updateStay, openStay } = useTrip();
  if (loading) return <Loading />;

  const today = todayInJapan();
  const pending = toBook(items);
  const done = bookedAhead(items);
  const looseStays = unbookedStays(stays);
  const urgent = pending.filter((i) =>
    ["overdue", "soon"].includes(urgency(i.book_by, today)),
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
    >
      <Link href="/prep" className="vhs-text text-lg uppercase text-ink-soft">
        ◀ Prep
      </Link>
      <h1 className="font-display text-4xl font-extrabold leading-tight">
        To book
      </h1>
      <p className="mt-1 text-ink-soft">
        {pending.length + looseStays.length === 0
          ? "Nothing left to book. Nice."
          : `${pending.length + looseStays.length} thing${pending.length + looseStays.length === 1 ? "" : "s"} still to book`}
        {urgent > 0 && (
          <span className="font-bold text-tape-red">
            {" "}
            · {urgent} due within 2 weeks
          </span>
        )}
      </p>

      <ul className="mt-6 space-y-4">
        <AnimatePresence initial={false}>
          {pending.map((i) => (
            <BookRow
              key={i.id}
              item={i}
              today={today}
              onBooked={() => updateItem(i.id, { status: "booked" })}
            />
          ))}
        </AnimatePresence>
      </ul>
      {pending.length === 0 && (
        <p className="paper-card mt-2 p-4 text-sm text-ink-soft">
          Nothing marked &ldquo;Book ahead&rdquo;. Switch it on in any ticket
          (it&apos;s on automatically for suggestions that need booking).
        </p>
      )}

      {looseStays.length > 0 && (
        <>
          <SectionLabel>Stays not booked yet</SectionLabel>
          <ul className="space-y-3">
            {looseStays.map((s) => (
              <li
                key={s.id}
                className="paper-card flex items-center gap-3 px-3 py-3"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-ink font-display text-xl text-washi">
                  宿
                </span>
                <button
                  onClick={() => openStay(s)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-display font-bold">{s.name}</p>
                  <p className="vhs-text text-sm uppercase text-ink-soft">
                    {weekday(s.check_in)} {shortDate(s.check_in)} →{" "}
                    {shortDate(s.check_out)}
                  </p>
                </button>
                <Button
                  className="shrink-0 px-3 text-sm"
                  onClick={() => updateStay(s.id, { status: "booked" })}
                >
                  Mark booked
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}

      {done.length > 0 && (
        <details className="mt-8">
          <summary className="vhs-text cursor-pointer text-lg uppercase text-ink-soft">
            ✓ Booked · {done.length}
          </summary>
          <ul className="mt-3 space-y-2">
            {done.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="truncate">
                  <span className="text-[var(--cat-cars)]">✓</span> {i.title}
                </span>
                <button
                  onClick={() => updateItem(i.id, { status: "planned" })}
                  className="min-h-11 shrink-0 text-ink-soft underline"
                >
                  Undo
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </motion.div>
  );
}

function BookRow({
  item,
  today,
  onBooked,
}: {
  item: PlanItem;
  today: string;
  onBooked: () => void;
}) {
  const { openItem, days } = useTrip();
  const u = urgency(item.book_by, today);
  const city = days.find((d) => d.date === item.date)?.city ?? item.city;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={spring}
      className="paper-card flex gap-3 p-3"
    >
      {/* Deadline stub: red when it's close or gone. */}
      <div
        className={`flex w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-md px-1 py-2 text-center ${tone[u].box}`}
      >
        {item.book_by ? (
          <>
            <span className="vhs-text text-sm uppercase leading-none">
              Book by
            </span>
            <span className="font-display text-lg font-bold leading-tight">
              {shortDate(item.book_by)}
            </span>
          </>
        ) : (
          <span className="vhs-text text-sm uppercase leading-tight">
            No date
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <button
          onClick={() => openItem(item)}
          className="flex w-full items-start gap-2 text-left"
        >
          <Hanko category={item.category} size={24} />
          <span className="font-display font-bold leading-snug">
            {item.title}
          </span>
        </button>
        <p className="vhs-text mt-1 text-sm uppercase text-ink-soft">
          {item.date
            ? `Day ${dayNumber(item.date)} · ${weekday(item.date)} ${shortDate(item.date)}${city ? ` · ${city}` : ""}`
            : "No day yet"}
        </p>
        {item.book_by && (
          <p className={`text-sm font-bold ${tone[u].text}`}>
            {deadlineLabel(item.book_by, today)} · {vhsStamp(item.book_by)}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button variant="ink" className="px-3 text-sm" onClick={onBooked}>
            ✓ Mark booked
          </Button>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center px-2 text-sm underline"
            >
              Booking site ↗
            </a>
          )}
        </div>
      </div>
    </motion.li>
  );
}
