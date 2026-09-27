import type { InvitationTheme } from "./invitation/theme";

export type Priority = "low" | "medium" | "high";
export type Side = "partner_one" | "partner_two" | "both";
export type Rsvp = "pending" | "attending" | "declined";
export type InvitedTo = "day" | "evening";
export type VendorStatus = "idea" | "contacted" | "quote" | "booked";
/** Wie ziet een programmaonderdeel op de uitnodiging. */
export type Audience = "all" | "day" | "private";

export interface FaqItem {
  q: string;
  a: string;
}

/** Inhoud van de uitnodigingswebsite voor gasten. */
export interface SiteContent {
  published: boolean;
  welcome: string;
  address: string;
  dress_code: string;
  gifts: string;
  parking: string;
  accommodation: string;
  contact_name: string;
  contact_phone: string;
  hero_image: string;
  rsvp_deadline: string; // yyyy-mm-dd
  faq: FaqItem[];
  /** Menukeuzes die gasten bij hun RSVP kunnen kiezen (leeg = geen menukeuze). */
  rsvp_meals: string[];
  /** Eigen vragen bij de RSVP. */
  rsvp_questions: RsvpQuestion[];
  /** Vormgeving van de uitnodiging (zie lib/invitation/theme). Ontbrekend = standaardthema. */
  theme?: Partial<InvitationTheme>;
}

export interface RsvpQuestion {
  id: string;
  label: string;
  type: "text" | "choice";
  options: string[];
}

export const defaultSite = (): SiteContent => ({
  published: false,
  welcome: "",
  address: "",
  dress_code: "",
  gifts: "",
  parking: "",
  accommodation: "",
  contact_name: "",
  contact_phone: "",
  hero_image: "",
  rsvp_deadline: "",
  faq: [],
  rsvp_meals: [],
  rsvp_questions: [],
});

export interface Wedding {
  id: string;
  partner_one: string;
  partner_two: string;
  wedding_date: string | null; // yyyy-mm-dd
  ceremony_time: string | null; // HH:MM
  venue: string;
  city: string;
  budget_total: number;
  guest_estimate: number;
  style: string;
  color_palette: string[];
  public_slug: string | null;
  site: SiteContent;
  created_at: string;
}

/** Vult ontbrekende velden aan (oude data of een nog niet gemigreerde database). */
export const withWeddingDefaults = (w: Wedding): Wedding => ({
  ...w,
  public_slug: w.public_slug ?? null,
  site: {
    ...defaultSite(),
    ...(w.site ?? {}),
    faq: Array.isArray(w.site?.faq) ? w.site.faq : [],
    rsvp_meals: Array.isArray(w.site?.rsvp_meals) ? w.site.rsvp_meals : [],
    rsvp_questions: Array.isArray(w.site?.rsvp_questions) ? w.site.rsvp_questions : [],
  },
});

interface Row {
  id: string;
  wedding_id: string;
  created_at: string;
}

export type Assignee = "" | "both" | "partner_one" | "partner_two" | "ceremoniemeester";

export interface Task extends Row {
  title: string;
  category: string;
  due_date: string | null;
  done: boolean;
  priority: Priority;
  notes: string;
  assignee: Assignee;
}

export interface Guest extends Row {
  name: string;
  email: string;
  phone: string;
  side: Side;
  group_name: string;
  invited_to: InvitedTo;
  rsvp: Rsvp;
  plus_one: boolean;
  dietary: string;
  table_id: string | null;
  rsvp_token: string;
  meal: string;
  answers: Record<string, string>;
}

export interface Vendor extends Row {
  name: string;
  category: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  price: number | null;
  status: VendorStatus;
  rating: number | null;
  notes: string;
}

export interface BudgetItem extends Row {
  category: string;
  name: string;
  estimated: number;
  actual: number;
  paid: boolean;
  vendor_id: string | null;
  due_date: string | null;
  deposit: number;
  deposit_paid: boolean;
}

export interface TimelineEvent extends Row {
  start_time: string;
  end_time: string;
  title: string;
  location: string;
  notes: string;
  audience: Audience;
}

