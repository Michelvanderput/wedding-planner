"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, HardDriveUpload, Heart, HeartHandshake, PartyPopper } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadError } from "@/components/dashboard/load-error";
import { Logo } from "@/components/decor/logo";
import { Petals } from "@/components/decor/petals";
import { Button } from "@/components/ui/button";
import { Input, Toggle } from "@/components/ui/field";
import { Spinner } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { WEDDING_STYLES, buildBudget, buildChecklist, buildDemo, buildTimeline } from "@/lib/defaults";
import { clearLocalSnapshot, readLocalSnapshot, type Snapshot } from "@/lib/data/local-adapter";
import { useWedding } from "@/lib/store";
import { defaultSite, type Wedding } from "@/lib/types";
import { cn, formatEuro, nowIso, uid } from "@/lib/utils";

const STEPS = ["Jullie", "Datum", "Budget", "Stijl", "Klaar"];

export default function OnboardingPage() {
  const { status, mode, createWedding } = useWedding();
  const [local, setLocal] = useState<Snapshot | null>(null);
  const [importing, setImporting] = useState(false);
  const [partnerCode, setPartnerCode] = useState("");
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [demo, setDemo] = useState(false);
  const [unknownDate, setUnknownDate] = useState(false);
  const [form, setForm] = useState({
    partner_one: "",
    partner_two: "",
    wedding_date: "",
    ceremony_time: "14:00",
    venue: "",
    city: "",
    budget_total: 25000,
    guest_estimate: 100,
    style: "Romantisch",
  });

  useEffect(() => {
    if (mode !== "supabase") return;
    const snap = readLocalSnapshot();
    if (snap.wedding) setLocal(snap);
  }, [mode]);

  async function importLocal() {
    if (!local?.wedding) return;
    setImporting(true);
    try {
      await createWedding(local.wedding, local.collections);
      clearLocalSnapshot();
      toast.success("Planning geïmporteerd", "Alles staat nu veilig in jullie account.");
      router.replace("/dashboard");
    } catch (e) {
      toast.error("Importeren mislukt", e instanceof Error ? e.message : undefined);
      setImporting(false);
    }
  }

  useEffect(() => {
    if (status === "ready") router.replace("/dashboard");
    if (status === "unauthenticated") router.replace("/login?next=/onboarding");
  }, [status, router]);

  if (status === "error") return <LoadError />;
  if (status === "loading" || status === "ready") return <Spinner />;

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const canNext = step !== 0 || (form.partner_one.trim() && form.partner_two.trim());
  const go = (d: number) => {
    setDir(d);
    setStep((s) => Math.max(0, Math.min(STEPS.length - 1, s + d)));
  };

  async function finish() {
    setSaving(true);
    const style = WEDDING_STYLES.find((s) => s.value === form.style);
    const wedding: Wedding = {
      id: uid(),
      created_at: nowIso(),
      partner_one: form.partner_one.trim(),
      partner_two: form.partner_two.trim(),
      wedding_date: unknownDate || !form.wedding_date ? null : form.wedding_date,
      ceremony_time: form.ceremony_time || null,
      venue: form.venue.trim(),
      city: form.city.trim(),
      budget_total: Number(form.budget_total) || 0,
      guest_estimate: Number(form.guest_estimate) || 0,
      style: form.style,
      color_palette: style?.colors ?? [],
      public_slug: null,
      site: defaultSite(),
    };
    try {
      await createWedding(wedding, {
        tasks: buildChecklist(wedding),
        budget_items: buildBudget(wedding),
        timeline_events: buildTimeline(wedding),
        ...(demo ? buildDemo(wedding) : {}),
      });
      toast.success("Jullie plan staat klaar!", "Veel plezier met plannen.");
      router.replace("/dashboard");
    } catch (e) {
      toast.error("Aanmaken mislukt", e instanceof Error ? e.message : undefined);
      setSaving(false);
    }
  }

  return (
    <main className="paper relative flex min-h-dvh flex-col">
      <Petals count={8} />
      <header className="relative mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
        <Logo />
        <span className="text-sm text-ink-500">
          Stap {step + 1} van {STEPS.length}
        </span>
      </header>

      {/* Voortgang */}
      <div className="relative mx-auto w-full max-w-3xl px-4 sm:px-6">
        <ol className="flex items-center gap-2" aria-label="Voortgang">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col gap-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-rose-100">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-gold-400"
                  initial={false}
                  animate={{ width: i <= step ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className={cn("hidden text-xs sm:block", i === step ? "font-medium text-rose-700" : "text-ink-500")}>
                {s}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6">
        {local?.wedding && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col gap-3 rounded-2xl border border-gold-200 bg-gold-50 p-4 sm:flex-row sm:items-center">
            <HardDriveUpload className="size-6 shrink-0 text-gold-600" aria-hidden />
            <p className="flex-1 text-sm text-ink-700">
              We vonden een bestaande planning in deze browser
              {local.wedding.partner_one ? ` (${local.wedding.partner_one} & ${local.wedding.partner_two})` : ""}. Wil je die naar je account overzetten?
            </p>
            <Button size="sm" variant="gold" onClick={importLocal} loading={importing}>
              Importeren
            </Button>
          </motion.div>
        )}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.section
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40, transition: { duration: 0.18 } }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="card flex-1 p-6 sm:p-10"
          >
            {step === 0 && (
              <>
                <p className="font-script text-3xl text-gold-600">Gefeliciteerd!</p>
                <h1 className="text-4xl font-semibold sm:text-5xl">Wie gaan er trouwen?</h1>
                <p className="mt-2 text-ink-500">We maken een persoonlijk plan op basis van jullie antwoorden.</p>
                <div className="mt-8 grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
                  <Input label="Partner 1" placeholder="Emma" value={form.partner_one} onChange={(e) => set("partner_one", e.target.value)} autoFocus />
                  <Heart className="mx-auto mb-3 hidden size-6 fill-rose-300 text-rose-400 sm:block" aria-hidden />
                  <Input label="Partner 2" placeholder="Lucas" value={form.partner_two} onChange={(e) => set("partner_two", e.target.value)} />
                </div>
                {mode === "supabase" && (
                  <details className="group mt-8 rounded-2xl border border-line bg-ivory/60 p-4">
                    <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 text-sm font-medium text-ink-700">
                      <HeartHandshake className="size-4 text-rose-500" aria-hidden />
                      Heeft je partner de planning al aangemaakt? Voer de uitnodigingscode in
                    </summary>
                    <form
                      className="mt-3 flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (partnerCode.trim()) router.push(`/partner/${encodeURIComponent(partnerCode.trim())}`);
                      }}
                    >
                      <label htmlFor="partner-code" className="sr-only">Uitnodigingscode</label>
                      <input
                        id="partner-code"
                        className="field uppercase"
                        placeholder="Bijv. 1F24FCCD8B"
                        value={partnerCode}
                        onChange={(e) => setPartnerCode(e.target.value)}
                        autoComplete="off"
                      />
                      <Button type="submit" variant="secondary" disabled={!partnerCode.trim()}>Koppelen</Button>
                    </form>
                  </details>
                )}
                {form.partner_one && form.partner_two && (
                  <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-10 px-2 text-center font-script text-[clamp(2.25rem,11vw,3rem)] leading-tight text-rose-600">
                    {form.partner_one} & {form.partner_two}
                  </motion.p>
                )}
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="text-4xl font-semibold sm:text-5xl">Wanneer & waar?</h1>
                <p className="mt-2 text-ink-500">De takenlijst rekent terug vanaf deze datum. Nog niet bekend? Geen probleem.</p>
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Trouwdatum" type="date" value={form.wedding_date} disabled={unknownDate} onChange={(e) => set("wedding_date", e.target.value)} />
                  <Input label="Tijd ceremonie" type="time" value={form.ceremony_time} onChange={(e) => set("ceremony_time", e.target.value)} />
                  <Input label="Locatie" placeholder="Bijv. Landgoed De Hoeve" value={form.venue} onChange={(e) => set("venue", e.target.value)} />
                  <Input label="Plaats" placeholder="Bijv. Utrecht" value={form.city} onChange={(e) => set("city", e.target.value)} />
                </div>
                <div className="mt-4">
                  <Toggle checked={unknownDate} onChange={setUnknownDate} label="We hebben nog geen datum" />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-4xl font-semibold sm:text-5xl">Budget & gasten</h1>
                <p className="mt-2 text-ink-500">Een schatting is prima – je kunt dit altijd aanpassen.</p>
                <div className="mt-10 space-y-10">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="budget" className="label">Totaalbudget</label>
                      <span className="stat text-3xl text-rose-700">{formatEuro(form.budget_total)}</span>
                    </div>
                    <input
                      id="budget"
                      type="range"
                      min={2000}
                      max={100000}
                      step={500}
                      value={form.budget_total}
                      onChange={(e) => set("budget_total", Number(e.target.value))}
                      className="mt-3 w-full accent-rose-600"
                    />
                    <div className="mt-1 flex justify-between text-xs text-ink-500">
                      <span>€ 2.000</span>
                      <span>€ 100.000</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="guests" className="label">Aantal gasten</label>
                      <span className="stat text-3xl text-rose-700">{form.guest_estimate}</span>
                    </div>
                    <input
                      id="guests"
                      type="range"
                      min={2}
                      max={400}
                      value={form.guest_estimate}
                      onChange={(e) => set("guest_estimate", Number(e.target.value))}
                      className="mt-3 w-full accent-rose-600"
                    />
                    <p className="mt-3 text-sm text-ink-500">
                      Dat is ongeveer <strong className="text-ink-900">{formatEuro(form.budget_total / Math.max(1, form.guest_estimate))}</strong> per gast.
                    </p>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-4xl font-semibold sm:text-5xl">Welke sfeer past bij jullie?</h1>
                <p className="mt-2 text-ink-500">Dit gebruiken we voor jullie moodboard en AI-suggesties.</p>
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Stijl">
                  {WEDDING_STYLES.map((s) => {
                    const active = form.style === s.value;
                    return (
                      <button
                        key={s.value}
                        role="radio"
                        aria-checked={active}
                        onClick={() => set("style", s.value)}
                        className={cn(
                          "relative flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200",
                          active ? "border-rose-400 bg-rose-50 shadow-[var(--shadow-soft)]" : "border-line bg-white hover:border-rose-200",
                        )}
                      >
                        <div className="flex -space-x-2">
                          {s.colors.map((c) => (
                            <span key={c} className="size-8 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />
                          ))}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-ink-900">{s.value}</p>
                          <p className="text-sm text-ink-500">{s.hint}</p>
                        </div>
                        {active && (
                          <motion.span layoutId="style-check" className="absolute top-3 right-3 grid size-6 place-items-center rounded-full bg-rose-600 text-white">
                            <Check className="size-3.5" aria-hidden />
                          </motion.span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 4 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12 }}
                  className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-rose-100 to-gold-100"
                >
                  <PartyPopper className="size-9 text-rose-600" aria-hidden />
                </motion.div>
                <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">Alles staat klaar!</h1>
                <p className="mt-3 max-w-md text-ink-500">
                  We maken een complete takenlijst, een budgetverdeling van {formatEuro(form.budget_total)} en een
                  eerste draaiboek voor {form.partner_one || "jullie"} & {form.partner_two || "jullie"}.
                </p>
                <div className="mt-8 rounded-2xl border border-line bg-ivory px-5 py-2">
                  <Toggle checked={demo} onChange={setDemo} label="Voeg voorbeeldgasten, tafels en leveranciers toe" />
                </div>
              </div>
            )}
          </motion.section>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => go(-1)} disabled={step === 0}>
            <ArrowLeft className="size-4" aria-hidden /> Terug
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => go(1)} disabled={!canNext}>
              Volgende <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button onClick={finish} loading={saving} variant="gold" size="lg">
              Start met plannen <Heart className="size-4 fill-white" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
