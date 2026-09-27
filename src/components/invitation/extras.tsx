"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ExternalLink, Gift as GiftIcon, Heart, Loader2, PiggyBank, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { haptic } from "@/lib/pwa/haptics";
import type { InvitationData, PublicGift } from "@/lib/types";
import { cn, formatEuro } from "@/lib/utils";

const rpcError = (m?: string) => (m && !/^(invalid|P0001)/i.test(m) ? m : "Dat lukte niet. Probeer het opnieuw.");

/** Cadeaulijst op de uitnodiging. Met een persoonlijke token kan de gast reserveren. */
export function GiftSection({ gifts: initial, token }: { gifts: PublicGift[]; token?: string }) {
  const [gifts, setGifts] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const router = useRouter();
  const sb = getSupabaseBrowser();

  async function claim(g: PublicGift) {
    if (!sb || !token) return;
    const amount = g.kind === "fund" ? Number((amounts[g.id] ?? "").replace(",", ".")) : null;
    if (g.kind === "fund" && !(amount && amount > 0)) {
      setError("Vul een bedrag in.");
      return;
    }
    setBusy(g.id);
    setError("");
    const { error } = await sb.rpc("claim_gift", { p_token: token, p_gift: g.id, p_amount: amount });
    setBusy(null);
    if (error) return setError(rpcError(error.message));
    haptic([8, 40, 12]);
    setGifts((all) => all.map((x) => (x.id === g.id ? { ...x, mine: true, claimed: x.claimed + (g.kind === "item" ? 1 : 1), raised: x.raised + (amount ?? 0) } : x)));
    setAmounts((a) => ({ ...a, [g.id]: "" }));
    router.refresh();
  }

  async function unclaim(g: PublicGift) {
    if (!sb || !token) return;
    setBusy(g.id);
    const { error } = await sb.rpc("unclaim_gift", { p_token: token, p_gift: g.id });
    setBusy(null);
    if (error) return setError(rpcError(error.message));
    setGifts((all) => all.map((x) => (x.id === g.id ? { ...x, mine: false, claimed: Math.max(0, x.claimed - 1) } : x)));
    router.refresh();
  }

  return (
    <div>
      {!token && <p className="-mt-4 mb-6 text-center text-sm text-ink-500">Reserveren kan via je persoonlijke uitnodigingslink.</p>}
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-2 text-center text-sm text-rose-700">
          {error}
        </p>
      )}
      <ul className="grid grid-cols-1 gap-4 @xl:grid-cols-2">
        {gifts.map((g) => {
          const full = g.kind === "item" && g.claimed >= g.quantity && !g.mine;
          return (
            <li key={g.id} className={cn("card flex flex-col overflow-hidden", full && "opacity-60")}>
              <div className="relative grid h-32 place-items-center bg-gradient-to-br from-rose-50 to-gold-50">
                {g.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.image_url} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
                ) : g.kind === "fund" ? (
                  <PiggyBank className="size-9 text-rose-400" aria-hidden />
                ) : (
                  <GiftIcon className="size-9 text-rose-400" aria-hidden />
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-serif text-xl font-semibold">{g.title}</p>
                  {g.price !== null && g.kind === "item" && <span className="stat shrink-0 text-sm text-ink-700">{formatEuro(g.price)}</span>}
                </div>
                {g.description && <p className="mt-1 text-sm text-ink-700">{g.description}</p>}
                {g.kind === "fund" && g.price ? (
                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-ivory-deep">
                      <div className="h-full rounded-full bg-gold-500" style={{ width: `${Math.min(100, (g.raised / g.price) * 100)}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                      {formatEuro(g.raised)} van {formatEuro(g.price)}
                    </p>
                  </div>
                ) : null}
                <div className="mt-auto pt-4">
                  {g.mine ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-700">
                        <Check className="size-4" aria-hidden /> {g.kind === "fund" ? "Dank je voor je bijdrage!" : "Jij geeft dit cadeau"}
                      </span>
                      {token && (
                        <button onClick={() => unclaim(g)} disabled={busy === g.id} className="min-h-9 text-sm text-ink-500 underline-offset-2 hover:underline">
                          {g.kind === "fund" ? "Intrekken" : "Annuleren"}
                        </button>
                      )}
                    </div>
                  ) : full ? (
                    <p className="text-sm text-ink-500">Al gereserveerd</p>
                  ) : token ? (
                    g.kind === "fund" ? (
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void claim(g);
                        }}
                      >
                        <label htmlFor={`amt-${g.id}`} className="sr-only">
                          Bedrag voor {g.title}
                        </label>
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-500">€</span>
                          <input
                            id={`amt-${g.id}`}
                            inputMode="decimal"
                            className="field pl-8"
                            placeholder="50"
                            value={amounts[g.id] ?? ""}
                            onChange={(e) => setAmounts({ ...amounts, [g.id]: e.target.value.replace(/[^\d,.]/g, "") })}
                          />
                        </div>
                        <button type="submit" disabled={busy === g.id} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700">
                          {busy === g.id ? <Loader2 className="size-4 animate-spin" /> : <Heart className="size-4" aria-hidden />} Bijdragen
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => claim(g)}
                        disabled={busy === g.id}
                        className="inline-flex h-11 items-center gap-1.5 rounded-full bg-rose-600 px-5 text-sm font-medium text-white hover:bg-rose-700"
                      >
                        {busy === g.id ? <Loader2 className="size-4 animate-spin" /> : <GiftIcon className="size-4" aria-hidden />} Ik geef dit
                      </button>
                    )
                  ) : g.kind === "item" ? (
                    <p className="text-sm text-ink-500">{g.quantity - g.claimed} beschikbaar</p>
                  ) : null}
                  {g.url && (
                    <a href={g.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm text-rose-700 hover:underline">
                      Bekijk in winkel <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Gastenboek: felicitaties achterlaten (met persoonlijke token) en lezen. */
export function GuestbookSection({ entries: initial, token, guestName }: { entries: NonNullable<InvitationData["guestbook"]>; token?: string; guestName?: string }) {
  const [entries, setEntries] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sb = getSupabaseBrowser();

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!sb || !token || !message.trim()) return;
    setBusy(true);
    setError("");
    const { error } = await sb.rpc("add_guestbook_entry", { p_token: token, p_message: message.trim() });
    setBusy(false);
    if (error) return setError(rpcError(error.message));
    haptic([8, 40, 12]);
    setEntries([{ name: guestName ?? "Jij", message: message.trim(), created_at: new Date().toISOString() }, ...entries]);
    setMessage("");
  }

  return (
    <div className="mx-auto max-w-2xl">
      {token && (
        <form onSubmit={post} className="card p-5">
          <label htmlFor="gb-msg" className="label">
            Jouw felicitatie of lieve woorden
          </label>
          <textarea id="gb-msg" className="field min-h-24 resize-y" maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Wat een feest wordt dit…" />
          {error && (
            <p role="alert" className="mt-2 text-sm text-rose-700">
              {error}
            </p>
          )}
          <div className="mt-3 flex justify-end">
            <button type="submit" disabled={busy || !message.trim()} className="inline-flex h-11 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" aria-hidden />} Plaatsen
            </button>
          </div>
        </form>
      )}
      <ul className="mt-6 space-y-3">
        <AnimatePresence initial={false}>
          {entries.map((e, i) => (
            <motion.li key={`${e.created_at}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
              <p className="leading-relaxed whitespace-pre-line text-ink-700 [overflow-wrap:anywhere]">{e.message}</p>
              <p className="mt-2 font-script text-2xl text-rose-700">— {e.name.split(" ")[0]}</p>
            </motion.li>
          ))}
        </AnimatePresence>
        {entries.length === 0 && <li className="text-center text-sm text-ink-500">{token ? "Wees de eerste die een berichtje achterlaat!" : "Nog geen berichten."}</li>}
      </ul>
    </div>
  );
}