/** Wat een gast op de uitnodiging te zien krijgt (uit get_invitation / get_wedding_site). */
export interface InvitationData {
  partner_one: string;
  partner_two: string;
  wedding_date: string | null;
  ceremony_time: string | null;
  venue: string;
  city: string;
  color_palette: string[];
  site: SiteContent;
  timeline: Pick<TimelineEvent, "start_time" | "end_time" | "title" | "location" | "notes" | "audience">[];
  guest?: {
    name: string;
    invited_to: InvitedTo;
    rsvp: Rsvp;
    plus_one: boolean;
    dietary: string;
    meal?: string;
    answers?: Record<string, string>;
  };
  gifts?: PublicGift[];
  guestbook?: { name: string; message: string; created_at: string }[];
}

/** Cadeau zoals een gast het ziet (zonder wie wat gereserveerd heeft). */
export interface PublicGift {
  id: string;
  title: string;
  description: string;
  url: string;
  image_url: string;
  price: number | null;
  kind: "item" | "fund";
  quantity: number;
  claimed: number;
  raised: number;
  mine: boolean;
}

export interface SeatingTable extends Row {
  name: string;
  capacity: number;
  shape: "round" | "rect";
}

export interface Inspiration extends Row {
  image_url: string;
  prompt: string;
  note: string;
  category: string;
}

export interface Gift extends Row {
  title: string;
  description: string;
  url: string;
  image_url: string;
  price: number | null;
  kind: "item" | "fund";
  quantity: number;
}

export interface GiftClaim extends Row {
  gift_id: string;
  guest_id: string | null;
  name: string;
  amount: number | null;
}

export interface Shot extends Row {
  title: string;
  category: string;
  notes: string;
  done: boolean;
}

export interface GuestbookEntry extends Row {
  guest_id: string | null;
  name: string;
  message: string;
  hidden: boolean;
}

export interface DocumentRow extends Row {
  vendor_id: string | null;
  name: string;
  path: string;
  size: number;
  mime: string;
}

export interface Collections {
  tasks: Task[];
  guests: Guest[];
  vendors: Vendor[];
  budget_items: BudgetItem[];
  timeline_events: TimelineEvent[];
  seating_tables: SeatingTable[];
  inspirations: Inspiration[];
  gifts: Gift[];
  gift_claims: GiftClaim[];
  shots: Shot[];
  guestbook: GuestbookEntry[];
  documents: DocumentRow[];
}

export type CollectionKey = keyof Collections;
export type RowOf<K extends CollectionKey> = Collections[K][number];

export const COLLECTION_KEYS: CollectionKey[] = [
  "tasks",
  "seating_tables",
  "guests",
  "vendors",
  "budget_items",
  "timeline_events",
  "inspirations",
  "gifts",
  "gift_claims",
  "shots",
  "guestbook",
  "documents",
];

/** Tabellen uit de derde migratie: ontbreken ze nog, dan werkt de rest van de app gewoon door. */
export const OPTIONAL_COLLECTIONS: CollectionKey[] = ["gifts", "gift_claims", "shots", "guestbook", "documents"];

/** Standaardwaarden voor velden die later zijn toegevoegd (oude data / nog niet gemigreerd). */
export const ROW_DEFAULTS: Partial<Record<CollectionKey, Record<string, unknown>>> = {
  tasks: { assignee: "" },
  guests: { meal: "", answers: {} },
  budget_items: { due_date: null, deposit: 0, deposit_paid: false },
  timeline_events: { audience: "all" },
};

export function withRowDefaults<T>(key: CollectionKey, row: T): T {
  const d = ROW_DEFAULTS[key];
  if (!d) return row;
  const out = { ...row } as Record<string, unknown>;
  for (const [k, v] of Object.entries(d)) if (out[k] === undefined || (out[k] === null && v !== null)) out[k] = v;
  return out as T;
}

export const emptyCollections = (): Collections => ({
  tasks: [],
  guests: [],
  vendors: [],
  budget_items: [],
  timeline_events: [],
  seating_tables: [],
  inspirations: [],
  gifts: [],
  gift_claims: [],
  shots: [],
  guestbook: [],
  documents: [],
});
