import { NextResponse } from "next/server";
import { isAiConfigured } from "@/lib/ai-server";
import { isMissingSchema } from "@/lib/data/supabase-adapter";
import { isSupabaseConfigured } from "@/lib/supabase/config";
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

  // Runtime-omgeving: welke Supabase-variabelen bestaan er NU (alleen namen)?
  const runtimeNames = Object.keys(process.env)
    .filter((k) => /SUPABASE/i.test(k) && !/SERVICE_ROLE|SECRET|JWT|PASSWORD/i.test(k))
    .sort();
  const runtimeHas = runtimeNames.some((k) => /SUPABASE_URL$/.test(k)) && runtimeNames.some((k) => /(ANON|PUBLISHABLE)_KEY$/.test(k));

  let advice: string;
  if (isSupabaseConfigured) {
    advice =
      database === "ok"
        ? "Alles is gekoppeld."
        : database === "missing_tables"
          ? "Supabase is gekoppeld, maar de tabellen ontbreken. Voer de SQL-bestanden in supabase/migrations/ op volgorde uit."
          : database === "missing_features"
            ? "Supabase werkt, maar de nieuwste migratie (20260929000000_features.sql) is nog niet uitgevoerd."
            : "Supabase is ingesteld maar geeft een fout; zie 'detail'.";
  } else if (runtimeHas) {
    advice = "De Supabase-variabelen zijn er nu wel, maar waren er nog niet tijdens de laatste build. Doe een nieuwe deploy (Redeploy) in Vercel.";
  } else if (runtimeNames.length) {
    advice = `Er zijn Supabase-variabelen gevonden (${runtimeNames.join(", ")}), maar geen URL + publieke (anon/publishable) sleutel.`;
  } else {
    advice = "Geen Supabase-variabelen gevonden. Koppel Supabase in Vercel (Settings → Environment Variables of de Supabase-integratie) en deploy opnieuw.";
  }

  return NextResponse.json({
    storage: isSupabaseConfigured ? "supabase" : "local",
    database,
    ...(detail ? { detail } : {}),
    ai: isAiConfigured ? "enabled" : "disabled",
    supabase_env: {
      build_had_supabase: Boolean(process.env.NEXT_PUBLIC_BUILD_HAD_SUPABASE),
      runtime_variables: runtimeNames,
    },
    advice,
  });
}
