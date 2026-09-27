"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarHeart,
  CheckCircle2,
  Clock,
  Images,
  ListChecks,
  Sparkles,
  Store,
  Users,
  Wallet,
  Armchair,
  Heart,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/decor/logo";
import { Petals, Sprig } from "@/components/decor/petals";

const FEATURES = [
  { icon: ListChecks, title: "Slimme takenlijst", body: "Een complete checklist die zich automatisch aanpast aan jullie trouwdatum." },
  { icon: Users, title: "Gasten & RSVP", body: "Dag- en avondgasten, dieetwensen en persoonlijke RSVP-links in één overzicht." },
  { icon: Wallet, title: "Budget", body: "Zie direct waar je geld naartoe gaat, wat betaald is en wat er nog open staat." },
  { icon: Store, title: "Leveranciers", body: "Van eerste idee tot geboekt: houd offertes, contacten en beoordelingen bij." },
  { icon: Clock, title: "Draaiboek", body: "Een minuut-tot-minuut planning van de grote dag die je deelt met iedereen." },
  { icon: Armchair, title: "Tafelschikking", body: "Sleep gasten naar tafels en zie meteen of iedereen een plekje heeft." },
  { icon: Images, title: "AI-moodboard", body: "Beschrijf jullie droomsfeer en laat AI inspiratiebeelden voor je maken." },
  { icon: Sparkles, title: "AI-weddingcoach", body: "Uitnodigingsteksten, offerte-mails en antwoorden op al je vragen in seconden." },
];

