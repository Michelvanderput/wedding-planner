"use client";

import { motion } from "framer-motion";
import {
  BedDouble,
  CalendarPlus,
  Car,
  ChevronDown,
  Clock,
  Gift,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Shirt,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Countdown } from "@/components/dashboard/widgets";
import { RingsMark } from "@/components/decor/logo";
import { Petals, Sprig } from "@/components/decor/petals";
import type { InvitationData } from "@/lib/types";
import { cn, formatDate, parseDate } from "@/lib/utils";

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

/** Ics-bestand zodat gasten de bruiloft in hun agenda zetten. */
function downloadIcs(d: InvitationData) {
  const date = parseDate(d.wedding_date);
  if (!date) return;
  const [h, m] = (d.ceremony_time || "14:00").split(":").map(Number);
  const first = d.timeline[0]?.start_time;
  const last = d.timeline[d.timeline.length - 1];
  const [sh, sm] = (d.guest?.invited_to === "evening" && first ? first : `${h}:${m}`).split(":").map(Number);
  const start = new Date(date);
  start.setHours(sh || 14, sm || 0);
  const end = new Date(start);
  const [eh, em] = (last?.end_time || last?.start_time || "").split(":").map(Number);
  if (eh !== undefined && !Number.isNaN(eh)) {
    end.setHours(eh, em || 0);
    if (end <= start) end.setDate(end.getDate() + 1);
  } else end.setHours(start.getHours() + 10);
  const f = (x: Date) =>
    `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}T${String(x.getHours()).padStart(2, "0")}${String(x.getMinutes()).padStart(2, "0")}00`;
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ja ik wil//NL",
    "BEGIN:VEVENT",
    `UID:${f(start)}-${d.partner_one}-${d.partner_two}@ja-ik-wil`.replace(/\s/g, ""),
    `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(start)}`,
    `DTEND:${f(end)}`,
    `SUMMARY:${esc(`Bruiloft ${d.partner_one} & ${d.partner_two}`)}`,
    `LOCATION:${esc(d.site.address || [d.venue, d.city].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${esc(typeof window !== "undefined" ? window.location.href : "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "bruiloft.ics";
  a.click();
  URL.revokeObjectURL(url);
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 px-4 py-16 sm:py-20">
      <motion.div {...fade} className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="font-script text-3xl text-gold-600">{eyebrow}</p>
          <h2 className="text-4xl font-semibold sm:text-5xl">{title}</h2>
          <Divider />
        </div>
        {children}
      </motion.div>
    </section>
  );
}

function Divider() {
  return (
    <div className="mx-auto mt-5 flex items-center justify-center gap-3 text-gold-400" aria-hidden>
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold-300" />
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
        <path d="M12 2c2 4 6 6 10 10-4 4-8 6-10 10-2-4-6-6-10-10 4-4 8-6 10-10z" />
      </svg>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold-300" />
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-rose-50 to-gold-50 ring-1 ring-rose-100">
          <Icon className="size-[18px] text-rose-600" aria-hidden />
        </span>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <div className="mt-3 leading-relaxed whitespace-pre-line text-ink-700">{children}</div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line last:border-0">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left font-medium">
        {q}
        <ChevronDown className={cn("size-5 shrink-0 text-rose-500 transition-transform duration-300", open && "rotate-180")} aria-hidden />
      </button>
      <motion.div initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} className="overflow-hidden">
        <p className="pb-4 leading-relaxed whitespace-pre-line text-ink-700">{a}</p>
      </motion.div>
    </div>
  );
}

interface Props {
  data: InvitationData;
  /** RSVP-formulier (alleen op de persoonlijke link). */
  rsvp?: ReactNode;
  /** Balk bovenaan in de voorbeeldweergave. */
  banner?: ReactNode;
}

export function InvitationView({ data, rsvp, banner }: Props) {
  const { site, guest } = data;
  const couple = `${data.partner_one} & ${data.partner_two}`;
  const address = site.address || [data.venue, data.city].filter(Boolean).join(", ");
  const firstName = guest?.name.split(" ")[0];
  const practical = [
    { key: "dress_code", icon: Shirt, title: "Dresscode", text: site.dress_code },
    { key: "gifts", icon: Gift, title: "Cadeautip", text: site.gifts },
    { key: "parking", icon: Car, title: "Parkeren & vervoer", text: site.parking },
    { key: "accommodation", icon: BedDouble, title: "Overnachten", text: site.accommodation },
  ].filter((p) => p.text.trim());
  const faq = site.faq.filter((f) => f.q.trim() && f.a.trim());
  const nav = [
    site.welcome && ["welkom", "Welkom"],
    data.timeline.length && ["programma", "Programma"],
    address && ["locatie", "Locatie"],
    practical.length && ["praktisch", "Praktisch"],
    faq.length && ["vragen", "Vragen"],
    rsvp && ["rsvp", "RSVP"],
  ].filter(Boolean) as [string, string][];

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const phoneDigits = site.contact_phone.replace(/[^\d+]/g, "");
  const waNumber = phoneDigits.replace(/^\+/, "").replace(/^0(?=6)/, "31");

  return (
    <div className="paper min-h-dvh overflow-x-clip">
      {banner}

      {/* Sticky navigatie */}
      {nav.length > 1 && (
        <nav
          aria-label="Onderdelen"
          className={cn(
            "fixed inset-x-0 z-40 flex justify-center px-3 transition-all duration-300",
            banner ? "top-14" : "top-3",
            scrolled ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0",
          )}
        >
          <ul className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-white/90 p-1 shadow-[var(--shadow-soft)] backdrop-blur-md">
            {nav.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="block rounded-full px-3.5 py-2 text-sm whitespace-nowrap text-ink-700 transition hover:bg-rose-50 hover:text-rose-700">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Hero */}
      <header className="relative grid min-h-[92dvh] place-items-center overflow-hidden px-4 py-20 text-center">
        {site.hero_image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site.hero_image} alt="" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-ink-900/40 via-ink-900/30 to-ivory" />
          </>
        ) : (
          <>
            <Sprig className="absolute top-10 left-2 h-64 text-sage-500 opacity-30 sm:left-10 sm:h-80 sm:opacity-70" />
            <Sprig className="absolute right-2 bottom-24 h-56 -scale-x-100 text-gold-400 opacity-30 sm:right-10 sm:h-72 sm:opacity-70" />
          </>
        )}
        <Petals count={14} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className={cn("relative max-w-2xl", site.hero_image && "text-white")}
        >
          <RingsMark className="mx-auto size-12" />
          <p className={cn("mt-6 text-sm tracking-[0.3em] uppercase", site.hero_image ? "text-white/90" : "text-ink-500")}>
            {guest ? `Lieve ${firstName}, je bent uitgenodigd` : "Wij gaan trouwen"}
          </p>
          <h1 className={cn("mt-4 font-script text-6xl leading-[1.1] font-normal sm:text-8xl", site.hero_image ? "text-white drop-shadow-lg" : "text-rose-700")}>
            {data.partner_one}
            <span className={cn("mx-3 inline-block text-5xl sm:text-6xl", site.hero_image ? "text-gold-200" : "text-gold-500")}>&</span>
            {data.partner_two}
          </h1>
          {data.wedding_date && (
            <p className={cn("mt-6 font-serif text-2xl sm:text-3xl", site.hero_image ? "text-white" : "text-ink-900")}>
              {formatDate(data.wedding_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
          {(data.venue || data.city) && (
            <p className={cn("mt-1", site.hero_image ? "text-white/90" : "text-ink-700")}>{[data.venue, data.city].filter(Boolean).join(" · ")}</p>
          )}
          {guest && (
            <p className={cn("mt-4 inline-block rounded-full px-4 py-1.5 text-sm", site.hero_image ? "bg-white/20 text-white backdrop-blur" : "bg-rose-50 text-rose-700 ring-1 ring-rose-100")}>
              {guest.invited_to === "evening" ? "Je bent van harte welkom op het avondfeest" : "Je bent de hele dag welkom"}
            </p>
          )}
          {data.wedding_date && (
            <div className="mt-8 flex justify-center">
              <Countdown date={data.wedding_date} time={data.ceremony_time} />
            </div>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {rsvp && (
              <a href="#rsvp" className="inline-flex h-12 items-center rounded-full bg-rose-600 px-6 font-medium text-white shadow-[var(--shadow-glow)] transition hover:bg-rose-700">
                Laat weten of je komt
              </a>
            )}
            {data.wedding_date && (
              <button
                onClick={() => downloadIcs(data)}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-white/90 px-6 font-medium text-ink-900 transition hover:bg-white"
              >
                <CalendarPlus className="size-4" aria-hidden /> Zet in agenda
              </button>
            )}
          </div>
        </motion.div>
        <a href={`#${nav[0]?.[0] ?? "programma"}`} className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-ink-500" aria-label="Scroll naar beneden">
          <ChevronDown className="size-6" />
        </a>
      </header>

      {site.welcome && (
        <Section id="welkom" eyebrow="Welkom" title="Wat fijn dat je er bent">
          <p className="mx-auto max-w-2xl text-center font-serif text-xl leading-relaxed whitespace-pre-line text-ink-700 sm:text-2xl">{site.welcome}</p>
        </Section>
      )}

      {data.timeline.length > 0 && (
        <Section id="programma" eyebrow="De dag" title="Programma">
          <ol className="relative mx-auto max-w-xl">
            <div className="absolute top-2 bottom-2 left-[76px] w-px bg-gradient-to-b from-rose-200 via-gold-300 to-sage-300" aria-hidden />
            {data.timeline.map((e, i) => (
              <motion.li
                key={`${e.start_time}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.07, 0.5) }}
                className="relative grid grid-cols-[64px_24px_1fr] gap-2 py-3"
              >
                <p className="stat pt-0.5 text-right text-lg text-ink-900">{e.start_time}</p>
                <span className="mt-2 size-3 justify-self-center rounded-full border-2 border-rose-300 bg-white" aria-hidden />
                <div>
                  <p className="font-serif text-xl font-semibold">
                    {e.title}
                    {!guest && e.audience === "day" && <span className="ml-2 align-middle font-sans text-xs font-normal text-gold-700">daggasten</span>}
                  </p>
                  {(e.end_time || e.location) && (
                    <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-ink-500">
                      {e.end_time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" aria-hidden /> tot {e.end_time}
                        </span>
                      )}
                      {e.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" aria-hidden /> {e.location}
                        </span>
                      )}
                    </p>
                  )}
                  {e.notes && <p className="mt-1 text-ink-700">{e.notes}</p>}
                </div>
              </motion.li>
            ))}
          </ol>
        </Section>
      )}

      {address && (
        <Section id="locatie" eyebrow="Waar" title="Locatie">
          <div className="card overflow-hidden">
            <iframe
              title={`Kaart van ${address}`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`}
              className="h-72 w-full border-0 sm:h-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-serif text-2xl font-semibold">{data.venue || "De locatie"}</p>
                <p className="text-ink-500">{address}</p>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-rose-600 px-5 font-medium text-white transition hover:bg-rose-700"
              >
                <Navigation className="size-4" aria-hidden /> Route plannen
              </a>
            </div>
          </div>
        </Section>
      )}

      {practical.length > 0 && (
        <Section id="praktisch" eyebrow="Goed om te weten" title="Praktische info">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {practical.map((p) => (
              <InfoCard key={p.key} icon={p.icon} title={p.title}>
                {p.text}
              </InfoCard>
            ))}
          </div>
        </Section>
      )}

      {faq.length > 0 && (
        <Section id="vragen" eyebrow="Nog vragen?" title="Veelgestelde vragen">
          <div className="card px-6">
            {faq.map((f, i) => (
              <Faq key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </Section>
      )}

      {rsvp && (
        <Section id="rsvp" eyebrow="Ben je erbij?" title="Laat het ons weten">
          {site.rsvp_deadline && (
            <p className="-mt-4 mb-8 text-center text-ink-500">
              Graag vóór <strong className="text-ink-900">{formatDate(site.rsvp_deadline)}</strong>
            </p>
          )}
          {rsvp}
        </Section>
      )}

      {(site.contact_name || site.contact_phone) && (
        <section className="px-4 pb-20">
          <motion.div {...fade} className="card mx-auto flex max-w-xl flex-col items-center gap-4 p-8 text-center">
            <p className="font-script text-3xl text-gold-600">Vragen op de dag zelf?</p>
            <p className="text-ink-700">
              Neem contact op met {site.contact_name ? <strong className="text-ink-900">{site.contact_name}</strong> : "ons"}
              {site.contact_name && ", onze ceremoniemeester"}.
            </p>
            {phoneDigits && (
              <div className="flex flex-wrap justify-center gap-2">
                <a href={`tel:${phoneDigits}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-5 font-medium hover:bg-rose-50">
                  <Phone className="size-4" aria-hidden /> Bellen
                </a>
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-5 font-medium hover:bg-rose-50">
                  <MessageCircle className="size-4" aria-hidden /> WhatsApp
                </a>
              </div>
            )}
          </motion.div>
        </section>
      )}

      <footer className="border-t border-line py-10 text-center">
        <p className="font-script text-4xl text-rose-700">{couple}</p>
        {data.wedding_date && <p className="mt-1 text-sm text-ink-500">{formatDate(data.wedding_date)}</p>}
      </footer>
    </div>
  );
}
