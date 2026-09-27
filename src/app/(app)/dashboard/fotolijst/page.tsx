"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Copy, Plus, Printer, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Bar, EmptyState, PageHeader } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { haptic } from "@/lib/pwa/haptics";
import { useWedding } from "@/lib/store";
import type { Shot } from "@/lib/types";
import { cn, coupleName, formatDate, nowIso, uid } from "@/lib/utils";

const CATEGORIES = ["Voorbereiding", "First look", "Ceremonie", "Familie & groepen", "Bruidspaar", "Receptie & diner", "Feest", "Details"];

const TEMPLATE: [string, string][] = [
  ["Voorbereiding", "Jurk / pak aan de hanger"],
  ["Voorbereiding", "Ringen, schoenen en accessoires"],
  ["Voorbereiding", "Haar & make-up in actie"],
  ["Voorbereiding", "Knoopsgat / corsage opspelden"],
  ["First look", "De reactie bij de first look"],
  ["First look", "Eerste portret samen"],
  ["Ceremonie", "Binnenkomst van de bruid(egom)"],
  ["Ceremonie", "Reactie bij het zien van elkaar"],
  ["Ceremonie", "Het ja-woord"],
  ["Ceremonie", "Ringen omdoen"],
  ["Ceremonie", "De eerste kus"],
  ["Ceremonie", "Tekenen van de akte"],
  ["Ceremonie", "Uitloop met confetti / rijst"],
  ["Familie & groepen", "Bruidspaar met beide ouders"],
  ["Familie & groepen", "Bruidspaar met broers en zussen"],
  ["Familie & groepen", "Bruidspaar met grootouders"],
  ["Familie & groepen", "Bruidspaar met getuigen"],
  ["Familie & groepen", "Groepsfoto met alle gasten"],
  ["Bruidspaar", "Portretten bij de locatie"],
  ["Bruidspaar", "Zonsondergang / golden hour"],
  ["Receptie & diner", "Aansnijden van de taart"],
  ["Receptie & diner", "Toosts en speeches"],
  ["Receptie & diner", "Gedekte tafels vóór de gasten binnenkomen"],
  ["Feest", "Openingsdans"],
  ["Feest", "Volle dansvloer"],
  ["Details", "Bloemen en boeket"],
  ["Details", "Trouwkaart en drukwerk"],
  ["Details", "Aankleding van de locatie"],
];

