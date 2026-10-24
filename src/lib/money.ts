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

/** How a price is split between us. */
export interface Split {
  cost_mode: "each" | "shared";
  pays_josh: boolean;
  pays_sam: boolean;
}

export const payersOf = (s: Split): Traveller[] =>
  [s.pays_josh && ("josh" as const), s.pays_sam && ("sam" as const)].filter(
    (t): t is Traveller => !!t,
  );

/**
 * What one person owes for a priced thing, in yen: the full per-person
 * price for 'each', an equal slice of the total for 'shared', 0 if they're
 * not in on it.
 */
export function sharesOf(
  p: Priced & Split,
  jpyPerAud: number,
): Record<Traveller, number> {
  const price = toJpy(p, jpyPerAud);
  const payers = payersOf(p);
  const each = p.cost_mode === "each" ? price : price / (payers.length || 1);
  return {
    josh: p.pays_josh ? each : 0,
    sam: p.pays_sam ? each : 0,
  };
}

/** Everything it costs us in yen (per-person price × number of people). */
export const totalOf = (p: Priced & Split, jpyPerAud: number) => {
  const s = sharesOf(p, jpyPerAud);
  return s.josh + s.sam;
};

/** "¥1,000 · ≈A$9.09 each", "… · Sam only", "… · Sam pays". */
export function costLabel(p: Priced & Split, jpyPerAud: number) {
  const base = priceLabel(p, jpyPerAud);
  if (!base) return null;
  const payers = payersOf(p);
  const solo =
    payers.length === 1 ? (payers[0] === "josh" ? "Josh" : "Sam") : null;
  if (p.cost_mode === "each")
    return solo ? `${base} · ${solo} only` : `${base} each`;
  return solo ? `${base} · ${solo} pays` : base;
}

/** One priced thing in the budget: a scheduled ticket or a stay. */
export interface BudgetLine {
  kind: "item" | "stay";
  id: string;
  title: string;
  /** Ticket date, or the stay's check-in. */
  date: string;
  /** Total in yen (A$ prices converted at today's rate); totals add these. */
  cost: number;
  /** The price as entered: per person for 'each', the whole bill for 'shared'. */
  unit: number;
  mode: "each" | "shared";
  /** What each person owes for this line, in yen. */
  shares: Record<Traveller, number>;
  currency: Currency;
  paid: boolean;
  paidBy: Traveller | null;
}

function lineOf(
  kind: "item" | "stay",
  id: string,
  title: string,
  date: string,
  p: Priced & Split & { paid: boolean; paid_by: Traveller | null },
  jpyPerAud: number,
): BudgetLine {
  const shares = sharesOf(p, jpyPerAud);
  return {
    kind,
    id,
    title,
    date,
    cost: shares.josh + shares.sam,
    unit: toJpy(p, jpyPerAud),
    mode: p.cost_mode,
    shares,
    currency: currencyOf(p),
    paid: p.paid,
    paidBy: p.paid_by,
  };
}

export function budgetLines(
  items: PlanItem[],
  stays: Stay[],
  jpyPerAud: number,
): BudgetLine[] {
  const lines: BudgetLine[] = [
    ...stays
      .filter(hasPrice)
      .map((s) => lineOf("stay", s.id, s.name, s.check_in, s, jpyPerAud)),
    ...items
      .filter((i) => i.date && hasPrice(i))
      .map((i) => lineOf("item", i.id, i.title, i.date!, i, jpyPerAud)),
  ];
  return lines.sort(
    (a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind),
  );
}

export interface BudgetSummary {
  total: number;
  paid: number;
  toPay: number;
  /** What each person owes across everything (not necessarily 50/50). */
  share: Record<Traveller, number>;
  paidBy: Record<Traveller, number>;
  /** Who owes whom for what's been paid so far; null when square. */
  settle: { from: Traveller; to: Traveller; amount: number } | null;
}

export function summarise(lines: BudgetLine[]): BudgetSummary {
  const sum = (ls: BudgetLine[], f: (l: BudgetLine) => number) =>
    ls.reduce((n, l) => n + f(l), 0);
  const total = sum(lines, (l) => l.cost);
  const paidLines = lines.filter((l) => l.paid);
  const paid = sum(paidLines, (l) => l.cost);
  // Only payments with a known payer can create a debt.
  const attributed = paidLines.filter((l) => l.paidBy);
  const paidBy = {
    josh: sum(
      attributed.filter((l) => l.paidBy === "josh"),
      (l) => l.cost,
    ),
    sam: sum(
      attributed.filter((l) => l.paidBy === "sam"),
      (l) => l.cost,
    ),
  };
  // Josh's balance: what he paid minus his share of those same things.
  // > 0 means Sam owes Josh.
  const joshBalance = paidBy.josh - sum(attributed, (l) => l.shares.josh);
  const amount = Math.round(Math.abs(joshBalance));
  return {
    total,
    paid,
    toPay: total - paid,
    share: {
      josh: sum(lines, (l) => l.shares.josh),
      sam: sum(lines, (l) => l.shares.sam),
    },
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
