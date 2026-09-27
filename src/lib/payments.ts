import type { BudgetItem } from "./types";
import { daysUntil } from "./utils";

export interface Payment {
  id: string;
  itemId: string;
  label: string;
  amount: number;
  date: string | null;
  days: number | null;
  kind: "deposit" | "rest";
}

/** Openstaande betalingen (aanbetalingen en restbedragen), vroegste eerst. */
export function openPayments(items: BudgetItem[]): Payment[] {
  const out: Payment[] = [];
  for (const b of items) {
    const total = b.actual || b.estimated;
    if (b.deposit > 0 && !b.deposit_paid && !b.paid) {
      out.push({ id: `${b.id}-d`, itemId: b.id, label: `Aanbetaling ${b.name}`, amount: b.deposit, date: b.due_date, days: daysUntil(b.due_date), kind: "deposit" });
    }
    if (!b.paid && b.due_date) {
      const rest = Math.max(0, total - (b.deposit_paid ? b.deposit : 0));
      if (rest > 0) out.push({ id: `${b.id}-r`, itemId: b.id, label: b.deposit > 0 ? `Restbedrag ${b.name}` : b.name, amount: rest, date: b.due_date, days: daysUntil(b.due_date), kind: "rest" });
    }
  }
  return out.sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
}
