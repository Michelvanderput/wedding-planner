"use client";

import { getSupabaseBrowser } from "./supabase/client";

export interface Member {
  user_id: string;
  role: "owner" | "editor";
  email: string;
  is_me: boolean;
}

function client() {
  const sb = getSupabaseBrowser();
  if (!sb) throw new Error("Samen plannen werkt alleen met een gekoppelde Supabase-database.");
  return sb;
}

const fail = (e: { message: string; code?: string }) => {
  if (e.code === "PGRST202" || /could not find the function/i.test(e.message))
    return new Error("Voer eerst de tweede database-migratie uit (supabase/migrations).");
  return new Error(e.message);
};

export async function getMembers(weddingId: string): Promise<Member[]> {
  const { data, error } = await client().rpc("get_wedding_members", { p_wedding: weddingId });
  if (error) throw fail(error);
  return (data ?? []) as Member[];
}

export async function createPartnerInvite(weddingId: string): Promise<string> {
  const { data, error } = await client().rpc("create_partner_invite", { p_wedding: weddingId });
  if (error) throw fail(error);
  return data as string;
}

export async function acceptPartnerInvite(code: string): Promise<string> {
  const { data, error } = await client().rpc("accept_partner_invite", { p_code: code.trim() });
  if (error) throw fail(error);
  return data as string;
}

export async function removeMember(weddingId: string, userId: string) {
  const { error } = await client().rpc("remove_wedding_member", { p_wedding: weddingId, p_user: userId });
  if (error) throw fail(error);
}