export default function ShotListPage() {
  const { wedding, shots, add, update, remove } = useWedding();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  const grouped = useMemo(() => {
    const m = new Map<string, Shot[]>();
    for (const s of shots) m.set(s.category, [...(m.get(s.category) ?? []), s]);
    const order = [...CATEGORIES, ...[...m.keys()].filter((k) => !CATEGORIES.includes(k))];
    return order.filter((k) => m.has(k)).map((k) => [k, m.get(k)!] as const);
  }, [shots]);
  const done = shots.filter((s) => s.done).length;

  function addTemplate() {
    if (!wedding) return;
    const now = nowIso();
    const existing = new Set(shots.map((s) => s.title.toLowerCase()));
    const rows: Shot[] = TEMPLATE.filter(([, t]) => !existing.has(t.toLowerCase())).map(([c, t]) => ({
      id: uid(),
      wedding_id: wedding.id,
      created_at: now,
      title: t,
      category: c,
      notes: "",
      done: false,
    }));
    if (rows.length) add("shots", rows);
    toast.success(`${rows.length} foto's toegevoegd`);
  }

  function addOne(e: FormEvent) {
    e.preventDefault();
    if (!wedding || !title.trim()) return;
    add("shots", { id: uid(), wedding_id: wedding.id, created_at: nowIso(), title: title.trim().slice(0, 160), category, notes: "", done: false });
    setTitle("");
  }

  async function copyText() {
    const text = [
      `Fotolijst ${coupleName(wedding?.partner_one, wedding?.partner_two)}${wedding?.wedding_date ? ` – ${formatDate(wedding.wedding_date)}` : ""}`,
      "",
      ...grouped.flatMap(([cat, list]) => [`${cat}:`, ...list.map((s) => `• ${s.title}${s.notes ? ` (${s.notes})` : ""}`), ""]),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Lijst gekopieerd", "Plak hem in een mail of WhatsApp aan je fotograaf.");
    } catch {
      toast.error("Kopiëren lukte niet");
    }
  }

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          eyebrow="Voor jullie fotograaf"
          title="Fotolijst"
          description="Welke momenten en groepsfoto's mogen zeker niet ontbreken? Deel de lijst met je fotograaf en vink af op de dag zelf."
          actions={
            shots.length > 0 ? (
              <>
                <Button variant="secondary" onClick={copyText}>
                  <Copy className="size-4" aria-hidden /> Kopieer als tekst
                </Button>
                <Button variant="secondary" onClick={() => window.print()}>
                  <Printer className="size-4" aria-hidden /> Printen
                </Button>
              </>
            ) : undefined
          }
        />
      </div>
      <h1 className="mb-4 hidden font-serif text-3xl print:block">Fotolijst {coupleName(wedding?.partner_one, wedding?.partner_two)}</h1>

      {shots.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="Nog geen fotolijst"
          body="Begin met onze standaardlijst van de belangrijkste momenten en pas hem daarna aan."
          action={<Button onClick={addTemplate}>Standaardlijst toevoegen</Button>}
        />
      ) : (
        <>
          <div className="card mb-6 p-4 print:hidden">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-ink-700">Gefotografeerd</span>
              <span className="text-ink-500 tabular-nums">
                {done} / {shots.length}
              </span>
            </div>
            <Bar value={shots.length ? done / shots.length : 0} tone="sage" label="Voortgang fotolijst" />
            <form onSubmit={addOne} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <label htmlFor="shot-title" className="sr-only">
                Nieuwe foto
              </label>
              <input id="shot-title" className="field" placeholder="Bijv. Oma met alle kleinkinderen" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
              <label htmlFor="shot-cat" className="sr-only">
                Categorie
              </label>
              <select id="shot-cat" className="field sm:w-52" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <Button type="submit" disabled={!title.trim()}>
                <Plus className="size-4" aria-hidden /> Toevoegen
              </Button>
            </form>
          </div>
          <div className="space-y-6">
            {grouped.map(([cat, list]) => (
              <section key={cat} className="break-inside-avoid">
                <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold">
                  {cat} <span className="font-sans text-sm font-normal text-ink-500">{list.filter((s) => s.done).length}/{list.length}</span>
                </h2>
                <ul className="card divide-y divide-line overflow-hidden print:rounded-none print:border-0 print:shadow-none">
                  <AnimatePresence initial={false}>
                    {list.map((s) => (
                      <motion.li key={s.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="group flex items-center gap-2 px-3 py-1.5">
                        <button
                          onClick={() => {
                            haptic();
                            update("shots", s.id, { done: !s.done });
                          }}
                          role="checkbox"
                          aria-checked={s.done}
                          aria-label={s.title}
                          className="grid size-11 shrink-0 place-items-center"
                        >
                          <span className={cn("grid size-6 place-items-center rounded-md border-2 transition", s.done ? "border-sage-500 bg-sage-500 text-white" : "border-rose-200")}>
                            {s.done && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                          </span>
                        </button>
                        <span className={cn("min-w-0 flex-1", s.done && "text-ink-500 line-through decoration-rose-300")}>{s.title}</span>
                        <button
                          onClick={() => remove("shots", s.id)}
                          className="grid size-10 place-items-center rounded-full text-ink-500 opacity-100 hover:bg-rose-50 hover:text-rose-700 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 print:hidden"
                          aria-label={`${s.title} verwijderen`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
