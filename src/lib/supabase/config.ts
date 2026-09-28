import { findSupabaseEnv } from "./env";

/*
 * Supabase-gegevens komen uit (in volgorde):
 * 1. de build (next.config zet NEXT_PUBLIC_SUPABASE_*),
 * 2. in de browser: window.__WP_SB__, door de root-layout op de server ingevoegd,
 * 3. op de server: de runtime-omgeving (ook namen zonder NEXT_PUBLIC_ of met voorvoegsel).
 * Zo werkt de koppeling ook als de variabelen pas na de build zijn toegevoegd.
 */
type Injected = { url?: string; key?: string } | undefined;
const injected: Injected = typeof window !== "undefined" ? (window as unknown as { __WP_SB__?: Injected }).__WP_SB__ : undefined;
const runtime = typeof window === "undefined" ? findSupabaseEnv(globalThis.process?.env ?? {}) : null;

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || injected?.url || runtime?.url || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || injected?.key || runtime?.key || "";

/** True zodra Supabase-omgevingsvariabelen zijn ingesteld. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Basisadres voor gedeelde links. Bewust NIET de unieke deployment-URL (VERCEL_URL): die zit
// standaard achter Vercel-login, waardoor gasten de uitnodiging niet zouden kunnen openen.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}` : "");

const isLocal = (u: string) => /^https?:\/\/(localhost|127\.|0\.0\.0\.0|\[::1\])/i.test(u);

/**
 * Het adres waarop gasten en e-maillinks moeten uitkomen. Een ingestelde SITE_URL wint,
 * behalve als die naar localhost wijst terwijl de app live draait (bijv. een vergeten
 * NEXT_PUBLIC_SITE_URL uit .env.example): dan het adres waarop de app nu echt draait.
 */
export function publicOrigin(): string {
  const here = typeof window !== "undefined" ? window.location.origin : "";
  if (SITE_URL && !(isLocal(SITE_URL) && here && !isLocal(here))) return SITE_URL.replace(/\/+$/, "");
  return here || SITE_URL;
}
