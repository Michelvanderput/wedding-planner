import type { Assignee, Wedding } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

export function assigneeLabel(a: Assignee, w: Pick<Wedding, "partner_one" | "partner_two"> | null) {
  return {
    "": "Niet toegewezen",
    both: "Samen",
    partner_one: w?.partner_one || "Partner 1",
    partner_two: w?.partner_two || "Partner 2",
    ceremoniemeester: "Ceremoniemeester",
  }[a];
}

export function assigneeOptions(w: Pick<Wedding, "partner_one" | "partner_two"> | null) {
  return (["", "both", "partner_one", "partner_two", "ceremoniemeester"] as Assignee[]).map((a) => ({ value: a, label: assigneeLabel(a, w) }));
}

const TONE: Record<Exclude<Assignee, "">, string> = {
  both: "bg-sage-100 text-sage-700",
  partner_one: "bg-rose-100 text-rose-700",
  partner_two: "bg-gold-100 text-gold-700",
  ceremoniemeester: "bg-ivory-deep text-ink-700",
};

/** Klein rondje met initialen van wie de taak oppakt. */
export function AssigneeBadge({ a, wedding, className }: { a: Assignee; wedding: Pick<Wedding, "partner_one" | "partner_two"> | null; className?: string }) {
  if (!a) return null;
  const label = assigneeLabel(a, wedding);
  const text = a === "both" ? "♥" : a === "ceremoniemeester" ? "CM" : initials(label).slice(0, 2);
  return (
    <span
      className={cn("inline-grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold", TONE[a], className)}
      title={`Wie: ${label}`}
      aria-label={`Wie: ${label}`}
      role="img"
    >
      {text}
    </span>
  );
}
