import "server-only";
import { cache } from "react";
import { isMissingSchema } from "@/lib/data/supabase-adapter";
import { getSupabaseServer } from "@/lib/supabase/server";
import { defaultSite, type InvitationData } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const normalize = (d: InvitationData): InvitationData => ({
  ...d,
  color_palette: d.color_palette ?? [],
  timeline: d.timeline ?? [],
  site: { ...defaultSite(), ...(d.site ?? {}), faq: Array.isArray(d.site?.faq) ? d.site.faq : [] },
});

/** Persoonlijke uitnodiging op basis van de RSVP-token van een gast. */
export const loadInvitation = cache(async (token: string): Promise<InvitationData | null> => {
  if (!UUID.test(token)) return null;
  const sb = await getSupabaseServer();
  if (!sb) return null;

  const { data, error } = await sb.rpc("get_invitation", { p_token: token });
  if (!error) return data ? normalize(data as InvitationData) : null;
  if (!isMissingSchema(error)) throw new Error(error.message);

  // Tweede migratie nog niet uitgevoerd: val terug op de basis-RSVP.
  const old = await sb.rpc("get_rsvp", { p_token: token });
  const row = (old.data as Record<string, never>[] | null)?.[0] as
    | { guest_name: string; rsvp: "pending"; plus_one: boolean; dietary: string; invited_to: "day"; partner_one: string; partner_two: string; wedding_date: string | null; venue: string; city: string }
    | undefined;
  if (!row) return null;
  return normalize({
    partner_one: row.partner_one,
    partner_two: row.partner_two,
    wedding_date: row.wedding_date,
    ceremony_time: null,
    venue: row.venue,
    city: row.city,
    color_palette: [],
    site: defaultSite(),
    timeline: [],
    guest: { name: row.guest_name, invited_to: row.invited_to, rsvp: row.rsvp, plus_one: row.plus_one, dietary: row.dietary },
  });
});

/** Algemene gepubliceerde uitnodigingspagina. */
export const loadWeddingSite = cache(async (slug: string): Promise<InvitationData | null> => {
  if (!/^[a-z0-9-]{3,60}$/i.test(slug)) return null;
  const sb = await getSupabaseServer();
  if (!sb) return null;
  const { data, error } = await sb.rpc("get_wedding_site", { p_slug: slug.toLowerCase() });
  if (error) {
    if (isMissingSchema(error)) return null;
    throw new Error(error.message);
  }
  return data ? normalize(data as InvitationData) : null;
});
