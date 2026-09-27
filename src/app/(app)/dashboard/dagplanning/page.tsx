"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, MapPin, Plus, Printer, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Badge, EmptyState, PageHeader } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { aiText, useAiEnabled } from "@/lib/ai";
import { useWedding } from "@/lib/store";
import type { Audience, TimelineEvent } from "@/lib/types";

const AUDIENCE: { value: Audience; label: string }[] = [
  { value: "all", label: "Iedereen (ook avondgasten)" },
  { value: "day", label: "Alleen daggasten" },
  { value: "private", label: "Alleen wij (niet op uitnodiging)" },
];
import { coupleName, formatDate, nowIso, uid } from "@/lib/utils";

type Draft = Omit<TimelineEvent, "id" | "wedding_id" | "created_at">;
const blank = (): Draft => ({ start_time: "12:00", end_time: "", title: "", location: "", notes: "", audience: "all" });
const TIME = /^\d{2}:\d{2}$/;

export default function TimelinePage() {
  const { wedding, timeline_events, guests, add, update, remove } = useWedding();
  const toast = useToast();
  const ai = useAiEnabled();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const [draft, setDraft] = useState<Draft>(blank());
  const [aiOpen, setAiOpen] = useState(false);
  const [wishes, setWishes] = useState("");
  const [replace, setReplace] = useState<"replace" | "append">("replace");
  const [loading, setLoading] = useState(false);

  const events = useMemo(() => [...timeline_events].sort((a, b) => a.start_time.localeCompare(b.start_time)), [timeline_events]);

  function openNew() {
    setEditing(null);
    setDraft(blank());
    setOpen(true);
  }
  function openEdit(e: TimelineEvent) {
    setEditing(e);
    setDraft({ start_time: e.start_time, end_time: e.end_time, title: e.title, location: e.location, notes: e.notes, audience: e.audience ?? "all" });
    setOpen(true);
  }
  function save() {
    if (!draft.title.trim() || !wedding) return;
    if (editing) update("timeline_events", editing.id, draft);
    else add("timeline_events", { ...draft, id: uid(), wedding_id: wedding.id, created_at: nowIso() });
    setOpen(false);
  }

  async function generate() {
    if (!wedding) return;
    setLoading(true);
    try {
      const res = await aiText("timeline", {
        couple: coupleName(wedding.partner_one, wedding.partner_two),
        date: formatDate(wedding.wedding_date),
        venue: wedding.venue,
        city: wedding.city,
        style: wedding.style,
        guests: guests.length || wedding.guest_estimate,
        ceremony_time: wedding.ceremony_time,
        wishes,
      });
      const items = ((res.items ?? []) as Partial<Draft>[])
        .filter((i) => i?.title && TIME.test(String(i.start_time)))
        .map((i) => ({
          id: uid(),
          wedding_id: wedding.id,
          created_at: nowIso(),
          start_time: String(i.start_time),
          end_time: TIME.test(String(i.end_time)) ? String(i.end_time) : "",
          title: String(i.title).slice(0, 120),
          location: String(i.location ?? "").slice(0, 120),
          notes: String(i.notes ?? "").slice(0, 400),
          audience: "all" as const,
        }));
      if (!items.length) throw new Error("Geen bruikbaar draaiboek ontvangen");
      if (replace === "replace") timeline_events.forEach((e) => remove("timeline_events", e.id));
      add("timeline_events", items);
      setAiOpen(false);
      toast.success("Draaiboek gemaakt", `${items.length} onderdelen toegevoegd.`);
    } catch (e) {
      toast.error("Genereren mislukt", e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="De grote dag"
        title="Draaiboek"
        description="Een helder tijdschema voor jullie, de ceremoniemeester en alle leveranciers."
        actions={
          <>
            {events.length > 0 && (
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="size-4" aria-hidden /> Printen
              </Button>
            )}
            {ai !== false && (
              <Button variant="secondary" onClick={() => setAiOpen(true)}>
                <Sparkles className="size-4 text-gold-600" aria-hidden /> Genereer met AI
              </Button>
            )}
            <Button onClick={openNew}>
              <Plus className="size-4" aria-hidden /> Onderdeel
            </Button>
          </>
        }
      />

      {events.length === 0 ? (
        <EmptyState icon={Clock} title="Nog geen draaiboek" body="Voeg onderdelen toe of laat AI een complete dagplanning maken." action={<Button onClick={openNew}>Eerste onderdeel</Button>} />
      ) : (
        <div className="card relative p-4 sm:p-8">
          <p className="mb-6 hidden font-script text-4xl text-rose-700 print:block">
            {coupleName(wedding?.partner_one, wedding?.partner_two)} · {formatDate(wedding?.wedding_date)}
          </p>
          <ol className="relative">
            <motion.div
              className="absolute top-3 bottom-3 left-[72px] w-px origin-top bg-gradient-to-b from-rose-300 via-gold-300 to-sage-300 sm:left-[92px]"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden
            />
            <AnimatePresence initial={false}>
              {events.map((e, i) => {
                const highlight = /ceremonie|ja-woord|jawoord/i.test(e.title);
                return (
                  <motion.li
                    key={e.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: Math.min(i * 0.05, 0.5) }}
                    className="relative grid grid-cols-[60px_24px_1fr] items-start gap-2 py-2 sm:grid-cols-[80px_24px_1fr] sm:gap-3"
                  >
                    <div className="pt-3 text-right">
                      <p className="stat text-lg">{e.start_time}</p>
                      {e.end_time && <p className="text-xs text-ink-500 tabular-nums">tot {e.end_time}</p>}
                    </div>
                    <div className="relative grid h-12 place-items-center">
                      <span className={highlight ? "size-4 rounded-full bg-rose-500 ring-4 ring-rose-100" : "size-3 rounded-full border-2 border-rose-300 bg-white"} />
                    </div>
                    <button
                      onClick={() => openEdit(e)}
                      className={`group rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] ${
                        highlight ? "border-rose-200 bg-gradient-to-r from-rose-50 to-white" : "border-line bg-white hover:border-rose-200"
                      }`}
                    >
                      <p className="flex flex-wrap items-center gap-2 font-medium text-ink-900">
                        {e.title}
                        {e.audience === "day" && <Badge tone="gold">Daggasten</Badge>}
                        {e.audience === "private" && <Badge tone="ink">Privé</Badge>}
                      </p>
                      {e.location && (
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-500">
                          <MapPin className="size-3.5" aria-hidden /> {e.location}
                        </p>
                      )}
                      {e.notes && <p className="mt-1.5 text-sm text-ink-700">{e.notes}</p>}
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Onderdeel bewerken" : "Nieuw onderdeel"}
        footer={
          <>
            {editing && (
              <Button variant="danger" className="mr-auto" onClick={() => { remove("timeline_events", editing.id); setOpen(false); }}>
                <Trash2 className="size-4" aria-hidden /> Verwijderen
              </Button>
            )}
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuleren</Button>
            <Button onClick={save} disabled={!draft.title.trim()}>Opslaan</Button>
          </>
        }
      >
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Input className="sm:col-span-2" label="Wat gebeurt er?" required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <Input label="Begintijd" type="time" required value={draft.start_time} onChange={(e) => setDraft({ ...draft, start_time: e.target.value })} />
          <Input label="Eindtijd" type="time" value={draft.end_time} onChange={(e) => setDraft({ ...draft, end_time: e.target.value })} />
          <Input label="Locatie" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
          <Select label="Zichtbaar op uitnodiging voor" value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value as Audience })} options={AUDIENCE} />
          <Textarea className="sm:col-span-2" label="Notities" hint="Bijv. wie is verantwoordelijk, wat moet er klaarstaan." value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          <button type="submit" hidden />
        </form>
      </Modal>

      <Modal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title="Draaiboek genereren"
        description={`Op basis van jullie ceremonie om ${wedding?.ceremony_time || "14:00"} en ${guests.length || wedding?.guest_estimate} gasten.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAiOpen(false)}>Annuleren</Button>
            <Button variant="gold" onClick={generate} loading={loading}>
              <Sparkles className="size-4" aria-hidden /> Genereer
            </Button>
          </>
        }
      >
        <Textarea
          label="Wensen (optioneel)"
          placeholder="Bijv. first look in de tuin, walking dinner, fotoshoot bij zonsondergang, live band vanaf 21:00"
          value={wishes}
          onChange={(e) => setWishes(e.target.value)}
        />
        {timeline_events.length > 0 && (
          <div className="mt-4">
            <Segmented id="tl-mode" value={replace} onChange={setReplace} options={[["replace", "Vervang huidig draaiboek"], ["append", "Voeg toe"]]} />
          </div>
        )}
      </Modal>
    </>
  );
}