const STEPS = [
  { n: "01", title: "Vertel over jullie dag", body: "Namen, datum, budget en stijl – in minder dan twee minuten." },
  { n: "02", title: "Krijg een persoonlijk plan", body: "Takenlijst, budgetverdeling en draaiboek staan direct voor je klaar." },
  { n: "03", title: "Plan samen, stap voor stap", body: "Vink af, nodig uit, boek en geniet van het aftellen." },
];

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Home() {
  return (
    <div className="paper relative overflow-x-clip">
      {/* Navigatie */}
      <header className="sticky top-0 z-40 border-b border-transparent bg-ivory/70 backdrop-blur-md">
        <nav className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Hoofdmenu">
          <Logo />
          <div className="flex items-center gap-2">
            <a href="#functies" className="hidden rounded-full px-4 py-2 text-sm text-ink-700 hover:text-rose-700 sm:block">
              Functies
            </a>
            <a href="#hoe" className="hidden rounded-full px-4 py-2 text-sm text-ink-700 hover:text-rose-700 sm:block">
              Hoe werkt het
            </a>
            <ButtonLink href="/dashboard" size="sm">
              Start met plannen
            </ButtonLink>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <Petals />
        <Sprig className="absolute top-10 -left-6 hidden h-72 text-sage-500 lg:block" />
        <Sprig className="absolute top-24 -right-4 hidden h-64 -scale-x-100 text-gold-400 lg:block" />

        <div className="relative mx-auto grid grid-cols-1 max-w-6xl items-center gap-14 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12 } } }}>
            <motion.p variants={fade} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/70 px-3 py-1 text-sm text-rose-700">
              <Heart className="size-3.5 fill-rose-400 text-rose-400" aria-hidden /> Jullie bruiloft, helemaal zelf gepland
            </motion.p>
            <motion.h1 variants={fade} className="mt-6 text-5xl leading-[1.02] font-semibold tracking-tight text-ink-900 sm:text-6xl lg:text-7xl">
              Plan jullie <span className="font-script font-normal text-gradient text-[1.15em]">perfecte</span> dag,
              <br className="hidden sm:block" /> zonder stress.
            </motion.h1>
            <motion.p variants={fade} className="mt-6 max-w-xl text-lg text-ink-500">
              Eén rustig dashboard voor alles: takenlijst, gasten, budget, leveranciers, draaiboek en
              tafelschikking. Met een AI-assistent die je helpt als je even vastloopt.
            </motion.p>
            <motion.div variants={fade} className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="/dashboard" size="lg">
                Begin gratis <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="#functies" variant="secondary" size="lg">
                Bekijk functies
              </ButtonLink>
            </motion.div>
            <motion.ul variants={fade} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
              {["Geen installatie", "Samen met je partner", "Werkt op je telefoon"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-sage-500" aria-hidden /> {t}
                </li>
              ))}
            </motion.ul>
          </motion.div>

          <HeroPreview />
        </div>
      </section>

      {/* Functies */}
      <section id="functies" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={fade} className="mx-auto max-w-2xl text-center">
          <p className="font-script text-3xl text-gold-600">Alles op één plek</p>
          <h2 className="mt-1 text-4xl font-semibold sm:text-5xl">Van ja-woord tot laatste dans</h2>
          <p className="mt-4 text-ink-500">
            Geen losse spreadsheets, notities en appjes meer. Alles wat jullie nodig hebben, overzichtelijk bij elkaar.
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((f) => (
            <motion.article
              key={f.title}
              variants={fade}
              whileHover={{ y: -4 }}
              className="card group p-6 transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-rose-50 to-gold-50 ring-1 ring-rose-100 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <f.icon className="size-5 text-rose-600" aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{f.body}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* Hoe werkt het */}
      <section id="hoe" className="scroll-mt-20 bg-gradient-to-b from-transparent via-rose-50/60 to-transparent py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="text-center text-4xl font-semibold sm:text-5xl">
            In drie stappen op weg
          </motion.h2>
          <div className="relative mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="absolute top-8 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-rose-200 via-gold-300 to-rose-200 md:block" aria-hidden />
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="relative text-center"
              >
                <div className="mx-auto grid size-16 place-items-center rounded-full border border-rose-200 bg-white font-serif text-2xl font-semibold text-rose-600 shadow-[var(--shadow-soft)]">
                  {s.n}
                </div>
                <h3 className="mt-5 text-2xl font-semibold">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-ink-500">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-rose-700 via-rose-600 to-rose-500 px-6 py-16 text-center text-white shadow-[var(--shadow-lift)] sm:px-12"
        >
          <div className="absolute -top-24 -right-24 size-72 rounded-full bg-gold-300/30 blur-3xl" aria-hidden />
          <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-rose-300/40 blur-3xl" aria-hidden />
          <CalendarHeart className="relative mx-auto size-10 text-gold-200" aria-hidden />
          <h2 className="relative mt-4 text-4xl font-semibold sm:text-5xl">Klaar om te beginnen?</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-rose-50">
            Binnen twee minuten staat jullie persoonlijke trouwplan klaar. Het aftellen kan beginnen.
          </p>
          <ButtonLink href="/dashboard" variant="secondary" size="lg" className="relative mt-8 border-transparent text-rose-700">
            Start met plannen <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </motion.div>
      </section>

      <footer className="border-t border-line py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-ink-500 sm:flex-row sm:px-6">
          <Logo />
          <p>Met liefde gemaakt voor alle aanstaande bruidsparen.</p>
        </div>
      </footer>
    </div>
  );
}

function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-md lg:max-w-none"
      aria-hidden
    >
      <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-rose-200/50 via-transparent to-gold-200/50 blur-2xl" />
      <div className="card relative overflow-hidden p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-script text-2xl text-gold-600">Emma & Lucas</p>
            <p className="font-serif text-3xl font-semibold">Nog 128 dagen</p>
          </div>
          <div className="relative grid size-20 place-items-center">
            <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-rose-100)" strokeWidth="7" />
              <motion.circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--color-rose-500)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={213.6}
                initial={{ strokeDashoffset: 213.6 }}
                animate={{ strokeDashoffset: 213.6 * 0.38 }}
                transition={{ delay: 0.8, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <span className="stat text-lg">62%</span>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            ["Gasten", "86 / 110"],
            ["Budget", "€ 14.2k"],
            ["Geboekt", "7 van 9"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-ivory p-3">
              <p className="text-xs text-ink-500">{k}</p>
              <p className="stat mt-0.5 text-lg">{v}</p>
            </div>
          ))}
        </div>
        <ul className="mt-5 space-y-2">
          {[
            ["Fotograaf boeken", true],
            ["Uitnodigingen versturen", true],
            ["Proeverij catering", false],
          ].map(([t, done], i) => (
            <motion.li
              key={t as string}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.15 }}
              className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 text-sm"
            >
              <span className={`grid size-5 place-items-center rounded-full ${done ? "bg-sage-500 text-white" : "border border-ink-300"}`}>
                {done && <CheckCircle2 className="size-3.5" />}
              </span>
              <span className={done ? "text-ink-500 line-through" : ""}>{t as string}</span>
            </motion.li>
          ))}
        </ul>
      </div>
      <motion.div
        className="card absolute -bottom-6 -left-4 flex items-center gap-3 px-4 py-3 sm:-left-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, type: "spring" }}
      >
        <span className="grid size-9 place-items-center rounded-full bg-gold-100">
          <Sparkles className="size-4 text-gold-600" />
        </span>
        <div className="text-sm">
          <p className="font-medium">AI-tip</p>
          <p className="text-ink-500">Tijd om de taart te proeven!</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
