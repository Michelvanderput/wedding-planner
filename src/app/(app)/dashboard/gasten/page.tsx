"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Copy, Download, ExternalLink, FileSpreadsheet, Link2, Mail, Send, Pencil, Plus, Search, Sparkles, Trash2, UserPlus, Users, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GuestImportModal } from "@/components/dashboard/guest-import";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea, Toggle } from "@/components/ui/field";
import { Badge, EmptyState, PageHeader } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { aiText, useAiEnabled } from "@/lib/ai";
import { buildGuestWorkbook, downloadBlob } from "@/lib/guest-excel";
import { INVITED_LABEL, RSVP_LABEL } from "@/lib/defaults";
import { useWedding } from "@/lib/store";
import { SITE_URL } from "@/lib/supabase/config";
import type { Guest, InvitedTo, Rsvp, Side } from "@/lib/types";
import { cn, coupleName, formatDate, initials, nowIso, uid } from "@/lib/utils";

type Draft = Omit<Guest, "id" | "wedding_id" | "created_at" | "rsvp_token" | "table_id">;
const blank = (): Draft => ({
  name: "",
  email: "",
  phone: "",
  side: "both",
  group_name: "",
  invited_to: "day",
  rsvp: "pending",
  plus_one: false,
  dietary: "",
});

const RSVP_TONE: Record<Rsvp, "sage" | "gold" | "rose"> = { attending: "sage", pending: "gold", declined: "rose" };

