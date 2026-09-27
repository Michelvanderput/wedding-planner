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
  site: { ...defaultSite(), ...(w.site ?? {}), faq: Array.isArray(w.site?.faq) ? w.site.faq : [] },
});

interface Row {
  id: string;
  wedding_id: string;
  created_at: string;
}

export interface Task extends Row {
  title: string;
  category: string;
  due_date: string | null;
  done: boolean;
  priority: Priority;
  notes: string;
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
  };
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

export interface Collections {
  tasks: Task[];
  guests: Guest[];
  vendors: Vendor[];
  budget_items: BudgetItem[];
  timeline_events: TimelineEvent[];
  seating_tables: SeatingTable[];
  inspirations: Inspiration[];
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
];

export const emptyCollections = (): Collections => ({
  tasks: [],
  guests: [],
  vendors: [],
  budget_items: [],
  timeline_events: [],
  seating_tables: [],
  inspirations: [],
});
