import "server-only";
import { createFalClient } from "@fal-ai/client";
import { NextResponse } from "next/server";
import { isEmailAllowed } from "./access";
import { isSupabaseConfigured } from "./supabase/config";
import { getSupabaseServer } from "./supabase/server";

export const FAL_KEY = process.env.FAL_KEY ?? "";
export const isAiConfigured = Boolean(FAL_KEY);
export const LLM_MODEL = process.env.FAL_LLM_MODEL || "google/gemini-2.5-flash";
export const IMAGE_MODEL = process.env.FAL_IMAGE_MODEL || "fal-ai/flux/schnell";

export const fal = createFalClient({ credentials: FAL_KEY });

// Eenvoudige rate limit per instance (beschermt je fal-tegoed tegen misbruik).
const hits = new Map<string, number[]>();
const WINDOW = 10 * 60_000;
const LIMIT = 40;

/** Retourneert een foutresponse als de aanroep niet mag, anders null. */
export async function guard(req: Request): Promise<NextResponse | null> {
  if (!isAiConfigured) {
    return NextResponse.json(
      { error: "AI is nog niet ingesteld. Voeg FAL_KEY toe aan je omgevingsvariabelen." },
      { status: 503 },
    );
  }

  let who = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (isSupabaseConfigured) {
    const sb = await getSupabaseServer();
    const user = (await sb?.auth.getUser())?.data.user;
    if (!user) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });
    if (!isEmailAllowed(user.email)) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
    who = user.id;
  }

  const now = Date.now();
  const recent = (hits.get(who) ?? []).filter((t) => now - t < WINDOW);
  if (recent.length >= LIMIT) {
    return NextResponse.json({ error: "Even rustig aan – probeer het over een paar minuten opnieuw." }, { status: 429 });
  }
  recent.push(now);
  hits.set(who, recent);
  return null;
}

export async function complete(prompt: string, system: string, maxTokens = 1200) {
  const res = await fal.subscribe("openrouter/router", {
    input: { model: LLM_MODEL, prompt, system_prompt: system, max_tokens: maxTokens, temperature: 0.7 },
  });
  if (res.data.error) throw new Error(res.data.error);
  return res.data.output.trim();
}

/** Haalt het eerste JSON-blok uit een LLM-antwoord. */
export function extractJson<T>(text: string): T {
  const cleaned = text.replace(/```(?:json)?/g, "");
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
  if (start === -1 || end === -1) throw new Error("Geen JSON in antwoord");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

export const clip = (v: unknown, max = 600) => String(v ?? "").slice(0, max);
