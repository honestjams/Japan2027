import type { PlanItem, Stay, Traveller } from "./types";

export type Currency = "JPY" | "AUD";

/** Anything with a price: entered in yen or in Australian dollars, never both. */
export interface Priced {
  cost_jpy: number | null;
  cost_aud: number | null;
}

export const hasPrice = (p: Priced) => p.cost_jpy != null || p.cost_aud != null;

export const currencyOf = (p: Priced): Currency =>
  p.cost_aud != null ? "AUD" : "JPY";

/** The price in yen; A$ prices convert at today's rate (unrounded). */
export const toJpy = (p: Priced, jpyPerAud: number) =>
  p.cost_jpy != null
    ? Number(p.cost_jpy)
    : p.cost_aud != null
      ? Number(p.cost_aud) * jpyPerAud
      : 0;

/** "A$450 · ≈¥49,973" or "¥1,000 · ≈A$9.01": entered currency first, exact. */
export function priceLabel(p: Priced, jpyPerAud: number) {
  if (!hasPrice(p)) return null;
  const jpy = toJpy(p, jpyPerAud);
  return currencyOf(p) === "AUD"
    ? `${audAmount(Number(p.cost_aud))} · ≈${yenAmount(jpy)}`
    : `${yenAmount(jpy)} · ≈${aud(jpy, jpyPerAud)}`;
}

/** One priced thing in the budget: a scheduled ticket or a stay. */
export interface BudgetLine {
  kind: "item" | "stay";
  id: string;
  title: string;
  /** Ticket date, or the stay's check-in. */
  date: string;
  /** In yen (converted at today's rate for A$ prices); totals add these. */
  cost: number;
  currency: Currency;
  paid: boolean;
  paidBy: Traveller | null;
}

export function budgetLines(
  items: PlanItem[],
  stays: Stay[],
  jpyPerAud: number,
): BudgetLine[] {
  const lines: BudgetLine[] = [
    ...stays.filter(hasPrice).map((s) => ({
      kind: "stay" as const,
      id: s.id,
      title: s.name,
      date: s.check_in,
      cost: toJpy(s, jpyPerAud),
      currency: currencyOf(s),
      paid: s.paid,
      paidBy: s.paid_by,
    })),
    ...items
      .filter((i) => i.date && hasPrice(i))
      .map((i) => ({
        kind: "item" as const,
        id: i.id,
        title: i.title,
        date: i.date!,
        cost: toJpy(i, jpyPerAud),
        currency: currencyOf(i),
        paid: i.paid,
        paidBy: i.paid_by,
      })),
  ];
  return lines.sort(
    (a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind),
  );
}

export interface BudgetSummary {
  total: number;
  paid: number;
  toPay: number;
  /** Everything is split 50/50. */
  share: number;
  paidBy: Record<Traveller, number>;
  /** Who owes whom for what's been paid so far; null when square. */
  settle: { from: Traveller; to: Traveller; amount: number } | null;
}

export function summarise(lines: BudgetLine[]): BudgetSummary {
  const sum = (ls: BudgetLine[]) => ls.reduce((n, l) => n + l.cost, 0);
  const total = sum(lines);
  const paidLines = lines.filter((l) => l.paid);
  const paid = sum(paidLines);
  const paidBy = {
    josh: sum(paidLines.filter((l) => l.paidBy === "josh")),
    sam: sum(paidLines.filter((l) => l.paidBy === "sam")),
  };
  // Each person should have covered half of everything someone paid for.
  // Josh's balance > 0 means Sam owes Josh. Payments without a payer are
  // treated as already split and left out.
  const joshBalance = paidBy.josh - (paidBy.josh + paidBy.sam) / 2;
  const amount = Math.round(Math.abs(joshBalance));
  return {
    total,
    paid,
    toPay: total - paid,
    share: total / 2,
    paidBy,
    settle:
      amount === 0
        ? null
        : joshBalance > 0
          ? { from: "sam", to: "josh", amount }
          : { from: "josh", to: "sam", amount },
  };
}

/** Yen per Australian dollar if the live rate can't be fetched. */
export const FALLBACK_JPY_PER_AUD = 110;

export const audAmount = (v: number) =>
  `A$${v.toLocaleString("en-AU", {
    minimumFractionDigits: v < 100 ? 2 : 0,
    maximumFractionDigits: v < 100 ? 2 : 0,
  })}`;

export const yenAmount = (v: number) =>
  `¥${Math.round(v).toLocaleString("en-GB")}`;

/** Yen shown as Australian dollars at the given rate. */
export const aud = (jpy: number, jpyPerAud: number) =>
  audAmount(jpy / jpyPerAud);
