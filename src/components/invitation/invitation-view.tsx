"use client";

import { MotionConfig, motion } from "framer-motion";
import {
  BedDouble,
  CalendarPlus,
  Car,
  ChevronDown,
  Clock,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Shirt,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Petals, Sprig } from "@/components/decor/petals";
import { GiftSection, GuestbookSection } from "@/components/invitation/extras";
import { invitationFontVars } from "@/lib/invitation/fonts";
import { resolveTheme, themeStyle, type InvitationTheme, type SectionId } from "@/lib/invitation/theme";
import type { InvitationData } from "@/lib/types";
import { cn, formatDate, initials, parseDate } from "@/lib/utils";

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

// ── Kleine bouwstenen ──────────────────────────────────────────────────

function Divider({ kind }: { kind: InvitationTheme["divider"] }) {
  const mark =
    kind === "line" ? null : kind === "dots" ? (
      <span className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 rounded-full bg-gold-500" />
        ))}
      </span>
    ) : kind === "heart" ? (
      <Heart className="size-4 fill-current" />
    ) : kind === "flower" ? (
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="12" cy="6.5" rx="3" ry="5" opacity="0.75" transform={`rotate(${a} 12 12)`} />
        ))}
        <circle cx="12" cy="12" r="2.4" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
        <path d="M12 2c2 4 6 6 10 10-4 4-8 6-10 10-2-4-6-6-10-10 4-4 8-6 10-10z" />
      </svg>
    );
  return (
    <div className="mx-auto mt-5 flex items-center justify-center gap-3 text-gold-500" aria-hidden>
      <span className={cn("h-px bg-gradient-to-r from-transparent to-gold-400", kind === "line" ? "w-28" : "w-12")} />
      {mark}
      {kind !== "line" && <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold-400" />}
    </div>
  );
}

function Emblem({ kind, a, b, onPhoto }: { kind: InvitationTheme["emblem"]; a: string; b: string; onPhoto?: boolean }) {
  if (kind === "none") return null;
  if (kind === "heart") return <Heart className={cn("mx-auto size-10 fill-current", onPhoto ? "text-[#fff]" : "text-rose-500")} aria-hidden />;
  if (kind === "monogram")
    return (
      <div
        className={cn(
          "mx-auto grid size-20 place-items-center rounded-full border-2 font-script text-3xl leading-none",
          onPhoto ? "border-[#fff]/80 text-[#fff]" : "border-gold-400 text-rose-700",
        )}
        aria-hidden
      >
        <span className="inv-names -mt-1 text-[calc(1.9rem*var(--inv-name-scale))]">
          {initials(a).slice(0, 1)}
          <span className="mx-0.5 text-[0.6em]">&amp;</span>
          {initials(b).slice(0, 1)}
        </span>
      </div>
    );
  return (
    <svg viewBox="0 0 40 40" className="mx-auto size-12" aria-hidden>
      <circle cx="15" cy="23" r="10" fill="none" stroke={onPhoto ? "#fff" : "var(--t-accent2)"} strokeWidth="2.6" />
      <circle cx="25" cy="23" r="10" fill="none" stroke={onPhoto ? "#fff" : "var(--t-accent)"} strokeWidth="2.6" />
      <path d="M25 6.5l2.2 2.6L25 11.7l-2.2-2.6z" fill={onPhoto ? "#fff" : "var(--t-accent2)"} />
    </svg>
  );
}

/** Twinkelende sterretjes als versiering. */
function Sparkles() {
  const spots = [
    [8, 18, 14], [22, 70, 10], [80, 12, 12], [90, 60, 16], [65, 85, 9], [12, 88, 11], [45, 8, 8], [70, 40, 7],
  ];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {spots.map(([x, y, s], i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute text-gold-400"
          style={{ left: `${x}%`, top: `${y}%`, width: s, height: s }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.15, 0.8] }}
          transition={{ duration: 2.6 + (i % 3), repeat: Infinity, delay: i * 0.35 }}
        >
          <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" fill="currentColor" />
        </motion.svg>
      ))}
    </div>
  );
}

