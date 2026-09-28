"use client";

import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/ui/toast";
import { aiText, useAiEnabled } from "@/lib/ai";
import { useWedding } from "@/lib/store";
import { coupleName, formatDate, parseDate } from "@/lib/utils";

/** Telt op naar een waarde wanneer zichtbaar. */
export function CountUp({ value, format = (n: number) => String(Math.round(n)) }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  const from = useRef(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(from.current, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(display)}
    </span>
  );
}

/** Live aftellen tot de trouwdag. */
export function Countdown({ date, time }: { date: string | null; time: string | null }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const d = parseDate(date);
  if (!d) return <p className="text-ink-500">Kies een datum in Instellingen om het aftellen te starten.</p>;
  const [h, m] = (time || "00:00").split(":").map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  const diff = Math.max(0, d.getTime() - (now ?? d.getTime()));
  const parts = [
    { v: Math.floor(diff / 86_400_000), l: "dagen" },
    { v: Math.floor((diff / 3_600_000) % 24), l: "uur" },
    { v: Math.floor((diff / 60_000) % 60), l: "min" },
    { v: Math.floor((diff / 1000) % 60), l: "sec" },
  ];

  return (
    <div className="grid max-w-md grid-cols-4 gap-2 sm:gap-3" role="timer" aria-label={`Nog ${parts[0].v} dagen tot de bruiloft`}>
      {parts.map((p) => (
        <div key={p.l} className="min-w-0 rounded-2xl bg-white/80 px-1 py-2.5 text-center ring-1 ring-white sm:px-3">
          <div className="stat relative h-8 overflow-hidden text-2xl leading-8 text-ink-900 sm:h-10 sm:text-3xl sm:leading-10">
            <motion.span
              key={now === null ? "x" : p.v}
              initial={{ y: "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="block tabular-nums"
            >
              {now === null ? "–" : p.v}
            </motion.span>
          </div>
          <div className="truncate text-[10px] tracking-wider text-ink-500 uppercase sm:text-[11px]">{p.l}</div>
        </div>
      ))}
    </div>
  );
}

const QUICK = [
  "Wat moeten we deze maand regelen?",
  "Tips om binnen budget te blijven?",
  "Hoe regelen we de ondertrouw?",
];

/** Vraag-het-Flora: kleine AI-coach op het dashboard. */
export function AiCoach() {
  const enabled = useAiEnabled();
  const { wedding, tasks, guests } = useWedding();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    if (!question.trim() || !wedding) return;
    setLoading(true);
    setAnswer("");
    try {
      const done = tasks.filter((t) => t.done).length;
      const open = tasks.filter((t) => !t.done).slice(0, 8).map((t) => t.title).join(", ");
      const res = await aiText("coach", {
        question,
        couple: coupleName(wedding.partner_one, wedding.partner_two),
        date: formatDate(wedding.wedding_date),
        venue: wedding.venue,
        city: wedding.city,
        style: wedding.style,
        guests: guests.length || wedding.guest_estimate,
        budget: wedding.budget_total,
        progress: `${done}/${tasks.length} taken klaar. Open: ${open}`,
      });
      setAnswer(res.text ?? "");
    } catch (e) {
      toast.error("Flora is even niet bereikbaar", e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void ask(q);
  }

  return (
    <div className="card relative overflow-hidden p-6">
      <div className="absolute -top-16 -right-16 size-48 rounded-full bg-gold-100 blur-2xl" aria-hidden />
      <div className="relative flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-rose-300 text-white shadow-sm">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-2xl font-semibold">Vraag het Flora</h2>
          <p className="text-sm text-ink-500">Jullie AI-weddingcoach</p>
        </div>
      </div>

      {enabled === false ? (
        <p className="relative mt-4 rounded-xl bg-ivory px-4 py-3 text-sm text-ink-500">
          Voeg <code className="rounded bg-white px-1">FAL_KEY</code> toe aan je omgevingsvariabelen om de AI-coach te activeren.
        </p>
      ) : (
        <>
          <form onSubmit={submit} className="relative mt-4 flex gap-2">
            <label htmlFor="coach-q" className="sr-only">
              Stel een vraag
            </label>
            <input
              id="coach-q"
              className="field"
              placeholder="Stel een vraag over jullie bruiloft…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={loading || !q.trim()}
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-600 text-white transition hover:bg-rose-700 disabled:opacity-40"
              aria-label="Vraag versturen"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>
          <div className="relative mt-3 flex flex-wrap gap-2">
            {QUICK.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQ(s);
                  void ask(s);
                }}
                disabled={loading}
                className="min-h-9 rounded-full border border-line bg-white px-3 text-xs text-ink-700 transition hover:border-rose-200 hover:text-rose-700"
              >
                {s}
              </button>
            ))}
          </div>
          <div aria-live="polite">
            {loading && (
              <div className="relative mt-4 space-y-2">
                {[90, 75, 60].map((w) => (
                  <div key={w} className="shine h-3 rounded-full bg-rose-50" style={{ width: `${w}%` }} />
                ))}
              </div>
            )}
            {answer && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mt-4 rounded-2xl bg-ivory px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line text-ink-700"
              >
                {answer.replace(/\*\*/g, "")}
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
