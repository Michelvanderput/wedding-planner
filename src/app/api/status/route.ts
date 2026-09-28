import { NextResponse } from "next/server";
import { isAiConfigured } from "@/lib/ai-server";
import { isMissingSchema } from "@/lib/data/supabase-adapter";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { findSupabaseEnv } from "@/lib/supabase/env";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Gezondheidscheck: /api/status
 * Toont alleen NAMEN van omgevingsvariabelen (nooit waarden), zodat je kunt zien
 * waarom Supabase wel of niet actief is.
 */
export async function GET() {
  let database: "not_configured" | "ok" | "missing_tables" | "missing_features" | "error" = "not_configured";
  let detail: string | undefined;

  if (isSupabaseConfigured) {
    const sb = await getSupabaseServer();
    const { error } = (await sb?.from("weddings").select("id").limit(1)) ?? { error: null };
    if (error) {
      database = isMissingSchema(error) ? "missing_tables" : "error";
      if (database === "error") detail = error.message;
    } else {
      // Is ook de nieuwste migratie uitgevoerd?
      const extra = await sb?.from("gifts").select("id").limit(1);
      database = extra?.error && isMissingSchema(extra.error) ? "missing_features" : "ok";
    }
  }

  // Diagnose: alleen NAMEN en het soort waarde, nooit de waarden zelf.
  const found = findSupabaseEnv(process.env);
  const buildHad = Boolean(process.env.NEXT_PUBLIC_BUILD_HAD_SUPABASE);
  const badKey = found.report.key.find((k) => k.kind === "secret" || k.kind === "service_role");
  const unknownKey = found.report.key.find((k) => k.kind === "unknown");
  const badUrl = found.report.url.find((u) => !u.valid);

  let advice: string;
  if (isSupabaseConfigured) {
    advice =
      database === "ok"
        ? "Alles is gekoppeld."
        : database === "missing_tables"
          ? "Supabase is gekoppeld, maar de tabellen ontbreken. Voer de SQL-bestanden in supabase/migrations/ op volgorde uit in de Supabase SQL-editor."
          : database === "missing_features"
            ? "Supabase werkt, maar de nieuwste migratie (20260929000000_features.sql) is nog niet uitgevoerd."
            : "Supabase is ingesteld maar geeft een fout; zie 'detail'. Klopt de URL bij de sleutel (zelfde project)?";
  } else if (badKey && !found.key) {
    advice = `${badKey.name} bevat een geheime sleutel (${badKey.kind}). Gebruik de publieke 'anon'- of 'sb_publishable_'-sleutel uit Supabase → Project Settings → API Keys.`;
  } else if (unknownKey && !found.key) {
    advice = `${unknownKey.name} lijkt geen Supabase-sleutel. Plak de 'anon public'- of 'sb_publishable_…'-sleutel uit Supabase → Project Settings → API Keys (zonder aanhalingstekens of spaties).`;
  } else if (badUrl && !found.url) {
    advice = `${badUrl.name} is geen geldige URL. Gebruik de Project URL uit Supabase, bijv. https://abcd1234.supabase.co`;
  } else if (!found.report.url.length || !found.report.key.length) {
    advice = `Mis ${!found.report.url.length ? "SUPABASE_URL" : "SUPABASE_ANON_KEY"}. Voeg die toe in Vercel → Settings → Environment Variables (voor Production) en doe een Redeploy.`;
  } else {
    advice = "De variabelen zijn gevonden; doe een Redeploy zodat de nieuwe versie van de app ze oppakt.";
  }

  const falRaw = process.env.FAL_KEY;
  return NextResponse.json({
    storage: isSupabaseConfigured ? "supabase" : "local",
    database,
    ...(detail ? { detail } : {}),
    ai: isAiConfigured ? "enabled" : "disabled",
    supabase_env: {
      build_had_supabase: buildHad,
      url: found.report.url,
      key: found.report.key,
    },
    ai_env: { FAL_KEY: falRaw === undefined ? "missing" : falRaw.trim() ? "present" : "empty" },
    deployment: {
      env: process.env.VERCEL_ENV ?? null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    },
    advice,
  });
}
