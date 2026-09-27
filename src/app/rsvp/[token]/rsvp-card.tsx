"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Heart, MapPin, PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";
import { RingsMark } from "@/components/decor/logo";
import { Petals } from "@/components/decor/petals";
import { Button } from "@/components/ui/button";
import { Input, Toggle } from "@/components/ui/field";
import { Spinner } from "@/components/ui/misc";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";

interface Info {
  guest_name: string;
  rsvp: "pending" | "attending" | "declined";
  plus_one: boolean;
  dietary: string;
  invited_to: "day" | "evening";
  partner_one: string;
  partner_two: string;
  wedding_date: string | null;
  venue: string;
  city: string;
}

export function RsvpCard({ token }: { token: string }) {
  const sb = getSupabaseBrowser();
  const [info, setInfo] = useState<Info | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notfound" | "done">("loading");
  const [choice, setChoice] = useState<"attending" | "declined" | null>(null);
  const [plusOne, setPlusOne] = useState(false);
  const [dietary, setDietary] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sb) {
      setState("notfound");
      return;
    }
    sb.rpc("get_rsvp", { p_token: token }).then(({ data, error }) => {
      const row = (data as Info[] | null)?.[0];
      if (error || !row) return setState("notfound");
      setInfo(row);
      setPlusOne(row.plus_one);
      setDietary(row.dietary);
      if (row.rsvp !== "pending") setChoice(row.rsvp);
      setState("ready");
    });
  }, [sb, token]);

  async function submit() {
    if (!sb || !choice) return;
    setSaving(true);
    setError("");
    const { error } = await sb.rpc("submit_rsvp", {
      p_token: token,
      p_rsvp: choice,
      p_plus_one: choice === "attending" && plusOne,
      p_dietary: choice === "attending" ? dietary : "",
    });
    setSaving(false);
    if (error) setError("Opslaan lukte niet. Probeer het later opnieuw.");
    else setState("done");
  }

  if (state === "loading") return <Spinner label="Uitnodiging openen…" />;

  return (
    <main className="paper relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <Petals count={16} />
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg rounded-[2rem] border border-gold-200 bg-white/90 p-8 text-center shadow-[var(--shadow-lift)] backdrop-blur sm:p-12"
      >
        <div className="pointer-events-none absolute inset-3 rounded-[1.5rem] border border-gold-100" aria-hidden />
        <RingsMark className="mx-auto size-12" />

        {state === "notfound" || !info ? (
          <>
            <h1 className="mt-6 text-3xl font-semibold">Uitnodiging niet gevonden</h1>
            <p className="mt-2 text-ink-500">Controleer of je de volledige link hebt gebruikt, of neem contact op met het bruidspaar.</p>
          </>
        ) : (
          <AnimatePresence mode="wait">
            {state === "done" ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} className="mx-auto mt-6 grid size-16 place-items-center rounded-full bg-rose-50">
                  {choice === "attending" ? <PartyPopper className="size-8 text-rose-600" aria-hidden /> : <Heart className="size-8 text-rose-400" aria-hidden />}
                </motion.div>
                <h1 className="mt-5 text-3xl font-semibold">{choice === "attending" ? "Wat fijn dat je erbij bent!" : "Jammer, we zullen je missen"}</h1>
                <p className="mt-2 text-ink-500">Je antwoord is doorgegeven aan {info.partner_one} & {info.partner_two}.</p>
                <button onClick={() => setState("ready")} className="mt-6 text-sm font-medium text-rose-700 hover:underline">
                  Antwoord wijzigen
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="mt-6 text-ink-500">Lieve {info.guest_name.split(" ")[0]},</p>
                <p className="mt-1 text-ink-700">je bent van harte uitgenodigd als {info.invited_to === "evening" ? "avondgast" : "daggast"} op de bruiloft van</p>
                <h1 className="mt-3 font-script text-5xl leading-tight text-rose-700 sm:text-6xl">
                  {info.partner_one} & {info.partner_two}
                </h1>
                <div className="mt-4 flex flex-col items-center gap-1 text-sm text-ink-700">
                  {info.wedding_date && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4 text-gold-600" aria-hidden />
                      {formatDate(info.wedding_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
                  {(info.venue || info.city) && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4 text-gold-600" aria-hidden />
                      {[info.venue, info.city].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>

                <fieldset className="mt-8">
                  <legend className="mb-3 font-serif text-xl font-semibold">Ben je erbij?</legend>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ["attending", "Ja, ik kom!"],
                        ["declined", "Helaas niet"],
                      ] as const
                    ).map(([v, l]) => (
                      <button
                        key={v}
                        onClick={() => setChoice(v)}
                        aria-pressed={choice === v}
                        className={cn(
                          "min-h-13 rounded-2xl border px-4 font-medium transition-all duration-200",
                          choice === v
                            ? v === "attending"
                              ? "border-rose-500 bg-rose-600 text-white shadow-[var(--shadow-glow)]"
                              : "border-ink-500 bg-ink-700 text-white"
                            : "border-line bg-white hover:border-rose-200",
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <AnimatePresence>
                  {choice === "attending" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden text-left">
                      <div className="space-y-2 pt-6">
                        <Input label="Dieetwensen of allergieën" placeholder="Bijv. vegetarisch, notenallergie" value={dietary} onChange={(e) => setDietary(e.target.value)} maxLength={500} />
                        <Toggle checked={plusOne} onChange={setPlusOne} label="Ik neem iemand mee" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
                <Button onClick={submit} disabled={!choice} loading={saving} size="lg" className="mt-8 w-full">
                  Antwoord versturen
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </main>
  );
}
