"use client";

import { Copy, Crown, HeartHandshake, LogOut, Send, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { createPartnerInvite, getMembers, removeMember, type Member } from "@/lib/partner";
import { useWedding } from "@/lib/store";
import { SITE_URL } from "@/lib/supabase/config";

/** "Samen plannen": partner uitnodigen, leden beheren. Alleen in Supabase-modus. */
export function PartnerCard({ onRole }: { onRole?: (role: Member["role"] | null) => void }) {
  const { wedding, mode, reload } = useWedding();
  const toast = useToast();
  const router = useRouter();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Member | null>(null);

  const load = useCallback(async () => {
    if (!wedding || mode !== "supabase") return;
    try {
      const m = await getMembers(wedding.id);
      setMembers(m);
      onRole?.(m.find((x) => x.is_me)?.role ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden mislukt");
    }
  }, [wedding, mode, onRole]);

  useEffect(() => {
    void load();
  }, [load]);

  if (mode !== "supabase") {
    return (
      <section className="card p-6">
        <Header />
        <p className="mt-3 text-sm text-ink-500">Koppel Supabase om samen met je partner in dezelfde planning te werken.</p>
      </section>
    );
  }

  const me = members?.find((m) => m.is_me);
  const isOwner = me?.role === "owner";
  const full = (members?.length ?? 0) >= 2;
  const link = code ? `${SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")}/partner/${code}` : "";

  async function invite() {
    if (!wedding) return;
    setBusy(true);
    try {
      setCode(await createPartnerInvite(wedding.id));
    } catch (e) {
      toast.error("Uitnodigen mislukt", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: Member) {
    if (!wedding) return;
    try {
      await removeMember(wedding.id, m.user_id);
      setConfirm(null);
      if (m.is_me) {
        toast.info("Je hebt de planning verlaten");
        await reload();
        router.replace("/onboarding");
      } else {
        toast.info("Partner verwijderd");
        void load();
      }
    } catch (e) {
      toast.error("Verwijderen mislukt", e instanceof Error ? e.message : undefined);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Gekopieerd");
    } catch {
      toast.error("Kopiëren lukte niet");
    }
  }

  return (
    <section className="card p-6">
      <Header />
      <p className="mt-2 text-sm text-ink-500">Alleen jullie twee kunnen de planning bekijken en aanpassen. Gasten zien alleen hun uitnodiging.</p>

      {error ? (
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : !members ? (
        <div className="mt-4 space-y-2" aria-busy="true">
          <div className="shine h-12 rounded-xl bg-ivory" />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2">
              {m.role === "owner" ? <Crown className="size-4 shrink-0 text-gold-600" aria-hidden /> : <HeartHandshake className="size-4 shrink-0 text-rose-500" aria-hidden />}
              <span className="min-w-0 flex-1 truncate text-sm">{m.email}</span>
              {m.is_me && <Badge tone="rose">jij</Badge>}
              {(isOwner ? !m.is_me : m.is_me) && (
                <button
                  onClick={() => setConfirm(m)}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-700"
                  aria-label={m.is_me ? "Planning verlaten" : `${m.email} verwijderen`}
                >
                  {m.is_me ? <LogOut className="size-4" /> : <UserMinus className="size-4" />}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {members && isOwner && !full && (
        <div className="mt-4">
          {code ? (
            <div className="rounded-2xl bg-ivory p-4">
              <p className="text-sm text-ink-700">Stuur deze link naar je partner (14 dagen geldig, één keer te gebruiken):</p>
              <p className="mt-2 font-mono text-lg font-semibold tracking-wider text-rose-700">{code}</p>
              <p className="truncate text-xs text-ink-500">{link}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => copy(link)}>
                  <Copy className="size-4" aria-hidden /> Kopieer link
                </Button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Plan je mee aan onze bruiloft? ${link}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-medium hover:bg-rose-50"
                >
                  <Send className="size-4" aria-hidden /> WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={invite} loading={busy}>
              <HeartHandshake className="size-4" aria-hidden /> Nodig je partner uit
            </Button>
          )}
        </div>
      )}

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.is_me ? "Planning verlaten?" : "Partner verwijderen?"}
        description={
          confirm?.is_me
            ? "Je hebt daarna geen toegang meer tot deze planning, tenzij je opnieuw wordt uitgenodigd."
            : `${confirm?.email} kan de planning daarna niet meer bekijken of aanpassen.`
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Annuleren
            </Button>
            <Button onClick={() => confirm && remove(confirm)} className="bg-rose-700">
              {confirm?.is_me ? "Verlaten" : "Verwijderen"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-500">Dit kun je niet ongedaan maken.</p>
      </Modal>
    </section>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-full bg-rose-50 text-rose-600">
        <HeartHandshake className="size-5" aria-hidden />
      </span>
      <h2 className="text-xl font-semibold">Samen plannen</h2>
    </div>
  );
}
