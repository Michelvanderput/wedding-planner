import type { Gift, GiftClaim, GuestbookEntry, InvitationData, SiteContent, TimelineEvent, Wedding } from "@/lib/types";

export type PreviewAs = "public" | "day" | "evening";

/** Uitnodigingsdata opbouwen uit de eigen gegevens (voor voorbeeld en live preview). */
export function buildPreviewData(
  wedding: Wedding,
  timeline: TimelineEvent[],
  site: SiteContent,
  as: PreviewAs,
  extras: { gifts?: Gift[]; claims?: GiftClaim[]; guestbook?: GuestbookEntry[] } = {},
): InvitationData {
  const claims = extras.claims ?? [];
  const events = [...timeline]
    .filter((e) => e.audience !== "private" && (as !== "evening" || e.audience === "all"))
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .map(({ start_time, end_time, title, location, notes, audience }) => ({ start_time, end_time, title, location, notes, audience }));
  return {
    partner_one: wedding.partner_one,
    partner_two: wedding.partner_two,
    wedding_date: wedding.wedding_date,
    ceremony_time: wedding.ceremony_time,
    venue: wedding.venue,
    city: wedding.city,
    color_palette: wedding.color_palette,
    site,
    timeline: events,
    gifts: (extras.gifts ?? []).map((g) => {
      const mine = claims.filter((c) => c.gift_id === g.id);
      return {
        id: g.id,
        title: g.title,
        description: g.description,
        url: g.url,
        image_url: g.image_url,
        price: g.price,
        kind: g.kind,
        quantity: g.quantity,
        claimed: mine.length,
        raised: mine.reduce((a, c) => a + (c.amount ?? 0), 0),
        mine: false,
      };
    }),
    guestbook: (extras.guestbook ?? []).filter((e) => !e.hidden).map((e) => ({ name: e.name, message: e.message, created_at: e.created_at })),
    guest:
      as === "public"
        ? undefined
        : { name: as === "day" ? "Anna de Vries" : "Daan Meijer", invited_to: as, rsvp: "pending", plus_one: false, dietary: "" },
  };
}

const DRAFT_KEY = "bruiloftsplanner:inv-draft";

/** Nog niet opgeslagen wijzigingen doorgeven aan de voorbeeldpagina. */
export function storeDraft(weddingId: string, site: SiteContent) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ weddingId, site }));
  } catch {
    // geen opslag beschikbaar
  }
}

export function readDraft(weddingId: string): SiteContent | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as { weddingId: string; site: SiteContent };
    return d.weddingId === weddingId ? d.site : null;
  } catch {
    return null;
  }
}
