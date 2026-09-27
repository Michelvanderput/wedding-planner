import { NextResponse } from "next/server";
import { isAiConfigured } from "@/lib/ai-server";
import { isMissingSchema } from "@/lib/data/supabase-adapter";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Snelle gezondheidscheck: /api/status */
export async function GET() {
  let database: "not_configured" | "ok" | "missing_tables" | "error" = "not_configured";
  let detail: string | undefined;

  if (isSupabaseConfigured) {
    const sb = await getSupabaseServer();
    const { error } = (await sb?.from("weddings").select("id").limit(1)) ?? { error: null };
    if (!error) database = "ok";
    else if (isMissingSchema(error)) database = "missing_tables";
    else {
      database = "error";
      detail = error.message;
    }
  }

  return NextResponse.json({
    storage: isSupabaseConfigured ? "supabase" : "local",
    database,
    ...(detail ? { detail } : {}),
    ai: isAiConfigured ? "enabled" : "disabled",
  });
}
