"use client";

import { Plus, Trash2, Utensils, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RsvpQuestion } from "@/lib/types";
import { uid } from "@/lib/utils";

const MEAL_SUGGESTIONS = ["Vlees", "Vis", "Vegetarisch", "Vegan", "Kindermenu"];
const QUESTION_SUGGESTIONS: Omit<RsvpQuestion, "id">[] = [
  { label: "Welk nummer mag de DJ zeker niet vergeten?", type: "text", options: [] },
  { label: "Blijf je overnachten?", type: "choice", options: ["Ja", "Nee", "Weet ik nog niet"] },
  { label: "Hoe kom je naar de locatie?", type: "choice", options: ["Auto", "Openbaar vervoer", "Taxi", "Anders"] },
  { label: "Heb je een tip of wens voor ons?", type: "text", options: [] },
];

/** Menukeuze en eigen vragen die gasten bij hun RSVP beantwoorden. */
export function RsvpSettings({
  meals,
  questions,
  onMeals,
  onQuestions,
}: {
  meals: string[];
  questions: RsvpQuestion[];
  onMeals: (m: string[]) => void;
  onQuestions: (q: RsvpQuestion[]) => void;
}) {
  const [meal, setMeal] = useState("");

  function addMeal(m: string) {
    const v = m.trim().slice(0, 40);
    if (!v || meals.some((x) => x.toLowerCase() === v.toLowerCase()) || meals.length >= 8) return;
    onMeals([...meals, v]);
    setMeal("");
  }
  const updateQ = (id: string, patch: Partial<RsvpQuestion>) => onQuestions(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  return (
    <section className="card p-6">
      <h2 className="text-2xl font-semibold">RSVP-vragen</h2>
      <p className="mt-1 text-sm text-ink-500">Gasten beantwoorden dit samen met hun RSVP. Antwoorden zie je bij Gasten en in de Excel-export.</p>

      <p className="label mt-5 flex items-center gap-2">
        <Utensils className="size-4 text-gold-600" aria-hidden /> Menukeuze
      </p>
      <div className="flex flex-wrap gap-2">
        {meals.map((m) => (
          <span key={m} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-rose-50 py-1 pr-1 pl-3 text-sm text-rose-800 ring-1 ring-rose-100">
            {m}
            <button type="button" onClick={() => onMeals(meals.filter((x) => x !== m))} className="grid size-7 place-items-center rounded-full hover:bg-white" aria-label={`${m} verwijderen`}>
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        {meals.length === 0 && <span className="text-sm text-ink-500">Geen menukeuze: gasten kunnen alleen dieetwensen opgeven.</span>}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addMeal(meal);
        }}
      >
        <label htmlFor="meal-new" className="sr-only">
          Menu-optie toevoegen
        </label>
        <input id="meal-new" className="field" placeholder="Bijv. Vis" value={meal} onChange={(e) => setMeal(e.target.value)} maxLength={40} />
        <Button type="submit" variant="secondary" disabled={!meal.trim()}>
          Toevoegen
        </Button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {MEAL_SUGGESTIONS.filter((m) => !meals.includes(m)).map((m) => (
          <button key={m} type="button" onClick={() => addMeal(m)} className="min-h-8 rounded-full bg-ivory-deep px-3 text-xs text-ink-700 hover:bg-rose-50">
            + {m}
          </button>
        ))}
      </div>

      <p className="label mt-6">Eigen vragen</p>
      <ul className="space-y-3">
        {questions.map((q, i) => (
          <li key={q.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start gap-2">
              <div className="grid min-w-0 flex-1 gap-3">
                <div>
                  <label htmlFor={`q-${q.id}`} className="label">
                    Vraag {i + 1}
                  </label>
                  <input id={`q-${q.id}`} className="field" value={q.label} maxLength={140} onChange={(e) => updateQ(q.id, { label: e.target.value })} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-ink-500">Antwoord:</span>
                  {(["text", "choice"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={q.type === t}
                      onClick={() => updateQ(q.id, { type: t, options: t === "choice" && q.options.length === 0 ? ["Ja", "Nee"] : q.options })}
                      className={q.type === t ? "min-h-8 rounded-full bg-rose-600 px-3 text-white" : "min-h-8 rounded-full bg-ivory-deep px-3 text-ink-700"}
                    >
                      {t === "text" ? "Vrije tekst" : "Meerkeuze"}
                    </button>
                  ))}
                </div>
                {q.type === "choice" && (
                  <div>
                    <label htmlFor={`qo-${q.id}`} className="label">
                      Keuzes (gescheiden door komma&apos;s)
                    </label>
                    <input
                      id={`qo-${q.id}`}
                      className="field"
                      defaultValue={q.options.join(", ")}
                      onBlur={(e) => updateQ(q.id, { options: [...new Set(e.target.value.split(",").map((o) => o.trim()).filter(Boolean))].slice(0, 10) })}
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onQuestions(questions.filter((x) => x.id !== q.id))}
                className="mt-7 grid size-10 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-700"
                aria-label={`Vraag ${i + 1} verwijderen`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={questions.length >= 8}
          onClick={() => onQuestions([...questions, { id: uid().slice(0, 8), label: "", type: "text", options: [] }])}
        >
          <Plus className="size-4" aria-hidden /> Eigen RSVP-vraag
        </Button>
        {QUESTION_SUGGESTIONS.filter((s) => !questions.some((q) => q.label === s.label)).map((s) => (
          <button
            key={s.label}
            type="button"
            disabled={questions.length >= 8}
            onClick={() => onQuestions([...questions, { ...s, id: uid().slice(0, 8) }])}
            className="min-h-9 rounded-full bg-ivory-deep px-3 text-xs text-ink-700 hover:bg-rose-50 disabled:opacity-40"
          >
            + {s.label}
          </button>
        ))}
      </div>
    </section>
  );
}
