"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTrip } from "@/components/TripProvider";
import { Loading } from "@/components/Loading";
import { Chip, SectionLabel, spring } from "@/components/ui";
import { TRAVELLERS, type Traveller } from "@/lib/types";
import { dayNumber, shortDate, weekday } from "@/lib/dates";
import { yen } from "@/lib/places";
import { aud, budgetLines, summarise, type BudgetLine } from "@/lib/money";
import { useAudRate } from "@/lib/useAudRate";

type Filter = "all" | "unpaid" | "paid";

export default function BudgetPage() {
  const {
    items,
    stays,
    loading,
    me,
    updateItem,
    updateStay,
    openItem,
    openStay,
  } = useTrip();
  const rate = useAudRate();
  const [filter, setFilter] = useState<Filter>("all");
  if (loading) return <Loading />;

  const lines = budgetLines(items, stays);
  const sum = summarise(lines);
  const r = rate.jpyPerAud;
  const shown = lines.filter((l) =>
    filter === "all" ? true : filter === "paid" ? l.paid : !l.paid,
  );
  const unpriced = items.filter((i) => i.date && i.cost_jpy == null);
  const unpricedStays = stays.filter((s) => s.cost_jpy == null);
  const pct = sum.total ? Math.round((sum.paid / sum.total) * 100) : 0;

  const setPaid = (l: BudgetLine, paid: boolean, by?: Traveller | null) => {
    const patch = {
      paid,
      paid_by: paid ? (by !== undefined ? by : (me ?? null)) : null,
    };
    if (l.kind === "item") updateItem(l.id, patch);
    else updateStay(l.id, patch);
  };

  const open = (l: BudgetLine) => {
    if (l.kind === "item") {
      const it = items.find((i) => i.id === l.id);
      if (it) openItem(it);
    } else {
      const st = stays.find((s) => s.id === l.id);
      if (st) openStay(st);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
    >
      <p className="vhs-text text-lg uppercase text-ink-soft">
        A$1 = ¥{r.toFixed(2)}{" "}
        {rate.date ? `· ECB ${shortDate(rate.date)}` : "· approx, offline"}
      </p>
      <h1 className="font-display text-4xl font-extrabold leading-tight">
        Budget
      </h1>

      {/* Hero: the whole trip in both currencies. */}
      <div className="mt-4">
        <p className="font-display text-5xl font-extrabold leading-none tracking-tight">
          {aud(sum.total, r)}
        </p>
        <p className="mt-1 text-ink-soft">
          {yen(sum.total) ?? "¥0"} across {lines.length} priced thing
          {lines.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Paid meter: one series, so the label names it; no legend needed. */}
      <div className="mt-5">
        <div
          role="meter"
          aria-label="Paid so far"
          aria-valuemin={0}
          aria-valuemax={sum.total}
          aria-valuenow={sum.paid}
          className="h-3 overflow-hidden rounded-full bg-paper-edge"
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--cat-cars)" }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={spring}
          />
        </div>
        <p className="mt-1.5 text-sm text-ink-soft">
          <span className="font-bold text-ink">{pct}% paid</span> ·{" "}
          {aud(sum.paid, r)} paid, {aud(sum.toPay, r)} to go
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Tile label="Paid" jpy={sum.paid} r={r} />
        <Tile label="Still to pay" jpy={sum.toPay} r={r} />
        {(Object.keys(TRAVELLERS) as Traveller[]).map((t) => (
          <Tile
            key={t}
            label={`${TRAVELLERS[t].name}'s half`}
            jpy={sum.share}
            r={r}
            tape={TRAVELLERS[t].color}
            note={`has paid ${aud(sum.paidBy[t], r)}`}
          />
        ))}
      </div>

      <div className="paper-card mt-3 px-4 py-3 text-center">
        {sum.settle ? (
          <p className="font-display text-lg font-bold">
            {TRAVELLERS[sum.settle.from].name} owes{" "}
            {TRAVELLERS[sum.settle.to].name} {aud(sum.settle.amount, r)}
            <span className="block font-body text-sm font-normal text-ink-soft">
              {yen(sum.settle.amount)} · to even up what&apos;s been paid so far
            </span>
          </p>
        ) : (
          <p className="text-ink-soft">
            All square so far. Tick things off as they&apos;re paid.
          </p>
        )}
      </div>

      <div className="mt-8 flex items-end justify-between gap-2">
        <SectionLabel>Everything priced</SectionLabel>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(
          [
            ["all", "All"],
            ["unpaid", "To pay"],
            ["paid", "Paid"],
          ] as const
        ).map(([k, label]) => (
          <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>
            {label}
          </Chip>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {shown.map((l) => (
          <BudgetRow
            key={`${l.kind}-${l.id}`}
            line={l}
            r={r}
            onToggle={() => setPaid(l, !l.paid)}
            onPayer={(by) => setPaid(l, true, by)}
            onOpen={() => open(l)}
          />
        ))}
        {shown.length === 0 && (
          <li className="py-6 text-center text-sm text-ink-soft">
            {lines.length === 0
              ? "Nothing has a price yet. Add a cost to a ticket or stay and it shows up here."
              : "Nothing in this filter."}
          </li>
        )}
      </ul>

      {(unpriced.length > 0 || unpricedStays.length > 0) && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-ink-soft">
            {unpriced.length + unpricedStays.length} planned thing
            {unpriced.length + unpricedStays.length === 1 ? "" : "s"} without a
            price yet. Tap to add one.
          </summary>
          <ul className="mt-3 space-y-1">
            {unpricedStays.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => openStay(s)}
                  className="min-h-11 w-full text-left text-sm underline-offset-2 hover:underline"
                >
                  <span className="font-display">宿</span> {s.name}
                </button>
              </li>
            ))}
            {unpriced.map((i) => (
              <li key={i.id}>
                <button
                  onClick={() => openItem(i)}
                  className="min-h-11 w-full text-left text-sm underline-offset-2 hover:underline"
                >
                  <span className="vhs-text text-ink-soft">
                    D{dayNumber(i.date!)}
                  </span>{" "}
                  {i.title}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </motion.div>
  );
}

function Tile({
  label,
  jpy,
  r,
  tape,
  note,
}: {
  label: string;
  jpy: number;
  r: number;
  tape?: string;
  note?: string;
}) {
  return (
    <div className="paper-card relative px-3 py-3">
      {tape && (
        <span
          aria-hidden
          className="tape -top-1.5 left-3"
          style={{ background: tape, width: 40 }}
        />
      )}
      <p className="vhs-text text-sm uppercase text-ink-soft">{label}</p>
      <p className="font-display text-2xl font-extrabold leading-tight">
        {aud(jpy, r)}
      </p>
      <p className="text-xs text-ink-soft">
        {yen(Math.round(jpy))}
        {note && ` · ${note}`}
      </p>
    </div>
  );
}

function BudgetRow({
  line,
  r,
  onToggle,
  onPayer,
  onOpen,
}: {
  line: BudgetLine;
  r: number;
  onToggle: () => void;
  onPayer: (by: Traveller) => void;
  onOpen: () => void;
}) {
  return (
    <motion.li
      layout
      transition={spring}
      className={`paper-card flex items-center gap-3 px-3 py-2.5 ${line.paid ? "opacity-75" : ""}`}
    >
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onToggle}
        role="checkbox"
        aria-checked={line.paid}
        aria-label={`${line.title}: ${line.paid ? "paid" : "not paid"}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center"
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-md border-2 font-display text-sm font-bold ${line.paid ? "border-transparent text-white" : "border-paper-edge text-transparent"}`}
          style={line.paid ? { background: "var(--cat-cars)" } : undefined}
        >
          済
        </span>
      </motion.button>
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p
          className={`truncate font-display font-bold ${line.paid ? "line-through decoration-2" : ""}`}
        >
          {line.kind === "stay" && <span className="mr-1">宿</span>}
          {line.title}
        </p>
        <p className="vhs-text text-sm uppercase text-ink-soft">
          {weekday(line.date)} {shortDate(line.date)}
          {line.kind === "stay" && " · stay"}
        </p>
      </button>
      <div className="shrink-0 text-right">
        <p className="font-bold">{aud(line.cost, r)}</p>
        <p className="text-xs text-ink-soft">{yen(line.cost)}</p>
        {line.paid && (
          <button
            onClick={() => onPayer(line.paidBy === "josh" ? "sam" : "josh")}
            className="mt-0.5 rounded-full px-2 text-xs font-bold leading-5 text-[#2a2522]"
            style={{
              background: line.paidBy
                ? TRAVELLERS[line.paidBy].color
                : "var(--paper-edge)",
            }}
            title="Tap to change who paid"
          >
            {line.paidBy ? `${TRAVELLERS[line.paidBy].name} paid` : "Who paid?"}
          </button>
        )}
      </div>
    </motion.li>
  );
}
