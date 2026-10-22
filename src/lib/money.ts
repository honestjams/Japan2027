import type { PlanItem, Stay, Traveller } from "./types";

/** One priced thing in the budget: a scheduled ticket or a stay. */
export interface BudgetLine {
  kind: "item" | "stay";
  id: string;
  title: string;
  /** Ticket date, or the stay's check-in. */
  date: string;
  cost: number;
  paid: boolean;
  paidBy: Traveller | null;
}

export function budgetLines(items: PlanItem[], stays: Stay[]): BudgetLine[] {
  const lines: BudgetLine[] = [
    ...stays
      .filter((s) => s.cost_jpy != null)
      .map((s) => ({
        kind: "stay" as const,
        id: s.id,
        title: s.name,
        date: s.check_in,
        cost: s.cost_jpy!,
        paid: s.paid,
        paidBy: s.paid_by,
      })),
    ...items
      .filter((i) => i.date && i.cost_jpy != null)
      .map((i) => ({
        kind: "item" as const,
        id: i.id,
        title: i.title,
        date: i.date!,
        cost: i.cost_jpy!,
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

export const aud = (jpy: number, jpyPerAud: number) => {
  const v = jpy / jpyPerAud;
  return `A$${v.toLocaleString("en-AU", {
    minimumFractionDigits: v < 100 ? 2 : 0,
    maximumFractionDigits: v < 100 ? 2 : 0,
  })}`;
};
