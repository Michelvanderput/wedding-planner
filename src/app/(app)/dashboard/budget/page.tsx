"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CalendarClock, CheckCircle2, Circle, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { CountUp } from "@/components/dashboard/widgets";
import { Fab } from "@/components/ui/fab";
import { Button } from "@/components/ui/button";
import { Input, Select, Toggle } from "@/components/ui/field";
import { Badge, EmptyState, PageHeader, ProgressRing } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { BUDGET_CATEGORIES } from "@/lib/defaults";
import { useWedding } from "@/lib/store";
import type { BudgetItem } from "@/lib/types";
import { openPayments } from "@/lib/payments";
import { cn, daysUntil, formatDate, formatDateShort, formatEuro, nowIso, uid } from "@/lib/utils";

type Draft = Omit<BudgetItem, "id" | "wedding_id" | "created_at">;
const blank = (): Draft => ({ category: "Overig", name: "", estimated: 0, actual: 0, paid: false, vendor_id: null, due_date: null, deposit: 0, deposit_paid: false });

export default function BudgetPage() {
  const { wedding, budget_items, vendors, add, update, remove, updateWedding } = useWedding();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [draft, setDraft] = useState<Draft>(blank());
  const [totalOpen, setTotalOpen] = useState(false);
  const [total, setTotal] = useState(String(wedding?.budget_total ?? 0));

  const t = useMemo(() => {
    const estimated = budget_items.reduce((a, b) => a + b.estimated, 0);
    const actual = budget_items.reduce((a, b) => a + b.actual, 0);
    const paid = budget_items.filter((b) => b.paid).reduce((a, b) => a + (b.actual || b.estimated), 0);
    const cats = new Map<string, BudgetItem[]>();
    budget_items.forEach((b) => cats.set(b.category, [...(cats.get(b.category) ?? []), b]));
    const grouped = [...cats.entries()]
      .map(([cat, items]) => ({
        cat,
        items,
        est: items.reduce((a, b) => a + b.estimated, 0),
        act: items.reduce((a, b) => a + b.actual, 0),
      }))
      .sort((a, b) => b.est - a.est);
    return { estimated, actual, paid, grouped };
  }, [budget_items]);

  if (!wedding) return null;
  const budget = wedding.budget_total;
  const remaining = budget - t.actual;
  const overPlanned = t.estimated > budget;
  const maxCat = Math.max(1, ...t.grouped.map((g) => Math.max(g.est, g.act)));
  const payments = openPayments(budget_items);
  const overCats = t.grouped.filter((g) => g.est > 0 && g.act > g.est);

  function openNew(category?: string) {
    setEditing(null);
    setDraft({ ...blank(), category: category ?? "Overig" });
    setOpen(true);
  }
  function openEdit(b: BudgetItem) {
    setEditing(b);
    setDraft({ category: b.category, name: b.name, estimated: b.estimated, actual: b.actual, paid: b.paid, vendor_id: b.vendor_id, due_date: b.due_date, deposit: b.deposit, deposit_paid: b.deposit_paid });
    setOpen(true);
  }
  function save() {
    if (!draft.name.trim() || !wedding) return;
    const clean = { ...draft, estimated: Number(draft.estimated) || 0, actual: Number(draft.actual) || 0 };
    if (editing) update("budget_items", editing.id, clean);
    else add("budget_items", { ...clean, id: uid(), wedding_id: wedding.id, created_at: nowIso() });
    setOpen(false);
    toast.success(editing ? "Post bijgewerkt" : "Post toegevoegd");
  }

  const categories = [...new Set([...BUDGET_CATEGORIES, ...budget_items.map((b) => b.category)])];

  return (
    <>
      <PageHeader
        eyebrow="Zonder zorgen"
        title="Budget"
        description="Zie in één oogopslag wat gepland, besteed en betaald is."
        actions={
          <>
            <Button variant="secondary" onClick={() => { setTotal(String(budget)); setTotalOpen(true); }}>
              <Pencil className="size-4" aria-hidden /> Totaalbudget
            </Button>
            <Button onClick={() => openNew()} className="max-sm:hidden">
              <Plus className="size-4" aria-hidden /> Post
            </Button>
          </>
        }
      />

      {/* Samenvatting */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-wrap items-center justify-center gap-6 p-6 sm:justify-start">
          <ProgressRing value={budget ? t.actual / budget : 0} size={132} label={`${Math.round(budget ? (t.actual / budget) * 100 : 0)}% van het budget besteed`}>
            <div className="text-center">
              <div className="stat text-3xl">{Math.round(budget ? (t.actual / budget) * 100 : 0)}%</div>
              <div className="text-xs text-ink-500">besteed</div>
            </div>
          </ProgressRing>
          <div>
            <p className="text-sm text-ink-500">Nog te besteden</p>
            <p className={cn("stat text-4xl", remaining < 0 && "text-rose-700")}>
              <CountUp value={remaining} format={formatEuro} />
            </p>
            <p className="mt-1 text-sm text-ink-500">van {formatEuro(budget)}</p>
          </div>
        </motion.div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { l: "Gepland", v: t.estimated, s: overPlanned ? `${formatEuro(t.estimated - budget)} boven budget` : `${formatEuro(budget - t.estimated)} speelruimte`, warn: overPlanned },
            { l: "Besteed", v: t.actual, s: `${budget_items.filter((b) => b.actual > 0).length} posten` },
            { l: "Betaald", v: t.paid, s: `${budget_items.filter((b) => b.paid).length} van ${budget_items.length}` },
          ].map((c, i) => (
            <motion.div key={c.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * (i + 1) }} className="card p-5 last:col-span-2 sm:last:col-span-1">
              <p className="text-sm text-ink-500">{c.l}</p>
              <p className="stat text-3xl"><CountUp value={c.v} format={formatEuro} /></p>
              <p className={cn("mt-1 flex items-center gap-1 text-xs", c.warn ? "text-rose-700" : "text-ink-500")}>
                {c.warn && <AlertTriangle className="size-3.5" aria-hidden />} {c.s}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Aankomende betalingen + overschrijdingen */}
      {(payments.length > 0 || overCats.length > 0) && (
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {payments.length > 0 && (
            <section className="card p-6">
              <h2 className="flex items-center gap-2 text-2xl font-semibold">
                <CalendarClock className="size-5 text-rose-600" aria-hidden /> Nog te betalen
              </h2>
              <p className="text-sm text-ink-500">{formatEuro(payments.reduce((a, p) => a + p.amount, 0))} in totaal</p>
              <ul className="mt-4 divide-y divide-line">
                {payments.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.label}</p>
                      <p className={cn("text-sm", p.days !== null && p.days < 0 ? "font-medium text-rose-700" : "text-ink-500")}>
                        {p.date ? (p.days !== null && p.days < 0 ? `${-p.days} dagen te laat` : p.days === 0 ? "Vandaag" : `Vóór ${formatDate(p.date)}`) : "Geen datum"}
                      </p>
                    </div>
                    <span className="stat text-base">{formatEuro(p.amount)}</span>
                    <button
                      onClick={() => update("budget_items", p.itemId, p.kind === "deposit" ? { deposit_paid: true } : { paid: true })}
                      className="min-h-9 rounded-full border border-line bg-white px-3 text-xs font-medium text-ink-700 hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700"
                    >
                      Betaald
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {overCats.length > 0 && (
            <section className="card border-rose-200 p-6">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-rose-800">
                <AlertTriangle className="size-5" aria-hidden /> Boven budget
              </h2>
              <ul className="mt-4 space-y-2">
                {overCats.map((g) => (
                  <li key={g.cat} className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2 text-sm">
                    <span className="text-ink-900">{g.cat}</span>
                    <span className="stat text-rose-700">+{formatEuro(g.act - g.est)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-ink-500">Tip: schuif budget tussen categorieën door een geplande post te verlagen.</p>
            </section>
          )}
        </div>
      )}

      {/* Verdeling */}
      {t.grouped.length > 0 && (
        <section className="card mb-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Verdeling per categorie</h2>
            <div className="flex gap-4 text-xs text-ink-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-gold-200" aria-hidden /> Gepland</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-rose-500" aria-hidden /> Besteed</span>
            </div>
          </div>
          <ul className="mt-5 space-y-3.5">
            {t.grouped.map((g, i) => (
              <li key={g.cat} className="group grid grid-cols-1 items-center gap-2 sm:grid-cols-[180px_1fr_150px]">
                <span className="text-sm text-ink-700">{g.cat}</span>
                <div className="relative h-5" title={`${g.cat}: ${formatEuro(g.act)} besteed van ${formatEuro(g.est)} gepland`}>
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-r-md bg-gold-200"
                    initial={{ width: 0 }}
                    animate={{ width: `${(g.est / maxCat) * 100}%` }}
                    transition={{ delay: i * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <motion.div
                    className={cn("absolute inset-y-1 left-0 rounded-r-md", g.act > g.est ? "bg-rose-700" : "bg-rose-500")}
                    initial={{ width: 0 }}
                    animate={{ width: `${(g.act / maxCat) * 100}%` }}
                    transition={{ delay: 0.2 + i * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className="text-sm text-ink-500 tabular-nums sm:text-right">
                  {formatEuro(g.act)} <span className="text-ink-300">/</span> {formatEuro(g.est)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Posten */}
      {budget_items.length === 0 ? (
        <EmptyState icon={Wallet} title="Nog geen budgetposten" body="Voeg posten toe om je uitgaven bij te houden." action={<Button onClick={() => openNew()}>Eerste post</Button>} />
      ) : (
        <div className="space-y-6">
          {t.grouped.map((g) => (
            <section key={g.cat}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xl font-semibold">{g.cat}</h3>
                <button onClick={() => openNew(g.cat)} className="flex min-h-9 items-center gap-1 rounded-full px-3 text-sm text-rose-700 hover:bg-rose-50">
                  <Plus className="size-3.5" aria-hidden /> Post
                </button>
              </div>
              <ul className="card divide-y divide-line overflow-hidden">
                <AnimatePresence initial={false}>
                  {g.items.map((b) => {
                    const vendor = vendors.find((v) => v.id === b.vendor_id);
                    return (
                      <motion.li key={b.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 px-4 py-3">
                        <button
                          onClick={() => update("budget_items", b.id, { paid: !b.paid })}
                          className="grid size-10 shrink-0 place-items-center rounded-full"
                          role="checkbox"
                          aria-checked={b.paid}
                          aria-label={`${b.name} betaald`}
                          title={b.paid ? "Betaald" : "Nog niet betaald"}
                        >
                          {b.paid ? <CheckCircle2 className="size-6 text-sage-500" /> : <Circle className="size-6 text-ink-300" />}
                        </button>
                        <button onClick={() => openEdit(b)} className="min-w-0 flex-1 text-left">
                          <p className="truncate font-medium">{b.name}</p>
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-500">
                            <span>{vendor ? vendor.name : "Geen leverancier"}</span>
                            {b.paid ? (
                              <Badge tone="sage">Betaald</Badge>
                            ) : b.due_date ? (
                              <Badge tone={(daysUntil(b.due_date) ?? 99) < 0 ? "rose" : (daysUntil(b.due_date) ?? 99) <= 30 ? "gold" : "ink"}>
                                {(daysUntil(b.due_date) ?? 0) < 0 ? "Te laat · " : "Vóór "}
                                {formatDateShort(b.due_date)}
                              </Badge>
                            ) : null}
                            {b.deposit > 0 && !b.paid && <Badge tone={b.deposit_paid ? "sage" : "gold"}>Aanbetaling {formatEuro(b.deposit)}{b.deposit_paid ? " ✓" : ""}</Badge>}
                          </p>
                        </button>
                        <div className="text-right text-sm tabular-nums">
                          <p className={cn("font-medium", b.actual > b.estimated && b.estimated > 0 && "text-rose-700")}>{formatEuro(b.actual)}</p>
                          <p className="text-ink-500">van {formatEuro(b.estimated)}</p>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </section>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Post bewerken" : "Nieuwe post"}
        footer={
          <>
            {editing && (
              <Button variant="danger" className="mr-auto" onClick={() => { remove("budget_items", editing.id); setOpen(false); toast.info("Post verwijderd"); }}>
                <Trash2 className="size-4" aria-hidden /> Verwijderen
              </Button>
            )}
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuleren</Button>
            <Button onClick={save} disabled={!draft.name.trim()}>Opslaan</Button>
          </>
        }
      >
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Input className="sm:col-span-2" label="Omschrijving" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Select label="Categorie" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} options={categories.map((c) => ({ value: c, label: c }))} />
          <Select
            label="Leverancier"
            value={draft.vendor_id ?? ""}
            onChange={(e) => setDraft({ ...draft, vendor_id: e.target.value || null })}
            options={[{ value: "", label: "Geen" }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]}
          />
          <Input label="Gepland (€)" type="number" inputMode="decimal" min={0} step="1" value={draft.estimated || ""} onChange={(e) => setDraft({ ...draft, estimated: Number(e.target.value) })} />
          <Input label="Werkelijk (€)" type="number" inputMode="decimal" min={0} step="1" value={draft.actual || ""} onChange={(e) => setDraft({ ...draft, actual: Number(e.target.value) })} />
          <Input label="Betalen vóór" type="date" value={draft.due_date ?? ""} onChange={(e) => setDraft({ ...draft, due_date: e.target.value || null })} hint="Je krijgt een herinnering op het overzicht." />
          <Input label="Aanbetaling (€)" type="number" inputMode="decimal" min={0} step="1" value={draft.deposit || ""} onChange={(e) => setDraft({ ...draft, deposit: Number(e.target.value) })} />
          <div className="grid gap-1 sm:col-span-2 sm:grid-cols-2">
            <Toggle checked={draft.deposit_paid} onChange={(v) => setDraft({ ...draft, deposit_paid: v })} label="Aanbetaling voldaan" />
            <Toggle checked={draft.paid} onChange={(v) => setDraft({ ...draft, paid: v })} label="Volledig betaald" />
          </div>
          <button type="submit" hidden />
        </form>
      </Modal>

      <Modal
        open={totalOpen}
        onClose={() => setTotalOpen(false)}
        title="Totaalbudget"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTotalOpen(false)}>Annuleren</Button>
            <Button onClick={async () => { setTotalOpen(false); if (await updateWedding({ budget_total: Number(total) || 0 })) toast.success("Budget bijgewerkt"); }}>Opslaan</Button>
          </>
        }
      >
        <Input label="Totaalbudget (€)" type="number" inputMode="decimal" min={0} value={total} onChange={(e) => setTotal(e.target.value)} />
      </Modal>
      <Fab label="Nieuwe post" icon={Plus} onClick={() => openNew()} />
    </>
  );
}