/** Art-deco hoekornamenten. */
function DecoCorners() {
  const corner = (
    <svg viewBox="0 0 100 100" className="size-20 text-gold-400 @2xl:size-28" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2 60V2h58M10 60V10h50M18 60V18h42" />
      <path d="M2 2l40 40M26 26h16v16" />
    </svg>
  );
  return (
    <div className="pointer-events-none absolute inset-4 @2xl:inset-8" aria-hidden>
      <div className="absolute top-0 left-0">{corner}</div>
      <div className="absolute top-0 right-0 -scale-x-100">{corner}</div>
      <div className="absolute bottom-0 left-0 -scale-y-100">{corner}</div>
      <div className="absolute right-0 bottom-0 -scale-100">{corner}</div>
    </div>
  );
}

function InvCountdown({ date, time, onPhoto }: { date: string; time: string | null; onPhoto?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const d = parseDate(date);
  if (!d) return null;
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
    <div className="flex justify-center gap-2 @md:gap-3" role="timer" aria-label={`Nog ${parts[0].v} dagen tot de bruiloft`}>
      {parts.map((p) => (
        <div key={p.l} className={cn("w-[4.25rem] rounded-2xl px-1 py-2.5 text-center @md:w-20", onPhoto ? "bg-[#fff]/85 text-[#2b1d22]" : "bg-white/80 ring-1 ring-line")}>
          <div className="stat text-2xl leading-8 @md:text-3xl @md:leading-9">{now === null ? "–" : p.v}</div>
          <div className={cn("text-[11px] tracking-wider uppercase", onPhoto ? "text-[#2b1d22]/70" : "text-ink-500")}>{p.l}</div>
        </div>
      ))}
    </div>
  );
}

function Section({ id, eyebrow, title, divider, children }: { id: string; eyebrow: string; title: string; divider: InvitationTheme["divider"]; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 px-4 py-16 @2xl:py-20">
      <motion.div {...fade} className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="font-script text-3xl text-gold-600">{eyebrow}</p>
          <h2 className="text-4xl font-semibold @2xl:text-5xl">{title}</h2>
          <Divider kind={divider} />
        </div>
        {children}
      </motion.div>
    </section>
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
      <div className="mt-3 leading-relaxed whitespace-pre-line text-ink-700 [overflow-wrap:anywhere]">{children}</div>
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
        <p className="pb-4 leading-relaxed whitespace-pre-line text-ink-700 [overflow-wrap:anywhere]">{a}</p>
      </motion.div>
    </div>
  );
}

// ── Pagina ─────────────────────────────────────────────────────────────

interface Props {
  data: InvitationData;
  /** RSVP-formulier (alleen op de persoonlijke link). */
  rsvp?: ReactNode;
  /** Balk bovenaan in de voorbeeldweergave. */
  banner?: ReactNode;
  /** Ingebed in de editor (live voorbeeld): geen vaste navigatie, compacte hoogte. */
  embedded?: boolean;
  /** Thema om te tonen i.p.v. het opgeslagen thema (live voorbeeld). */
  themeOverride?: InvitationTheme;
  /** Persoonlijke token: maakt reserveren en het gastenboek mogelijk. */
  token?: string;
}

