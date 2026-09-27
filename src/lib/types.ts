export type Priority = "low" | "medium" | "high";
export type Side = "partner_one" | "partner_two" | "both";
export type Rsvp = "pending" | "attending" | "declined";
export type InvitedTo = "day" | "evening";
export type VendorStatus = "idea" | "contacted" | "quote" | "booked";

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
  created_at: string;
}

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