export default function GuestsPage() {
  const { wedding, guests, add, update, remove, mode } = useWedding();
  const toast = useToast();
  const ai = useAiEnabled();
  const [query, setQuery] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState<Rsvp | "all">("all");
  const [invFilter, setInvFilter] = useState<InvitedTo | "all">("all");
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulk, setBulk] = useState("");
  const [bulkInvited, setBulkInvited] = useState<InvitedTo>("day");
  const [editing, setEditing] = useState<Guest | null>(null);
  const [draft, setDraft] = useState<Draft>(blank());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTone, setInviteTone] = useState("warm en feestelijk");
  const [inviteType, setInviteType] = useState<InvitedTo>("day");
  const [inviteText, setInviteText] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get("filter");
    if (f === "pending" || f === "attending" || f === "declined") setRsvpFilter(f);
  }, []);

  const sideLabel: Record<Side, string> = {
    partner_one: `Kant ${wedding?.partner_one || "partner 1"}`,
    partner_two: `Kant ${wedding?.partner_two || "partner 2"}`,
    both: "Gezamenlijk",
  };

  const stats = useMemo(() => {
    const attending = guests.filter((g) => g.rsvp === "attending");
    return {
      total: guests.length,
      headcount: attending.length + attending.filter((g) => g.plus_one).length,
      pending: guests.filter((g) => g.rsvp === "pending").length,
      declined: guests.filter((g) => g.rsvp === "declined").length,
      day: guests.filter((g) => g.invited_to === "day").length,
      evening: guests.filter((g) => g.invited_to === "evening").length,
      dietary: guests.filter((g) => g.dietary.trim()).length,
    };
  }, [guests]);

  const list = useMemo(() => {
    const q = query.toLowerCase();
    return guests
      .filter((g) => rsvpFilter === "all" || g.rsvp === rsvpFilter)
      .filter((g) => invFilter === "all" || g.invited_to === invFilter)
      .filter((g) => !q || [g.name, g.group_name, g.email, g.dietary].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name, "nl"));
  }, [guests, query, rsvpFilter, invFilter]);

  function openNew() {
    setEditing(null);
    setDraft(blank());
    setOpen(true);
  }
  function openEdit(g: Guest) {
    setEditing(g);
    const { id: _i, wedding_id: _w, created_at: _c, rsvp_token: _r, table_id: _t, ...rest } = g;
    setDraft(rest);
    setOpen(true);
  }
  function save() {
    if (!draft.name.trim() || !wedding) return;
    if (editing) update("guests", editing.id, draft);
    else add("guests", { ...draft, id: uid(), wedding_id: wedding.id, created_at: nowIso(), rsvp_token: uid(), table_id: null });
    setOpen(false);
    toast.success(editing ? "Gast bijgewerkt" : "Gast toegevoegd");
  }

  function saveBulk() {
    if (!wedding) return;
    const names = bulk.split("\n").map((n) => n.trim()).filter(Boolean).slice(0, 300);
    add(
      "guests",
      names.map((name) => ({ ...blank(), name, invited_to: bulkInvited, id: uid(), wedding_id: wedding.id, created_at: nowIso(), rsvp_token: uid(), table_id: null })),
    );
    setBulk("");
    setBulkOpen(false);
    toast.success(`${names.length} gasten toegevoegd`);
  }

  function rsvpLink(g: Guest) {
    return `${SITE_URL || window.location.origin}/rsvp/${g.rsvp_token}`;
  }

  async function copy(text: string, msg: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error("Kopiëren lukte niet");
    }
  }

  async function exportExcel() {
    if (!wedding) return;
    try {
      downloadBlob(await buildGuestWorkbook(wedding, [...guests].sort((a, b) => a.name.localeCompare(b.name, "nl"))), "gastenlijst.xlsx");
    } catch (e) {
      toast.error("Exporteren mislukt", e instanceof Error ? e.message : undefined);
    }
  }

  async function writeInvite() {
    if (!wedding) return;
    setInviteLoading(true);
    try {
      const res = await aiText("invitation", {
        couple: coupleName(wedding.partner_one, wedding.partner_two),
        date: formatDate(wedding.wedding_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
        venue: wedding.venue,
        city: wedding.city,
        style: wedding.style,
        tone: inviteTone,
        invited_to: inviteType,
      });
      setInviteText(res.text ?? "");
    } catch (e) {
      toast.error("Tekst schrijven mislukt", e instanceof Error ? e.message : undefined);
    } finally {
      setInviteLoading(false);
    }
  }

  const statCards = [
    { label: "Uitgenodigd", value: stats.total, sub: `${stats.day} dag · ${stats.evening} avond` },
    { label: "Komen (incl. +1)", value: stats.headcount, sub: "bevestigd", tone: "text-sage-700" },
    { label: "Wachten", value: stats.pending, sub: "nog geen antwoord", tone: "text-gold-700" },
    { label: "Dieetwensen", value: stats.dietary, sub: "om door te geven" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Met wie vieren jullie het?"
        title="Gasten"
        description="Beheer je gastenlijst, volg RSVP's en houd dieetwensen bij."
        actions={
          <>
            {ai !== false && (
              <Button variant="secondary" onClick={() => setInviteOpen(true)}>
                <Sparkles className="size-4 text-gold-600" aria-hidden /> Uitnodigingstekst
              </Button>
            )}
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet className="size-4 text-sage-600" aria-hidden /> Excel import
            </Button>
            <Button variant="secondary" onClick={() => setBulkOpen(true)}>
              <UserPlus className="size-4" aria-hidden /> Snel toevoegen
            </Button>
            <Button onClick={openNew}>
              <Plus className="size-4" aria-hidden /> Gast
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
            <p className="text-sm text-ink-500">{s.label}</p>
            <p className={cn("stat text-3xl tabular-nums", s.tone)}>{s.value}</p>
            <p className="text-xs text-ink-500">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="card mb-4 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
          <label htmlFor="guest-search" className="sr-only">Zoek gasten</label>
          <input id="guest-search" className="field pl-10" placeholder="Zoek op naam, groep of dieetwens…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Segmented
            id="rsvp"
            value={rsvpFilter}
            onChange={setRsvpFilter}
            options={[
              ["all", "Alle"],
              ["attending", "Komt"],
              ["pending", "Wacht"],
              ["declined", "Niet"],
            ]}
          />
          <Segmented
            id="inv"
            value={invFilter}
            onChange={setInvFilter}
            options={[
              ["all", "Dag + avond"],
              ["day", "Dag"],
              ["evening", "Avond"],
            ]}
          />
          {guests.length > 0 && (
            <Button variant="ghost" size="sm" onClick={exportExcel} className="h-11">
              <Download className="size-4" aria-hidden /> Excel
            </Button>
          )}
        </div>
      </div>

      {guests.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nog geen gasten"
          body="Importeer je lijst uit Excel, plak een rij namen of voeg gasten één voor één toe."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => setImportOpen(true)}>
                <FileSpreadsheet className="size-4" aria-hidden /> Excel importeren
              </Button>
              <Button variant="secondary" onClick={() => setBulkOpen(true)}>Namen plakken</Button>
            </div>
          }
        />
      ) : list.length === 0 ? (
        <p className="py-16 text-center text-ink-500">Geen gasten gevonden met deze filters.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {list.map((g) => (
              <motion.li
                key={g.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                className="card group flex flex-col gap-3 p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-full font-serif text-lg font-semibold",
                      g.side === "partner_one" ? "bg-rose-100 text-rose-700" : g.side === "partner_two" ? "bg-gold-100 text-gold-700" : "bg-sage-100 text-sage-700",
                    )}
                    aria-hidden
                  >
                    {initials(g.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {g.name}
                      {g.plus_one && <span className="ml-1 text-sm text-ink-500">+1</span>}
                    </p>
                    <p className="truncate text-sm text-ink-500">
                      {[INVITED_LABEL[g.invited_to], g.group_name, sideLabel[g.side]].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <button onClick={() => openEdit(g)} className="grid size-10 place-items-center rounded-full text-ink-500 transition hover:bg-rose-50 hover:text-rose-700" aria-label={`Bewerk ${g.name}`}>
                    <Pencil className="size-4" />
                  </button>
                </div>
                {g.dietary && (
                  <p className="flex items-center gap-1.5 text-sm text-ink-700">
                    <Utensils className="size-3.5 text-gold-600" aria-hidden /> {g.dietary}
                  </p>
                )}
                <div className="mt-auto flex items-center gap-2">
                  <label htmlFor={`rsvp-${g.id}`} className="sr-only">RSVP voor {g.name}</label>
                  <select
                    id={`rsvp-${g.id}`}
                    value={g.rsvp}
                    onChange={(e) => update("guests", g.id, { rsvp: e.target.value as Rsvp })}
                    className={cn(
                      "min-h-9 rounded-full border-0 px-3 text-xs font-medium ring-1 ring-inset focus:ring-2",
                      { sage: "bg-sage-50 text-sage-700 ring-sage-200", gold: "bg-gold-50 text-gold-700 ring-gold-200", rose: "bg-rose-50 text-rose-700 ring-rose-200" }[RSVP_TONE[g.rsvp]],
                    )}
                  >
                    {(Object.keys(RSVP_LABEL) as Rsvp[]).map((r) => (
                      <option key={r} value={r}>{RSVP_LABEL[r]}</option>
                    ))}
                  </select>
                  <div className="ml-auto flex gap-1">
                    {g.email && (
                      <a href={`mailto:${g.email}`} className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-700" aria-label={`Mail ${g.name}`}>
                        <Mail className="size-4" />
                      </a>
                    )}
                    {mode === "supabase" && (
                      <button onClick={() => copy(rsvpLink(g), "Uitnodigingslink gekopieerd")} className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-700" aria-label={`Kopieer uitnodigingslink voor ${g.name}`}>
                        <Link2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* Gast toevoegen / bewerken */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Gast bewerken" : "Nieuwe gast"}
        footer={
          <>
            {editing && (
              <Button variant="danger" className="mr-auto" onClick={() => { remove("guests", editing.id); setOpen(false); toast.info("Gast verwijderd"); }}>
                <Trash2 className="size-4" aria-hidden /> Verwijderen
              </Button>
            )}
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuleren</Button>
            <Button onClick={save} disabled={!draft.name.trim()}>Opslaan</Button>
          </>
        }
      >
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Input className="sm:col-span-2" label="Naam" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input label="E-mail" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          <Input label="Telefoon" type="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          <Select label="Uitgenodigd als" value={draft.invited_to} onChange={(e) => setDraft({ ...draft, invited_to: e.target.value as InvitedTo })} options={[{ value: "day", label: "Daggast" }, { value: "evening", label: "Avondgast" }]} />
          <Select label="RSVP" value={draft.rsvp} onChange={(e) => setDraft({ ...draft, rsvp: e.target.value as Rsvp })} options={(Object.keys(RSVP_LABEL) as Rsvp[]).map((r) => ({ value: r, label: RSVP_LABEL[r] }))} />
          <Select label="Kant" value={draft.side} onChange={(e) => setDraft({ ...draft, side: e.target.value as Side })} options={(Object.keys(sideLabel) as Side[]).map((s) => ({ value: s, label: sideLabel[s] }))} />
          <Input label="Groep" placeholder="Familie, vrienden, werk…" value={draft.group_name} onChange={(e) => setDraft({ ...draft, group_name: e.target.value })} />
          <Input className="sm:col-span-2" label="Dieetwensen / allergieën" value={draft.dietary} onChange={(e) => setDraft({ ...draft, dietary: e.target.value })} />
          <div className="sm:col-span-2">
            <Toggle checked={draft.plus_one} onChange={(v) => setDraft({ ...draft, plus_one: v })} label="Neemt iemand mee (+1)" />
          </div>
          <button type="submit" hidden />
        </form>
        {editing && mode === "supabase" && (
          <div className="mt-5 rounded-2xl bg-ivory p-4">
            <p className="text-sm font-medium text-ink-900">Persoonlijke uitnodiging</p>
            <p className="mt-0.5 truncate text-xs text-ink-500">{rsvpLink(editing)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => copy(rsvpLink(editing), "Link gekopieerd")}>
                <Copy className="size-4" aria-hidden /> Kopieer link
              </Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Lieve ${editing.name.split(" ")[0]}, hierbij onze uitnodiging voor de bruiloft: ${rsvpLink(editing)}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-medium hover:bg-rose-50"
              >
                <Send className="size-4" aria-hidden /> WhatsApp
              </a>
              <a
                href={`/rsvp/${editing.rsvp_token}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-medium hover:bg-rose-50"
              >
                <ExternalLink className="size-4" aria-hidden /> Bekijk
              </a>
            </div>
          </div>
        )}
      </Modal>

      <GuestImportModal open={importOpen} onClose={() => setImportOpen(false)} />

      {/* Snel toevoegen */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Snel gasten toevoegen"
        description="Plak een lijst met namen, één naam per regel."
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulkOpen(false)}>Annuleren</Button>
            <Button onClick={saveBulk} disabled={!bulk.trim()}>
              {bulk.split("\n").filter((n) => n.trim()).length || ""} gasten toevoegen
            </Button>
          </>
        }
      >
        <Textarea label="Namen" rows={8} placeholder={"Anna de Vries\nPieter Jansen\nFamilie Bakker"} value={bulk} onChange={(e) => setBulk(e.target.value)} />
        <div className="mt-4">
          <Segmented id="bulk-inv" value={bulkInvited} onChange={setBulkInvited} options={[["day", "Daggasten"], ["evening", "Avondgasten"]]} />
        </div>
      </Modal>

      {/* AI uitnodiging */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Uitnodigingstekst schrijven"
        description="Flora schrijft een tekst die je op je kaart of in een bericht kunt gebruiken."
        footer={
          <>
            {inviteText && (
              <Button variant="secondary" onClick={() => copy(inviteText, "Tekst gekopieerd")}>
                <Copy className="size-4" aria-hidden /> Kopiëren
              </Button>
            )}
            <Button variant="gold" onClick={writeInvite} loading={inviteLoading}>
              <Sparkles className="size-4" aria-hidden /> {inviteText ? "Opnieuw" : "Schrijf tekst"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Voor" value={inviteType} onChange={(e) => setInviteType(e.target.value as InvitedTo)} options={[{ value: "day", label: "Daggasten" }, { value: "evening", label: "Avondgasten" }]} />
          <Select
            label="Toon"
            value={inviteTone}
            onChange={(e) => setInviteTone(e.target.value)}
            options={["warm en feestelijk", "formeel en elegant", "speels en grappig", "kort en modern", "poëtisch"].map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))}
          />
        </div>
        <AnimatePresence mode="wait">
          {inviteLoading ? (
            <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 space-y-2">
              {[95, 85, 90, 60].map((w, i) => <div key={i} className="shine h-3.5 rounded-full bg-rose-50" style={{ width: `${w}%` }} />)}
            </motion.div>
          ) : inviteText ? (
            <motion.div key="t" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
              <label htmlFor="invite-text" className="label">Resultaat (aan te passen)</label>
              <textarea id="invite-text" className="field min-h-48 font-serif text-lg leading-relaxed" value={inviteText} onChange={(e) => setInviteText(e.target.value)} />
            </motion.div>
          ) : null}
        </AnimatePresence>
        {mode === "local" && (
          <p className="mt-4 text-xs text-ink-500">
            Tip: koppel Supabase om iedere gast een persoonlijke RSVP-link te geven. <Badge tone="gold">Online RSVP</Badge>
          </p>
        )}
      </Modal>
    </>
  );
}
