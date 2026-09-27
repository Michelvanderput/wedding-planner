"use client";

import { LayoutGroup, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Copy, ExternalLink, Mail, Phone, Plus, Sparkles, Star, Store, Trash2, Wallet } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Badge, EmptyState, PageHeader } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { aiText, useAiEnabled } from "@/lib/ai";
import { BUDGET_CATEGORIES, VENDOR_CATEGORIES, VENDOR_STATUS } from "@/lib/defaults";
import { useWedding } from "@/lib/store";
import type { Vendor, VendorStatus } from "@/lib/types";
import { cn, coupleName, formatDate, formatEuro, nowIso, uid } from "@/lib/utils";

type Draft = Omit<Vendor, "id" | "wedding_id" | "created_at">;
const blank = (status: VendorStatus = "idea"): Draft => ({
  name: "",
  category: "Locatie",
  contact_name: "",
  email: "",
  phone: "",
  website: "",
  price: null,
  status,
  rating: null,
  notes: "",
});

const COLUMN_TONE: Record<VendorStatus, string> = {
  idea: "from-ink-300/20",
  contacted: "from-gold-200/60",
  quote: "from-rose-200/60",
  booked: "from-sage-200/80",
};

const BUDGET_FOR: Record<string, string> = {
  Locatie: "Locatie & catering",
  Catering: "Locatie & catering",
  Taart: "Locatie & catering",
  Fotograaf: "Fotografie & video",
  Videograaf: "Fotografie & video",
  Bloemist: "Bloemen & decoratie",
  "DJ / Band": "Muziek & entertainment",
  "Trouwjurk / pak": "Kleding & styling",
  "Haar & make-up": "Kleding & styling",
  Vervoer: "Vervoer",
  Drukwerk: "Drukwerk",
};

