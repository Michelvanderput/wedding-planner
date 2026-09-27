"use client";

import { motion } from "framer-motion";
import { AlertCircle, ArrowUpRight, CalendarDays, Check, ListChecks, MapPin, Store, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { AiCoach, CountUp, Countdown } from "@/components/dashboard/widgets";
import { Badge, Bar, ProgressRing, Rise, Stagger } from "@/components/ui/misc";
import { useWedding } from "@/lib/store";
import { cn, coupleName, daysUntil, formatDate, formatDateShort, formatEuro } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Goedemorgen" : h < 18 ? "Goedemiddag" : "Goedenavond";
}

export default function Overview() {
  const { wedding, tasks, guests, budget_items, vendors, update } = useWedding();

  const s = useMemo(() => {
    const done = tasks.filter((t) => t.done).length;
    const upcoming = tasks
      .filter((t) => !t.done)
      .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
      .slice(0, 5);
    const attending = guests.filter((g) => g.rsvp === "attending");
    const headcount = attending.length + attending.filter((g) => g.plus_one).length;
    const pending = guests.filter((g) => g.rsvp === "pending").length;
    const declined = guests.filter((g) => g.rsvp === "declined").length;
    const estimated = budget_items.reduce((a, b) => a + b.estimated, 0);
    const spent = budget_items.reduce((a, b) => a + (b.actual || 0), 0);
    const byCat = new Map<string, { est: number; act: number }>();
    budget_items.forEach((b) => {
      const c = byCat.get(b.category) ?? { est: 0, act: 0 };
      c.est += b.estimated;
      c.act += b.actual;
      byCat.set(b.category, c);
    });
    const cats = [...byCat.entries()].sort((a, b) => b[1].est - a[1].est).slice(0, 5);
    const booked = vendors.filter((v) => v.status === "booked").length;
    return { done, upcoming, attending: attending.length, headcount, pending, declined, estimated, spent, cats, booked };
  }, [tasks, guests, budget_items, vendors]);

  if (!wedding) return null;
  const progress = tasks.length ? s.done / tasks.length : 0;
  const budget = wedding.budget_total || s.estimated;

  const stats = [
    {
      href: "/dashboard/checklist",
      icon: ListChecks,
      label: "Taken afgerond",
      value: <><CountUp value={s.done} /> <span className="text-lg text-ink-500">/ {tasks.length}</span></>,
      foot: <Bar value={progress} label="Voortgang takenlijst" />,
    },
    {
      href: "/dashboard/gasten",
      icon: Users,
      label: "Gasten bevestigd",
      value: <><CountUp value={s.headcount} /> <span className="text-lg text-ink-500">/ {guests.length || wedding.guest_estimate}</span></>,
      foot: <p className="text-sm text-ink-500">{s.pending} wachten nog op antwoord</p>,
    },
    {
      href: "/dashboard/budget",
      icon: Wallet,
      label: "Uitgegeven",
      value: <CountUp value={s.spent} format={formatEuro} />,
      foot: <Bar value={budget ? s.spent / budget : 0} tone={s.spent > budget ? "rose" : "gold"} label="Budget uitgegeven" />,
    },
    {
      href: "/dashboard/leveranciers",
      icon: Store,
      label: "Leveranciers geboekt",
      value: <><CountUp value={s.booked} /> <span className="text-lg text-ink-500">/ {vendors.length}</span></>,
      foot: <p className="text-sm text-ink-500">{vendors.length - s.booked} nog in gesprek</p>,
    },
  ];

  const rsvpTotal = guests.length || 1;
  const rsvp = [
    { key: "attending", label: "Komt", n: s.attending, cls: "bg-sage-500" },
    { key: "pending", label: "Wacht", n: s.pending, cls: "bg-gold-400" },
    { key: "declined", label: "Kan niet", n: s.declined, cls: "bg-rose-400" },
  ];

  return (
    <Stagger className="space-y-6">
      {/* Hero */}
      <Rise>
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-100 via-rose-50 to-gold-100 p-6 shadow-[var(--shadow-soft)] ring-1 ring-white sm:p-10">
          <div className="absolute -top-20 -right-10 size-72 rounded-full bg-white/40 blur-3xl" aria-hidden />
          <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-ink-700">{greeting()},</p>
              <h1 className="font-script text-5xl leading-tight text-rose-700 sm:text-6xl">
                {coupleName(wedding.partner_one, wedding.partner_two)}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-700">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-rose-500" aria-hidden />
                  {wedding.wedding_date ? formatDate(wedding.wedding_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Datum nog te bepalen"}
                </span>
                {(wedding.venue || wedding.city) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-rose-500" aria-hidden />
                    {[wedding.venue, wedding.city].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
              <div className="mt-6">
                <Countdown date={wedding.wedding_date} time={wedding.ceremony_time} />
              </div>
            </div>
            <div className="flex items-center gap-5 lg:flex-col">
              <ProgressRing value={progress} size={148} stroke={12} label={`${Math.round(progress * 100)}% van de taken afgerond`}>
                <div className="text-center">
                  <div className="stat text-4xl">
                    <CountUp value={progress * 100} />%
                  </div>
                  <div className="text-xs text-ink-500">klaar</div>
                </div>
              </ProgressRing>
              <p className="max-w-40 text-sm text-ink-700 lg:text-center">
                {progress >= 1 ? "Alles is geregeld. Geniet ervan!" : progress > 0.5 ? "Jullie zijn over de helft!" : "Goed bezig, stap voor stap."}
              </p>
            </div>
          </div>
        </section>
      </Rise>

      {/* Statistieken */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((st) => (
          <Rise key={st.label}>
            <Link href={st.href} className="card group flex h-full flex-col gap-3 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-rose-50 ring-1 ring-rose-100">
                  <st.icon className="size-[18px] text-rose-600" aria-hidden />
                </span>
                <ArrowUpRight className="size-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-rose-600" aria-hidden />
              </div>
              <div>
                <p className="text-sm text-ink-500">{st.label}</p>
                <p className="stat text-3xl">{st.value}</p>
              </div>
              <div className="mt-auto">{st.foot}</div>
            </Link>
          </Rise>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Eerstvolgende taken */}
        <Rise className="lg:col-span-3">
          <section className="card h-full p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Eerstvolgende taken</h2>
              <Link href="/dashboard/checklist" className="text-sm font-medium text-rose-700 hover:underline">
                Alles bekijken
              </Link>
            </div>
            {s.upcoming.length === 0 ? (
              <p className="mt-6 text-ink-500">Alle taken zijn afgevinkt. Wat een team!</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {s.upcoming.map((t) => {
                  const d = daysUntil(t.due_date);
                  const overdue = d !== null && d < 0;
                  return (
                    <motion.li key={t.id} layout className="flex items-center gap-3 py-3">
                      <button
                        onClick={() => update("tasks", t.id, { done: true })}
                        className="group grid size-11 shrink-0 place-items-center rounded-full"
                        aria-label={`Markeer "${t.title}" als klaar`}
                      >
                        <span className="grid size-6 place-items-center rounded-full border-2 border-rose-200 transition group-hover:border-sage-500 group-hover:bg-sage-50">
                          <Check className="size-3.5 text-sage-600 opacity-0 transition group-hover:opacity-100" aria-hidden />
                        </span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{t.title}</p>
                        <p className="text-sm text-ink-500">{t.category}</p>
                      </div>
                      {t.due_date && (
                        <Badge tone={overdue ? "rose" : d !== null && d <= 14 ? "gold" : "ink"}>
                          {overdue && <AlertCircle className="size-3" aria-hidden />}
                          {overdue ? "Te laat" : formatDateShort(t.due_date)}
                        </Badge>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </section>
        </Rise>

        {/* RSVP */}
        <Rise className="lg:col-span-2">
          <section className="card h-full p-6">
            <h2 className="text-2xl font-semibold">RSVP-overzicht</h2>
            <p className="text-sm text-ink-500">{guests.length} gasten uitgenodigd</p>
            <div className="mt-5 flex h-3 gap-0.5 overflow-hidden rounded-full bg-ivory-deep" role="img" aria-label={rsvp.map((r) => `${r.label}: ${r.n}`).join(", ")}>
              {rsvp.map((r) =>
                r.n ? (
                  <motion.div
                    key={r.key}
                    className={cn("h-full first:rounded-l-full last:rounded-r-full", r.cls)}
                    initial={{ width: 0 }}
                    animate={{ width: `${(r.n / rsvpTotal) * 100}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  />
                ) : null,
              )}
            </div>
            <ul className="mt-5 space-y-3">
              {rsvp.map((r) => (
                <li key={r.key} className="flex items-center gap-3 text-sm">
                  <span className={cn("size-2.5 rounded-full", r.cls)} aria-hidden />
                  <span className="flex-1 text-ink-700">{r.label}</span>
                  <span className="font-medium tabular-nums">{r.n}</span>
                </li>
              ))}
            </ul>
            {s.pending > 0 && (
              <Link href="/dashboard/gasten?filter=pending" className="mt-5 inline-block text-sm font-medium text-rose-700 hover:underline">
                Bekijk wie nog moet reageren →
              </Link>
            )}
          </section>
        </Rise>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Budget */}
        <Rise className="lg:col-span-2">
          <section className="card h-full p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Budget</h2>
              <Link href="/dashboard/budget" className="text-sm font-medium text-rose-700 hover:underline">
                Details
              </Link>
            </div>
            <p className="text-sm text-ink-500">
              {formatEuro(s.spent)} van {formatEuro(budget)} uitgegeven
            </p>
            <ul className="mt-5 space-y-4">
              {s.cats.map(([cat, v]) => (
                <li key={cat} title={`${cat}: ${formatEuro(v.act)} van ${formatEuro(v.est)}`}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-ink-700">{cat}</span>
                    <span className="text-ink-500 tabular-nums">
                      {formatEuro(v.act)} / {formatEuro(v.est)}
                    </span>
                  </div>
                  <Bar value={v.est ? v.act / v.est : 0} tone={v.act > v.est ? "rose" : "gold"} label={`${cat} besteed`} />
                </li>
              ))}
            </ul>
          </section>
        </Rise>

        <Rise className="lg:col-span-3">
          <AiCoach />
        </Rise>
      </div>
    </Stagger>
  );
}
