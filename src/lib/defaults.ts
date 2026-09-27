import type {
  Audience,
  BudgetItem,
  Collections,
  Guest,
  Priority,
  SeatingTable,
  Task,
  TimelineEvent,
  Vendor,
  VendorStatus,
  Wedding,
} from "./types";
import { addMonths, nowIso, parseDate, toDateInput, uid } from "./utils";

// ── Labels ────────────────────────────────────────────────────────────
export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Laag",
  medium: "Normaal",
  high: "Hoog",
};

export const RSVP_LABEL = {
  pending: "Wacht op antwoord",
  attending: "Komt",
  declined: "Kan niet",
} as const;

export const INVITED_LABEL = { day: "Daggast", evening: "Avondgast" } as const;

export const VENDOR_STATUS: { value: VendorStatus; label: string }[] = [
  { value: "idea", label: "Idee" },
  { value: "contacted", label: "Contact gelegd" },
  { value: "quote", label: "Offerte" },
  { value: "booked", label: "Geboekt" },
];

export const TASK_CATEGORIES = [
  "Algemeen",
  "Locatie",
  "Ceremonie",
  "Catering",
  "Kleding & styling",
  "Fotografie",
  "Muziek",
  "Bloemen & decoratie",
  "Drukwerk",
  "Gasten",
  "Vervoer",
  "Huwelijksreis",
];

export const VENDOR_CATEGORIES = [
  "Locatie",
  "Catering",
  "Fotograaf",
  "Videograaf",
  "Bloemist",
  "DJ / Band",
  "Ceremoniespreker",
  "Trouwjurk / pak",
  "Haar & make-up",
  "Taart",
  "Vervoer",
  "Drukwerk",
  "Overig",
];

/** Gemiddelde verdeling van een Nederlands trouwbudget. */
export const BUDGET_SPLIT: { category: string; share: number }[] = [
  { category: "Locatie & catering", share: 0.45 },
  { category: "Fotografie & video", share: 0.12 },
  { category: "Kleding & styling", share: 0.1 },
  { category: "Bloemen & decoratie", share: 0.08 },
  { category: "Muziek & entertainment", share: 0.07 },
  { category: "Ringen", share: 0.05 },
  { category: "Drukwerk", share: 0.03 },
  { category: "Vervoer", share: 0.03 },
  { category: "Overig", share: 0.07 },
];

export const BUDGET_CATEGORIES = BUDGET_SPLIT.map((b) => b.category);

export const WEDDING_STYLES = [
  { value: "Romantisch", hint: "Pastels, rozen & kaarslicht", colors: ["#F5C7D6", "#FBF7F4", "#B8904A"] },
  { value: "Boho", hint: "Pampas, terracotta & vrije vormen", colors: ["#D9A47E", "#EFE3D3", "#8A6F55"] },
  { value: "Klassiek", hint: "Wit, goud & tijdloze elegantie", colors: ["#FFFFFF", "#E2C992", "#2B1D22"] },
  { value: "Modern minimalistisch", hint: "Strakke lijnen, veel wit", colors: ["#F4F4F2", "#C9C9C4", "#1F1F1F"] },
  { value: "Rustiek", hint: "Hout, groen & boerderijsferen", colors: ["#B7C8B3", "#E8DCC8", "#6B4F3A"] },
  { value: "Tuinfeest", hint: "Wilde bloemen & buiten", colors: ["#E9EFE8", "#F6D6A8", "#7D9A78"] },
];

