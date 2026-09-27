"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Gift as GiftIcon, PiggyBank, Plus, Trash2, UserMinus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Fab } from "@/components/ui/fab";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Badge, Bar, EmptyState, PageHeader } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useWedding } from "@/lib/store";
import type { Gift } from "@/lib/types";
import { cn, formatEuro, nowIso, uid } from "@/lib/utils";

type Draft = Omit<Gift, "id" | "wedding_id" | "created_at">;
const blank = (): Draft => ({ title: "", description: "", url: "", image_url: "", price: null, kind: "item", quantity: 1 });

const SUGGESTIONS: Draft[] = [
  { title: "Bijdrage aan onze huwelijksreis", description: "Help ons aan een onvergetelijke reis.", url: "", image_url: "", price: 1500, kind: "fund", quantity: 1 },
  { title: "Espressomachine", description: "", url: "", image_url: "", price: 350, kind: "item", quantity: 1 },
  { title: "Diner voor twee", description: "Een avondje uit na alle drukte.", url: "", image_url: "", price: 120, kind: "item", quantity: 1 },
  { title: "Set wijnglazen", description: "", url: "", image_url: "", price: 60, kind: "item", quantity: 2 },
];

export default function GiftsPage() {
  const { wedding, gifts, gift_claims, add, update, remove, mode } = useWedding();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Gift | null>(null);
  const [draft, setDraft] = useState<Draft>(blank());

  const claimsBy = useMemo(() => {
    const m = new Map<string, typeof gift_claims>();
    for (const c of gift_claims) m.set(c.gift_id, [...(m.get(c.gift_id) ?? []), c]);
    return m;
  }, [gift_claims]);

  const stats = useMemo(() => {
    const items = gifts.filter((g) => g.kind === "item");
    const reserved = items.filter((g) => (claimsBy.get(g.id)?.length ?? 0) >= g.quantity).length;
    const raised = gift_claims.reduce((a, c) => a + (c.amount ?? 0), 0);
    return { items: items.length, reserved, raised };
  }, [gifts, gift_claims, claimsBy]);

  function openNew(d?: Draft) {
    setEditing(null);
    setDraft(d ?? blank());
    setOpen(true);
  }
  function openEdit(g: Gift) {
    setEditing(g);
    const { id: _i, wedding_id: _w, created_at: _c, ...rest } = g;
    setDraft(rest);
    setOpen(true);
  }
  function save() {
    if (!wedding || !draft.title.trim()) return;
    const clean: Draft = {
      ...draft,
      title: draft.title.trim().slice(0, 120),
      price: draft.price === null || Number.isNaN(Number(draft.price)) || Number(draft.price) <= 0 ? null : Number(draft.price),
      quantity: Math.max(1, Math.min(99, Number(draft.quantity) || 1)),
      url: /^https?:\/\//.test(draft.url.trim()) ? draft.url.trim() : "",
      image_url: /^https:\/\//.test(draft.image_url.trim()) ? draft.image_url.trim() : "",
    };
    if (editing) update("gifts", editing.id, clean);
    else add("gifts", { ...clean, id: uid(), wedding_id: wedding.id, created_at: nowIso() });
    setOpen(false);
    toast.success(editing ? "Cadeau bijgewerkt" : "Cadeau toegevoegd");
  }

  return (
    <>
      <PageHeader
        eyebrow="Wat wensen jullie?"
        title="Cadeaulijst"
        description="Gasten zien jullie wensen op hun uitnodiging en kunnen iets reserveren of bijdragen aan een geldpot. Zo krijg je niets dubbel."
        actions={
          <>
            <ButtonLink href="/dashboard/uitnodiging?tab=vormgeving" variant="secondary">
              Plek op uitnodiging
            </ButtonLink>
            <Button onClick={() => openNew()} className="max-sm:hidden">
              <Plus className="size-4" aria-hidden /> Cadeau
            </Button>
          </>
        }
      />

      {mode === "local" && (
        <p className="mb-6 rounded-2xl bg-gold-50 px-4 py-3 text-sm text-ink-700">
          Je kunt de lijst al vullen. Reserveren door gasten werkt zodra Supabase is gekoppeld.
        </p>
      )}

      {gifts.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="card p-4">
            <p className="text-sm text-ink-500">Wensen</p>
            <p className="stat text-3xl">{gifts.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-ink-500">Gereserveerd</p>
            <p className="stat text-3xl">
              {stats.reserved}
              <span className="text-lg text-ink-500"> / {stats.items}</span>
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-ink-500">Toegezegd</p>
            <p className="stat text-3xl">{formatEuro(stats.raised)}</p>
          </div>
        </div>
      )}

      {gifts.length === 0 ? (
        <EmptyState
          icon={GiftIcon}
          title="Nog geen wensen"
          body="Voeg cadeaus of een geldpot toe. Hieronder een paar ideeën om mee te beginnen."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s.title} type="button" onClick={() => openNew(s)} className="min-h-10 rounded-full border border-line bg-white px-4 text-sm hover:border-rose-200 hover:bg-rose-50">
                  + {s.title}
                </button>
              ))}
            </div>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {gifts.map((g) => {
              const claims = claimsBy.get(g.id) ?? [];
              const raised = claims.reduce((a, c) => a + (c.amount ?? 0), 0);
              const full = g.kind === "item" && claims.length >= g.quantity;
              return (
                <motion.li key={g.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="card flex flex-col overflow-hidden">
                  <button onClick={() => openEdit(g)} className="block text-left">
                    <div className="relative grid h-36 place-items-center bg-gradient-to-br from-rose-50 to-gold-50">
                      {g.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={g.image_url} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
                      ) : g.kind === "fund" ? (
                        <PiggyBank className="size-10 text-rose-400" aria-hidden />
                      ) : (
                        <GiftIcon className="size-10 text-rose-400" aria-hidden />
                      )}
                      <span className="absolute top-3 left-3">
                        {g.kind === "fund" ? <Badge tone="gold">Geldpot</Badge> : full ? <Badge tone="sage">Gereserveerd</Badge> : <Badge tone="ink">{g.quantity - claims.length} beschikbaar</Badge>}
                      </span>
                    </div>
                    <div className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{g.title}</p>
                        {g.price !== null && <span className="stat shrink-0 text-sm text-ink-700">{formatEuro(g.price)}</span>}
                      </div>
                      {g.description && <p className="mt-1 line-clamp-2 text-sm text-ink-500">{g.description}</p>}
                    </div>
                  </button>
                  <div className="mt-auto px-4 pb-4">
                    {g.kind === "fund" && g.price ? (
                      <div className="mt-1">
                        <Bar value={raised / g.price} tone="gold" label={`${g.title}: ${formatEuro(raised)} van ${formatEuro(g.price)}`} />
                        <p className="mt-1 text-xs text-ink-500">
                          {formatEuro(raised)} van {formatEuro(g.price)}
                        </p>
                      </div>
                    ) : null}
                    {claims.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-line pt-2 text-sm">
                        {claims.map((c) => (
                          <li key={c.id} className="flex items-center gap-2">
                            <span className="min-w-0 flex-1 truncate text-ink-700">{c.name}</span>
                            {c.amount ? <span className="stat shrink-0 text-sm text-ink-900">{formatEuro(c.amount)}</span> : null}
                            <button
                              onClick={() => {
                                remove("gift_claims", c.id);
                                toast.info("Reservering verwijderd");
                              }}
                              className="grid size-8 place-items-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-700"
                              aria-label={`Reservering van ${c.name} verwijderen`}
                            >
                              <UserMinus className="size-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {g.url && (
                      <a href={g.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm text-rose-700 hover:underline">
                        Bekijk in winkel <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <Fab label="Nieuw cadeau" icon={Plus} onClick={() => openNew()} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Cadeau bewerken" : "Nieuw cadeau"}
        footer={
          <>
            {editing && (
              <Button
                variant="danger"
                className="mr-auto"
                onClick={() => {
                  remove("gifts", editing.id);
                  setOpen(false);
                  toast.info("Cadeau verwijderd");
                }}
              >
                <Trash2 className="size-4" aria-hidden /> Verwijderen
              </Button>
            )}
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={save} disabled={!draft.title.trim()}>
              Opslaan
            </Button>
          </>
        }
      >
        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="sm:col-span-2" role="radiogroup" aria-label="Soort">
            <p className="label">Soort</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["item", "Cadeau", "Eén gast reserveert het"],
                  ["fund", "Geldpot", "Iedereen draagt bij"],
                ] as const
              ).map(([k, l, h]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={draft.kind === k}
                  onClick={() => setDraft({ ...draft, kind: k })}
                  className={cn("rounded-2xl border p-3 text-left transition", draft.kind === k ? "border-rose-400 bg-rose-50" : "border-line hover:border-rose-200")}
                >
                  <span className="block font-medium">{l}</span>
                  <span className="text-xs text-ink-500">{h}</span>
                </button>
              ))}
            </div>
          </div>
          <Input className="sm:col-span-2" label="Omschrijving" required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <Input
            label={draft.kind === "fund" ? "Streefbedrag (€)" : "Prijs (€)"}
            type="number"
            inputMode="decimal"
            min={0}
            value={draft.price ?? ""}
            onChange={(e) => setDraft({ ...draft, price: e.target.value === "" ? null : Number(e.target.value) })}
          />
          {draft.kind === "item" ? (
            <Select
              label="Aantal"
              value={String(draft.quantity)}
              onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })}
              options={Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
            />
          ) : (
            <div />
          )}
          <Input className="sm:col-span-2" label="Link naar winkel (optioneel)" type="url" placeholder="https://" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
          <Input className="sm:col-span-2" label="Afbeelding (link, optioneel)" type="url" placeholder="https://" value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} />
          <Textarea className="sm:col-span-2" label="Toelichting voor gasten" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <button type="submit" hidden />
        </form>
      </Modal>
    </>
  );
}
