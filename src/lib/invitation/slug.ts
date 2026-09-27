"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";

export const SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]{1,58})[a-z0-9]$/;

/** Is de link vrij? null = onbekend (lokale modus of fout). */
export async function isSlugAvailable(slug: string, weddingId: string): Promise<boolean | null> {
  const sb = getSupabaseBrowser();
  if (!sb || !SLUG_PATTERN.test(slug)) return null;
  const { data, error } = await sb.rpc("slug_available", { p_slug: slug, p_wedding: weddingId });
  return error ? null : Boolean(data);
}

/** Eerste vrije variant: emma-en-lucas → emma-en-lucas-2027 → emma-en-lucas-2 … */
export async function suggestFreeSlug(base: string, weddingId: string, year?: string): Promise<string> {
  const candidates = [base, ...(year ? [`${base}-${year}`] : []), ...Array.from({ length: 8 }, (_, i) => `${base}-${i + 2}`)];
  for (const c of candidates) {
    const ok = await isSlugAvailable(c, weddingId);
    if (ok !== false) return c;
  }
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