// ── Checklist-sjabloon (maanden voor de grote dag) ────────────────────
const CHECKLIST: { title: string; category: string; months: number; priority?: Priority }[] = [
  { title: "Budget samen vaststellen", category: "Algemeen", months: 12, priority: "high" },
  { title: "Voorlopige gastenlijst maken", category: "Gasten", months: 12, priority: "high" },
  { title: "Trouwdatum prikken", category: "Algemeen", months: 12, priority: "high" },
  { title: "Locaties bezoeken en vergelijken", category: "Locatie", months: 11, priority: "high" },
  { title: "Locatie vastleggen", category: "Locatie", months: 10, priority: "high" },
  { title: "Getuigen en ceremoniemeester vragen", category: "Ceremonie", months: 10 },
  { title: "Fotograaf boeken", category: "Fotografie", months: 10, priority: "high" },
  { title: "Save-the-dates versturen", category: "Drukwerk", months: 9 },
  { title: "Catering kiezen en proeverij plannen", category: "Catering", months: 9 },
  { title: "DJ of band boeken", category: "Muziek", months: 9 },
  { title: "Trouwjurk / pak uitzoeken", category: "Kleding & styling", months: 8, priority: "high" },
  { title: "Trouwambtenaar of spreker kiezen", category: "Ceremonie", months: 8 },
  { title: "Bloemist kiezen", category: "Bloemen & decoratie", months: 7 },
  { title: "Huwelijksreis boeken", category: "Huwelijksreis", months: 7 },
  { title: "Ondertrouw aangeven bij de gemeente", category: "Ceremonie", months: 6, priority: "high" },
  { title: "Uitnodigingen ontwerpen", category: "Drukwerk", months: 6 },
  { title: "Trouwringen uitzoeken", category: "Kleding & styling", months: 5 },
  { title: "Vervoer regelen", category: "Vervoer", months: 5 },
  { title: "Taart kiezen", category: "Catering", months: 4 },
  { title: "Uitnodigingen versturen", category: "Drukwerk", months: 4, priority: "high" },
  { title: "Proefsessie haar & make-up", category: "Kleding & styling", months: 3 },
  { title: "Draaiboek opstellen", category: "Algemeen", months: 2, priority: "high" },
  { title: "Speeches en geloften schrijven", category: "Ceremonie", months: 2 },
  { title: "RSVP's nabellen", category: "Gasten", months: 1.5 },
  { title: "Tafelschikking maken", category: "Gasten", months: 1 },
  { title: "Definitief aantal gasten doorgeven", category: "Catering", months: 1, priority: "high" },
  { title: "Laatste pasbeurt", category: "Kleding & styling", months: 0.5 },
  { title: "Draaiboek delen met leveranciers", category: "Algemeen", months: 0.25 },
  { title: "Tas inpakken voor de grote dag", category: "Algemeen", months: 0.1 },
];

export function buildChecklist(wedding: Pick<Wedding, "id" | "wedding_date">): Task[] {
  const date = parseDate(wedding.wedding_date) ?? addMonths(new Date(), 12);
  const today = new Date();
  // Minder dan 12 maanden tot de bruiloft? Dan wordt het schema naar verhouding samengeperst,
  // zodat taken netjes over de resterende tijd verdeeld worden i.p.v. allemaal "vandaag".
  const DAY = 86_400_000;
  const available = Math.max(0, (date.getTime() - today.getTime()) / DAY);
  const scale = Math.min(1, available / 365);
  return CHECKLIST.map((t) => {
    let due = new Date(date.getTime() - t.months * 30.4 * scale * DAY);
    if (scale === 1) {
      due = t.months >= 1 ? addMonths(date, -Math.ceil(t.months)) : new Date(date.getTime() - t.months * 30 * DAY);
    }
    if (due < today) due = today;
    return {
      id: uid(),
      wedding_id: wedding.id,
      created_at: nowIso(),
      title: t.title,
      category: t.category,
      due_date: toDateInput(due),
      done: false,
      priority: t.priority ?? "medium",
      notes: "",
    };
  });
}

export function buildBudget(wedding: Pick<Wedding, "id" | "budget_total">): BudgetItem[] {
  return BUDGET_SPLIT.map((b) => ({
    id: uid(),
    wedding_id: wedding.id,
    created_at: nowIso(),
    category: b.category,
    name: b.category,
    estimated: Math.round((wedding.budget_total * b.share) / 50) * 50,
    actual: 0,
    paid: false,
    vendor_id: null,
  }));
}

