"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, PartyPopper } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Toggle } from "@/components/ui/field";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { haptic } from "@/lib/pwa/haptics";
import type { InvitationData, RsvpQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

type Guest = NonNullable<InvitationData["guest"]>;

export function RsvpForm({
  token,
  guest,
  couple,
  meals = [],
  questions = [],
}: {
  token: string;
  guest: Guest;
  couple: string;
  meals?: string[];
  questions?: RsvpQuestion[];
}) {
  const sb = getSupabaseBrowser();
  const answered = guest.rsvp !== "pending";
  const [choice, setChoice] = useState<"attending" | "declined" | null>(answered ? (guest.rsvp as "attending" | "declined") : null);
  const [plusOne, setPlusOne] = useState(guest.plus_one);
  const [dietary, setDietary] = useState(guest.dietary);
  const [meal, setMeal] = useState(guest.meal ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>(guest.answers ?? {});
  const needsMeal = meals.length > 0;
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!sb || !choice) return;
    setSaving(true);
    setError("");
    const attending = choice === "attending";
    const clean = Object.fromEntries(
      questions.filter((q) => (answers[q.id] ?? "").trim()).map((q) => [q.id, answers[q.id].trim().slice(0, 500)]),
    );
    let { error } = await sb.rpc("submit_rsvp_v2", {
      p_token: token,
      p_rsvp: choice,
      p_plus_one: attending && plusOne,
      p_dietary: attending ? dietary : "",
      p_meal: attending ? meal : "",
      p_answers: attending ? clean : {},
    });
    // Nieuwe functie nog niet in de database? Dan de basis-RSVP gebruiken.
    if (error && (error.code === "PGRST202" || /could not find the function/i.test(error.message))) {
      ({ error } = await sb.rpc("submit_rsvp", {
        p_token: token,
        p_rsvp: choice,
        p_plus_one: attending && plusOne,
        p_dietary: attending ? dietary : "",
      }));
    }
    setSaving(false);
    if (error) setError("Opslaan lukte niet. Probeer het later opnieuw.");
    else {
      haptic([10, 50, 15]);
      setDone(true);
    }
  }

  return (
    <div className="card mx-auto max-w-lg p-6 sm:p-10">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center" role="status">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="mx-auto grid size-16 place-items-center rounded-full bg-rose-50"
            >
              {choice === "attending" ? <PartyPopper className="size-8 text-rose-600" aria-hidden /> : <Heart className="size-8 text-rose-400" aria-hidden />}
            </motion.div>
            <h3 className="mt-5 text-3xl font-semibold">{choice === "attending" ? "Wat fijn dat je erbij bent!" : "Jammer, we zullen je missen"}</h3>
            <p className="mt-2 text-ink-500">Je antwoord is doorgegeven aan {couple}.</p>
            <button onClick={() => setDone(false)} className="mt-6 min-h-11 text-sm font-medium text-rose-700 hover:underline">
              Antwoord wijzigen
            </button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {answered && (
              <p className="mb-5 rounded-xl bg-sage-50 px-4 py-2.5 text-center text-sm text-sage-700">
                Je hebt al gereageerd. Je kunt je antwoord hieronder aanpassen.
              </p>
            )}
            <fieldset>
              <legend className="sr-only">Kom je?</legend>
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
                      "min-h-14 rounded-2xl border px-3 font-medium transition-all duration-200",
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
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="space-y-4 pt-6">
                    {needsMeal && (
                      <fieldset>
                        <legend className="label">Wat wil je eten?</legend>
                        <div className="flex flex-wrap gap-2">
                          {meals.map((m) => (
                            <button
                              key={m}
                              type="button"
                              aria-pressed={meal === m}
                              onClick={() => setMeal(m)}
                              className={cn(
                                "min-h-11 rounded-full border px-4 text-sm transition",
                                meal === m ? "border-rose-500 bg-rose-600 font-medium text-white" : "border-line bg-white hover:border-rose-200",
                              )}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}
                    <Input label="Dieetwensen of allergieën" placeholder="Bijv. notenallergie" value={dietary} onChange={(e) => setDietary(e.target.value)} maxLength={500} />
                    {questions.map((q) =>
                      q.type === "choice" ? (
                        <fieldset key={q.id}>
                          <legend className="label">{q.label}</legend>
                          <div className="flex flex-wrap gap-2">
                            {q.options.map((o) => (
                              <button
                                key={o}
                                type="button"
                                aria-pressed={answers[q.id] === o}
                                onClick={() => setAnswers({ ...answers, [q.id]: o })}
                                className={cn(
                                  "min-h-11 rounded-full border px-4 text-sm transition",
                                  answers[q.id] === o ? "border-rose-500 bg-rose-600 font-medium text-white" : "border-line bg-white hover:border-rose-200",
                                )}
                              >
                                {o}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                      ) : (
                        <Input key={q.id} label={q.label} value={answers[q.id] ?? ""} maxLength={500} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                      ),
                    )}
                    <Toggle checked={plusOne} onChange={setPlusOne} label="Ik neem iemand mee" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p role="alert" className="mt-4 text-sm text-rose-700">
                {error}
              </p>
            )}
            {choice === "attending" && needsMeal && !meal && <p className="mt-6 text-center text-sm text-ink-500">Kies nog je menu.</p>}
            <Button onClick={submit} disabled={!choice || (choice === "attending" && needsMeal && !meal)} loading={saving} size="lg" className="mt-4 w-full">
              Antwoord versturen
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