export default function VendorsPage() {
  const { wedding, vendors, budget_items, guests, add, update, remove } = useWedding();
  const toast = useToast();
  const ai = useAiEnabled();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [draft, setDraft] = useState<Draft>(blank());
  const [mailFor, setMailFor] = useState<Vendor | null>(null);
  const [wishes, setWishes] = useState("");
  const [mail, setMail] = useState("");
  const [mailLoading, setMailLoading] = useState(false);

  function openNew(status?: VendorStatus) {
    setEditing(null);
    setDraft(blank(status));
    setOpen(true);
  }
  function openEdit(v: Vendor) {
    setEditing(v);
    const { id: _i, wedding_id: _w, created_at: _c, ...rest } = v;
    setDraft(rest);
    setOpen(true);
  }
  function save() {
    if (!draft.name.trim() || !wedding) return;
    const clean = { ...draft, price: draft.price === null || Number.isNaN(draft.price) ? null : Number(draft.price) };
    if (editing) update("vendors", editing.id, clean);
    else add("vendors", { ...clean, id: uid(), wedding_id: wedding.id, created_at: nowIso() });
    setOpen(false);
    toast.success(editing ? "Leverancier bijgewerkt" : "Leverancier toegevoegd");
  }

  function move(v: Vendor, dir: -1 | 1) {
    const idx = VENDOR_STATUS.findIndex((s) => s.value === v.status);
    const next = VENDOR_STATUS[idx + dir];
    if (!next) return;
    update("vendors", v.id, { status: next.value });
    if (next.value === "booked") toast.success(`${v.name} geboekt!`, "Vergeet niet de aanbetaling in je budget te zetten.");
  }

  function toBudget(v: Vendor) {
    if (!wedding) return;
    if (budget_items.some((b) => b.vendor_id === v.id)) {
      toast.info("Staat al in je budget");
      return;
    }
    const cat = BUDGET_FOR[v.category] ?? "Overig";
    add("budget_items", {
      id: uid(),
      wedding_id: wedding.id,
      created_at: nowIso(),
      category: BUDGET_CATEGORIES.includes(cat) ? cat : "Overig",
      name: v.name,
      estimated: v.price ?? 0,
      actual: v.status === "booked" ? (v.price ?? 0) : 0,
      paid: false,
      vendor_id: v.id,
    });
    toast.success("Toegevoegd aan budget");
  }

  async function writeMail() {
    if (!wedding || !mailFor) return;
    setMailLoading(true);
    try {
      const res = await aiText("vendor_email", {
        couple: coupleName(wedding.partner_one, wedding.partner_two),
        date: formatDate(wedding.wedding_date),
        venue: wedding.venue,
        city: wedding.city,
        style: wedding.style,
        guests: guests.length || wedding.guest_estimate,
        vendor: mailFor.name,
        category: mailFor.category,
        wishes,
      });
      setMail(res.text ?? "");
    } catch (e) {
      toast.error("Mail schrijven mislukt", e instanceof Error ? e.message : undefined);
    } finally {
      setMailLoading(false);
    }
  }

  const mailParts = (() => {
    const m = mail.match(/^Onderwerp:\s*(.+)\n+([\s\S]*)$/i);
    return m ? { subject: m[1].trim(), body: m[2].trim() } : { subject: "Offerteaanvraag bruiloft", body: mail };
  })();

  return (
    <>
      <PageHeader
        eyebrow="Jullie dreamteam"
        title="Leveranciers"
        description="Van eerste idee tot geboekt. Verplaats kaarten als er iets verandert."
        actions={
          <Button onClick={() => openNew()}>
            <Plus className="size-4" aria-hidden /> Leverancier
          </Button>
        }
      />

      {vendors.length === 0 ? (
        <EmptyState icon={Store} title="Nog geen leveranciers" body="Houd hier fotografen, locaties, bloemisten en meer bij." action={<Button onClick={() => openNew()}>Eerste leverancier</Button>} />
      ) : (
        <LayoutGroup>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {VENDOR_STATUS.map((col, ci) => {
            const items = vendors.filter((v) => v.status === col.value);
            return (
              <section key={col.value} className={cn("w-[80vw] max-w-sm shrink-0 snap-start rounded-3xl bg-gradient-to-b to-transparent p-3 sm:w-80 lg:w-auto lg:max-w-none", COLUMN_TONE[col.value])} aria-label={col.label}>
                <div className="mb-3 flex items-center justify-between px-2 pt-1">
                  <h2 className="font-serif text-xl font-semibold">{col.label}</h2>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-ink-700">{items.length}</span>
                </div>
                <ul className="space-y-3">
                    {items.map((v) => (
                      <motion.li
                        key={v.id}
                        layout
                        layoutId={v.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        className="card p-4"
                      >
                        <button onClick={() => openEdit(v)} className="block w-full text-left">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium">{v.name}</p>
                            {v.price !== null && <span className="text-sm font-medium text-ink-700 tabular-nums">{formatEuro(v.price)}</span>}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge tone="ink">{v.category}</Badge>
                            {v.rating && (
                              <span className="flex items-center gap-0.5" aria-label={`${v.rating} van 5 sterren`}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={cn("size-3", i < v.rating! ? "fill-gold-400 text-gold-400" : "text-ink-300")} aria-hidden />
                                ))}
                              </span>
                            )}
                          </div>
                          {v.notes && <p className="mt-2 line-clamp-2 text-sm text-ink-500">{v.notes}</p>}
                        </button>
                        <div className="mt-3 flex items-center gap-1 border-t border-line pt-2">
                          <button onClick={() => move(v, -1)} disabled={ci === 0} className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30" aria-label={`${v.name} naar vorige fase`}>
                            <ChevronLeft className="size-4" />
                          </button>
                          <button onClick={() => move(v, 1)} disabled={ci === VENDOR_STATUS.length - 1} className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30" aria-label={`${v.name} naar volgende fase`}>
                            <ChevronRight className="size-4" />
                          </button>
                          <div className="ml-auto flex gap-1">
                            {v.phone && (
                              <a href={`tel:${v.phone}`} className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-700" aria-label={`Bel ${v.name}`}>
                                <Phone className="size-4" />
                              </a>
                            )}
                            {ai !== false && (
                              <button
                                onClick={() => { setMailFor(v); setMail(""); setWishes(""); }}
                                className="grid size-9 place-items-center rounded-full text-gold-600 hover:bg-gold-50"
                                aria-label={`Schrijf offerte-mail aan ${v.name}`}
                                title="Offerte-mail schrijven"
                              >
                                <Sparkles className="size-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.li>
                    ))}
                </ul>
                <button onClick={() => openNew(col.value)} className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-ink-300/60 text-sm text-ink-500 transition hover:border-rose-300 hover:bg-white/60 hover:text-rose-700">
                  <Plus className="size-4" aria-hidden /> Toevoegen
                </button>
              </section>
            );
          })}
        </div>
        </LayoutGroup>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? editing.name : "Nieuwe leverancier"}
        size="lg"
        footer={
          <>
            {editing && (
              <>
                <Button variant="danger" onClick={() => { remove("vendors", editing.id); setOpen(false); toast.info("Leverancier verwijderd"); }}>
                  <Trash2 className="size-4" aria-hidden /> Verwijderen
                </Button>
                <Button variant="ghost" className="mr-auto" onClick={() => toBudget({ ...editing, ...draft })}>
                  <Wallet className="size-4" aria-hidden /> Naar budget
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuleren</Button>
            <Button onClick={save} disabled={!draft.name.trim()}>Opslaan</Button>
          </>
        }
      >
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Input label="Naam" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Select label="Categorie" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} options={VENDOR_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <Select label="Status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as VendorStatus })} options={VENDOR_STATUS} />
          <Input label="Prijs (€)" type="number" inputMode="decimal" min={0} value={draft.price ?? ""} onChange={(e) => setDraft({ ...draft, price: e.target.value === "" ? null : Number(e.target.value) })} />
          <Input label="Contactpersoon" value={draft.contact_name} onChange={(e) => setDraft({ ...draft, contact_name: e.target.value })} />
          <Input label="Telefoon" type="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          <Input label="E-mail" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          <Input label="Website" type="url" placeholder="https://" value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} />
          <fieldset className="sm:col-span-2">
            <legend className="label">Beoordeling</legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDraft({ ...draft, rating: draft.rating === n ? null : n })}
                  className="grid size-11 place-items-center rounded-full transition hover:bg-gold-50"
                  aria-label={`${n} ${n === 1 ? "ster" : "sterren"}`}
                  aria-pressed={(draft.rating ?? 0) >= n}
                >
                  <Star className={cn("size-6 transition", (draft.rating ?? 0) >= n ? "fill-gold-400 text-gold-400" : "text-ink-300")} />
                </button>
              ))}
            </div>
          </fieldset>
          <Textarea className="sm:col-span-2" label="Notities" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          <button type="submit" hidden />
        </form>
        {editing?.website && (
          <a href={editing.website} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-rose-700 hover:underline">
            Website bezoeken <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
      </Modal>

      <Modal
        open={!!mailFor}
        onClose={() => setMailFor(null)}
        title="Offerte-mail schrijven"
        description={mailFor ? `Aan ${mailFor.name} (${mailFor.category})` : undefined}
        size="lg"
        footer={
          <>
            {mail && (
              <>
                <Button variant="secondary" onClick={() => navigator.clipboard.writeText(mail).then(() => toast.success("Gekopieerd"))}>
                  <Copy className="size-4" aria-hidden /> Kopiëren
                </Button>
                {mailFor?.email && (
                  <a
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-[15px] font-medium hover:bg-rose-50"
                    href={`mailto:${mailFor.email}?subject=${encodeURIComponent(mailParts.subject)}&body=${encodeURIComponent(mailParts.body)}`}
                  >
                    <Mail className="size-4" aria-hidden /> Open in mail
                  </a>
                )}
              </>
            )}
            <Button variant="gold" onClick={writeMail} loading={mailLoading}>
              <Sparkles className="size-4" aria-hidden /> {mail ? "Opnieuw" : "Schrijf mail"}
            </Button>
          </>
        }
      >
        <Textarea label="Specifieke wensen (optioneel)" placeholder="Bijv. hele dag aanwezig, ook drone-beelden, budget rond €2.000" value={wishes} onChange={(e) => setWishes(e.target.value)} />
        {mailLoading && (
          <div className="mt-5 space-y-2" aria-busy="true">
            {[70, 95, 90, 80, 40].map((w, i) => <div key={i} className="shine h-3.5 rounded-full bg-rose-50" style={{ width: `${w}%` }} />)}
          </div>
        )}
        {mail && !mailLoading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
            <label htmlFor="vendor-mail" className="label">Concept</label>
            <textarea id="vendor-mail" className="field min-h-64 leading-relaxed" value={mail} onChange={(e) => setMail(e.target.value)} />
          </motion.div>
        )}
      </Modal>
    </>
  );
}
