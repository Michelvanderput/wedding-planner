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

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "");
