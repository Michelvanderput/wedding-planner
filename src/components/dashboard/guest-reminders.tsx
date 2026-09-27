"use client";

import { Check, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { Guest, Wedding } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const DEFAULT_TEXT =
  "Lieve {naam},\n\nWe hopen dat je erbij bent op onze bruiloft! Zou je vóór {datum} willen laten weten of je komt? Dat kan hier: {link}\n\nLiefs, {stel}";

/** RSVP-herinneringen sturen naar gasten die nog niet reageerden. */
export function GuestReminders({
  open,
  onClose,
  guests,
  wedding,
  linkFor,
}: {
  open: boolean;
  onClose: () => void;
  guests: Guest[];
  wedding: Wedding;
  linkFor: (g: Guest) => string;
}) {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const pending = guests.filter((g) => g.rsvp === "pending").sort((a, b) => a.name.localeCompare(b.name, "nl"));

  const fill = (g: Guest) =>
    text
      .replaceAll("{naam}", g.name.split(" ")[0])
      .replaceAll("{link}", linkFor(g))
      .replaceAll("{datum}", wedding.site.rsvp_deadline ? formatDate(wedding.site.rsvp_deadline) : "zo snel mogelijk")
      .replaceAll("{stel}", `${wedding.partner_one} & ${wedding.partner_two}`);

  const phone = (p: string) => p.replace(/[^\d+]/g, "").replace(/^\+/, "").replace(/^0(?=6)/, "31");
  const mark = (id: string) => setSent((s) => new Set(s).add(id));

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Herinnering sturen" description={`${pending.length} ${pending.length === 1 ? "gast heeft" : "gasten hebben"} nog niet gereageerd.`}>
      <Textarea
        label="Bericht"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        hint="{naam}, {link}, {datum} en {stel} worden per gast ingevuld."
      />
      <ul className="mt-5 divide-y divide-line rounded-2xl border border-line">
        {pending.map((g) => (
          <li key={g.id} className={cn("flex items-center gap-2 px-3 py-2", sent.has(g.id) && "bg-sage-50/60")}>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{g.name}</span>
              <span className="block truncate text-xs text-ink-500">{[g.phone, g.email].filter(Boolean).join(" · ") || "Geen contactgegevens"}</span>
            </span>
            {sent.has(g.id) && <Check className="size-4 text-sage-600" aria-label="Verstuurd" />}
            <a
              href={`https://wa.me/${g.phone ? phone(g.phone) : ""}?text=${encodeURIComponent(fill(g))}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => mark(g.id)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-sm font-medium hover:bg-rose-50"
              aria-label={`WhatsApp naar ${g.name}`}
            >
              <MessageCircle className="size-4 text-sage-600" aria-hidden /> <span className="hidden sm:inline">WhatsApp</span>
            </a>
            {g.email && (
              <a
                href={`mailto:${g.email}?subject=${encodeURIComponent(`Laat je weten of je komt? – ${wedding.partner_one} & ${wedding.partner_two}`)}&body=${encodeURIComponent(fill(g))}`}
                onClick={() => mark(g.id)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-sm font-medium hover:bg-rose-50"
                aria-label={`E-mail naar ${g.name}`}
              >
                <Mail className="size-4 text-rose-600" aria-hidden /> <span className="hidden sm:inline">E-mail</span>
              </a>
            )}
          </li>
        ))}
        {pending.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-500">Iedereen heeft gereageerd.</li>}
      </ul>
    </Modal>
  );
}