export function buildTimeline(wedding: Pick<Wedding, "id" | "ceremony_time">): TimelineEvent[] {
  const [h, m] = (wedding.ceremony_time || "14:00").split(":").map(Number);
  const base = (h || 14) * 60 + (m || 0);
  const t = (offset: number) => {
    const mins = (((base + offset) % 1440) + 1440) % 1440;
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  };
  const rows: [number, number, string, string, Audience][] = [
    [-300, -180, "Haar & make-up", "Thuis / hotel", "private"],
    [-150, -120, "First look & fotoshoot", "", "private"],
    [-30, 0, "Ontvangst gasten", "", "day"],
    [0, 45, "Ceremonie", "", "day"],
    [45, 150, "Toost, taart & felicitaties", "", "day"],
    [180, 330, "Diner", "", "day"],
    [330, 360, "Ontvangst avondgasten", "", "all"],
    [360, 375, "Openingsdans", "", "all"],
    [375, 600, "Feest", "", "all"],
  ];
  return rows.map(([s, e, title, location, audience]) => ({
    id: uid(),
    wedding_id: wedding.id,
    created_at: nowIso(),
    start_time: t(s),
    end_time: t(e),
    title,
    location,
    notes: "",
    audience,
  }));
}

// ── Voorbeelddata (demo) ──────────────────────────────────────────────
export function buildDemo(wedding: Wedding): Partial<Collections> {
  const w = wedding.id;
  const base = { wedding_id: w, created_at: nowIso() };
  const tables: SeatingTable[] = [
    { ...base, id: uid(), name: "Bruidstafel", capacity: 8, shape: "rect" },
    { ...base, id: uid(), name: "Tafel Familie", capacity: 10, shape: "round" },
    { ...base, id: uid(), name: "Tafel Vrienden", capacity: 10, shape: "round" },
  ];
  const g = (
    name: string,
    side: Guest["side"],
    group_name: string,
    rsvp: Guest["rsvp"],
    extra: Partial<Guest> = {},
  ): Guest => ({
    ...base,
    id: uid(),
    name,
    email: "",
    phone: "",
    side,
    group_name,
    invited_to: "day",
    rsvp,
    plus_one: false,
    dietary: "",
    table_id: null,
    rsvp_token: uid(),
    ...extra,
  });
  const guests: Guest[] = [
    g("Anna de Vries", "partner_one", "Familie", "attending", { table_id: tables[1].id }),
    g("Pieter de Vries", "partner_one", "Familie", "attending", { table_id: tables[1].id }),
    g("Sophie Jansen", "partner_two", "Familie", "attending", { dietary: "Vegetarisch", table_id: tables[1].id }),
    g("Mark Bakker", "both", "Vrienden", "attending", { plus_one: true, table_id: tables[2].id }),
    g("Lisa Visser", "partner_two", "Vrienden", "pending"),
    g("Tom Smit", "partner_one", "Werk", "declined"),
    g("Eva Mulder", "both", "Vrienden", "pending", { invited_to: "evening" }),
    g("Daan Meijer", "partner_two", "Werk", "pending", { invited_to: "evening" }),
  ];
  const vendors: Vendor[] = [
    {
      ...base,
      id: uid(),
      name: "Landgoed De Hoeve",
      category: "Locatie",
      contact_name: "Marieke",
      email: "",
      phone: "",
      website: "",
      price: 9500,
      status: "booked",
      rating: 5,
      notes: "Inclusief tuin voor de ceremonie",
    },
    {
      ...base,
      id: uid(),
      name: "Studio Lichtval",
      category: "Fotograaf",
      contact_name: "Joris",
      email: "",
      phone: "",
      website: "",
      price: 2400,
      status: "quote",
      rating: 4,
      notes: "Hele dag + album",
    },
    {
      ...base,
      id: uid(),
      name: "Bloemenatelier Roos",
      category: "Bloemist",
      contact_name: "",
      email: "",
      phone: "",
      website: "",
      price: null,
      status: "contacted",
      rating: null,
      notes: "",
    },
  ];
  return { seating_tables: tables, guests, vendors };
}