export function InvitationView({ data, rsvp, banner, embedded, themeOverride, token }: Props) {
  const { site, guest } = data;
  const theme = themeOverride ?? resolveTheme(site.theme);
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

  // Welke onderdelen hebben inhoud, en in welke volgorde wil het bruidspaar ze?
  const has: Record<SectionId, boolean> = {
    welkom: !!site.welcome.trim(),
    programma: data.timeline.length > 0,
    locatie: !!address,
    praktisch: practical.length > 0,
    vragen: faq.length > 0,
    rsvp: !!rsvp,
    cadeaus: (data.gifts?.length ?? 0) > 0,
    gastenboek: !!token || (data.guestbook?.length ?? 0) > 0,
    contact: !!(site.contact_name || site.contact_phone),
  };
  const order = theme.sections.filter((s) => has[s] && (s === "rsvp" || !theme.hidden.includes(s)));
  const NAV_LABEL: Partial<Record<SectionId, string>> = { welkom: "Welkom", programma: "Programma", locatie: "Locatie", praktisch: "Praktisch", vragen: "Vragen", rsvp: "RSVP", cadeaus: "Cadeaus", gastenboek: "Gastenboek" };
  const nav = order.filter((s) => NAV_LABEL[s]).map((s) => [s, NAV_LABEL[s]!] as const);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (embedded) return;
    const on = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [embedded]);

  const phoneDigits = site.contact_phone.replace(/[^\d+]/g, "");
  const waNumber = phoneDigits.replace(/^\+/, "").replace(/^0(?=6)/, "31");

  // Openingsbeeld
  const image = site.hero_image;
  const hero = theme.hero === "full" && !image ? "centered" : theme.hero;
  const onPhoto = hero === "full";
  const decoOn = theme.motion !== "none";
  const petalColors = ["color-mix(in oklab, var(--t-accent) 35%, var(--t-surface))", "color-mix(in oklab, var(--t-accent2) 45%, var(--t-surface))", "color-mix(in oklab, var(--t-accent) 20%, var(--t-surface))"];
  const tagline = guest
    ? `Lieve ${firstName}, ${theme.tagline.trim() || "je bent uitgenodigd"}`
    : theme.tagline.trim() || "Wij gaan trouwen";

  const photoFrame = (
    <div
      className={cn(
        "relative mx-auto overflow-hidden shadow-[var(--shadow-lift)] ring-4 ring-white/70",
        hero === "arch" ? "h-64 w-48 rounded-t-full rounded-b-3xl @md:h-80 @md:w-60" : "aspect-[4/5] w-full max-w-sm rounded-t-full rounded-b-3xl",
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center bg-gradient-to-br from-rose-100 via-gold-50 to-sage-100">
          <Emblem kind={theme.emblem === "none" ? "rings" : theme.emblem} a={data.partner_one} b={data.partner_two} />
        </div>
      )}
    </div>
  );

  const heroText = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative max-w-2xl", hero === "split" ? "text-center @3xl:text-left" : "mx-auto text-center")}
    >
      {hero !== "arch" && hero !== "split" && <Emblem kind={theme.emblem} a={data.partner_one} b={data.partner_two} onPhoto={onPhoto} />}
      <p className={cn("mt-6 text-sm tracking-[0.3em] uppercase", onPhoto ? "text-[#fff]/90" : "text-ink-500")}>{tagline}</p>
      {/* Onder elkaar op smalle schermen; lettergrootte schaalt met de breedte zodat lange namen
          (met krullen) altijd volledig zichtbaar blijven. */}
      <h1
        className={cn(
          "inv-names mt-4 px-2 font-script leading-[1.12] font-normal",
          "text-[calc(clamp(2.6rem,13.5cqw,4.5rem)*var(--inv-name-scale))] @2xl:text-[calc(6rem*var(--inv-name-scale))] @2xl:leading-[1.1]",
          hero === "split" && "@3xl:px-0",
          onPhoto ? "text-[#fff] drop-shadow-lg" : "text-rose-700",
        )}
      >
        <span className="block @2xl:inline">{data.partner_one}</span>
        <span className={cn("block text-[0.72em] leading-[1.2] @2xl:mx-3 @2xl:inline-block", onPhoto ? "text-[#f3e3bf]" : "text-gold-500")}>&amp;</span>
        <span className="block @2xl:inline">{data.partner_two}</span>
      </h1>
      {data.wedding_date && (
        <p className={cn("mt-6 font-serif text-2xl @2xl:text-3xl", onPhoto ? "text-[#fff]" : "text-ink-900")}>
          {formatDate(data.wedding_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
      {(data.venue || data.city) && <p className={cn("mt-1", onPhoto ? "text-[#fff]/90" : "text-ink-700")}>{[data.venue, data.city].filter(Boolean).join(" · ")}</p>}
      {guest && (
        <p className={cn("mt-4 inline-block rounded-full px-4 py-1.5 text-sm", onPhoto ? "bg-[#fff]/20 text-[#fff] backdrop-blur" : "bg-rose-50 text-rose-700 ring-1 ring-rose-100")}>
          {guest.invited_to === "evening" ? "Je bent van harte welkom op het avondfeest" : "Je bent de hele dag welkom"}
        </p>
      )}
      {theme.countdown && data.wedding_date && (
        <div className={cn("mt-8 flex", hero === "split" ? "justify-center @3xl:justify-start" : "justify-center")}>
          <InvCountdown date={data.wedding_date} time={data.ceremony_time} onPhoto={onPhoto} />
        </div>
      )}
      <div className={cn("mt-8 flex flex-wrap gap-3", hero === "split" ? "justify-center @3xl:justify-start" : "justify-center")}>
        {rsvp && (
          <a href="#rsvp" className="inline-flex h-12 items-center rounded-full bg-rose-600 px-6 font-medium text-white shadow-[var(--shadow-glow)] transition hover:bg-rose-700">
            Laat weten of je komt
          </a>
        )}
        {theme.calendar && data.wedding_date && (
          <button
            onClick={() => downloadIcs(data)}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-white/90 px-6 font-medium text-ink-900 transition hover:bg-white"
          >
            <CalendarPlus className="size-4" aria-hidden /> Zet in agenda
          </button>
        )}
      </div>
    </motion.div>
  );

  const sections: Record<SectionId, ReactNode> = {
    welkom: (
      <Section key="welkom" id="welkom" eyebrow="Welkom" title="Wat fijn dat je er bent" divider={theme.divider}>
        <p className="mx-auto max-w-2xl text-center font-serif text-xl leading-relaxed whitespace-pre-line text-ink-700 [overflow-wrap:anywhere] @2xl:text-2xl">{site.welcome}</p>
      </Section>
    ),
    programma: (
      <Section key="programma" id="programma" eyebrow="De dag" title="Programma" divider={theme.divider}>
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
              <div className="min-w-0">
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
    ),
    locatie: (
      <Section key="locatie" id="locatie" eyebrow="Waar" title="Locatie" divider={theme.divider}>
        <div className="card overflow-hidden">
          {!embedded && (
            <iframe
              title={`Kaart van ${address}`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`}
              className="h-72 w-full border-0 @2xl:h-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
          <div className="flex flex-col gap-4 p-6 @xl:flex-row @xl:items-center @xl:justify-between">
            <div className="min-w-0">
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
    ),
    praktisch: (
      <Section key="praktisch" id="praktisch" eyebrow="Goed om te weten" title="Praktische info" divider={theme.divider}>
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
          {practical.map((p) => (
            <InfoCard key={p.key} icon={p.icon} title={p.title}>
              {p.text}
            </InfoCard>
          ))}
        </div>
      </Section>
    ),
    vragen: (
      <Section key="vragen" id="vragen" eyebrow="Nog vragen?" title="Veelgestelde vragen" divider={theme.divider}>
        <div className="card px-6">
          {faq.map((f, i) => (
            <Faq key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </Section>
    ),
    rsvp: (
      <Section key="rsvp" id="rsvp" eyebrow="Ben je erbij?" title="Laat het ons weten" divider={theme.divider}>
        {site.rsvp_deadline && (
          <p className="-mt-4 mb-8 text-center text-ink-500">
            Graag vóór <strong className="text-ink-900">{formatDate(site.rsvp_deadline)}</strong>
          </p>
        )}
        {rsvp}
      </Section>
    ),
    cadeaus: (
      <Section key="cadeaus" id="cadeaus" eyebrow="Cadeautips" title="Onze wensenlijst" divider={theme.divider}>
        <GiftSection gifts={data.gifts ?? []} token={embedded ? undefined : token} />
      </Section>
    ),
    gastenboek: (
      <Section key="gastenboek" id="gastenboek" eyebrow="Lieve woorden" title="Gastenboek" divider={theme.divider}>
        <GuestbookSection entries={data.guestbook ?? []} token={embedded ? undefined : token} guestName={guest?.name} />
      </Section>
    ),
    contact: (
      <section key="contact" className="px-4 py-12">
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
    ),
  };

  return (
    <MotionConfig reducedMotion={theme.motion === "none" ? "always" : "user"}>
      <div className={cn("inv-theme overflow-x-clip", invitationFontVars, !embedded && "min-h-dvh")} style={themeStyle(theme)} data-theme={theme.preset}>
        <div className="inv-pattern" data-pattern={theme.pattern} aria-hidden />
        {banner}

        {/* Sticky navigatie */}
        {!embedded && nav.length > 1 && (
          <nav
            aria-label="Onderdelen"
            className={cn(
              "fixed inset-x-0 z-40 flex justify-center px-3 transition-all duration-300",
              banner ? "top-[calc(3.5rem+env(safe-area-inset-top))]" : "top-[calc(0.75rem+env(safe-area-inset-top))]",
              scrolled ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0",
            )}
          >
            <ul className="no-scrollbar flex max-w-full gap-1 overflow-x-auto overscroll-x-contain rounded-full border border-line bg-white/90 p-1 shadow-[var(--shadow-soft)] backdrop-blur-md">
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

        <div className="@container">
        {/* Openingsbeeld */}
        <header className={cn("relative grid place-items-center overflow-hidden px-4 py-20", embedded ? "min-h-[640px]" : "min-h-[92dvh]")}>
          {onPhoto && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#1a1014]/45 via-[#1a1014]/30 to-ivory" />
            </>
          )}
          {!onPhoto && (theme.decoration === "sprigs" || theme.decoration === "sprigs-petals") && (
            <>
              <Sprig className="absolute top-10 left-2 h-64 text-sage-500 opacity-30 @2xl:left-10 @2xl:h-80 @2xl:opacity-70" />
              <Sprig className="absolute right-2 bottom-24 h-56 -scale-x-100 text-gold-400 opacity-30 @2xl:right-10 @2xl:h-72 @2xl:opacity-70" />
            </>
          )}
          {decoOn && (theme.decoration === "petals" || theme.decoration === "sprigs-petals") && <Petals count={14} colors={petalColors} />}
          {decoOn && theme.decoration === "sparkles" && <Sparkles />}
          {theme.decoration === "deco" && <DecoCorners />}

          {hero === "arch" ? (
            <div className="relative flex flex-col items-center">
              <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9 }}>
                {photoFrame}
              </motion.div>
              {heroText}
            </div>
          ) : hero === "split" ? (
            <div className="relative grid w-full max-w-5xl grid-cols-1 items-center gap-10 @3xl:grid-cols-2">
              <div className="@3xl:order-2">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9 }}>
                  {photoFrame}
                </motion.div>
              </div>
              {heroText}
            </div>
          ) : (
            heroText
          )}
          {nav[0] && (
            <a href={`#${nav[0][0]}`} className={cn("absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce", onPhoto ? "text-ink-700" : "text-ink-500")} aria-label="Scroll naar beneden">
              <ChevronDown className="size-6" />
            </a>
          )}
        </header>

        {order.map((s) => sections[s])}

        <footer className="mt-8 border-t border-line py-10 text-center">
          <p className="inv-names px-4 font-script text-[calc(clamp(2rem,10cqw,2.5rem)*var(--inv-name-scale))] text-rose-700">{couple}</p>
          {theme.closing.trim() && <p className="mx-auto mt-2 max-w-md px-4 font-serif text-lg text-ink-700 italic">{theme.closing}</p>}
          {data.wedding_date && <p className="mt-2 text-sm text-ink-500">{formatDate(data.wedding_date)}</p>}
        </footer>
        </div>
      </div>
    </MotionConfig>
  );
}
