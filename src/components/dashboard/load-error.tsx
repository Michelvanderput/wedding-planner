"use client";

import { DatabaseZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MISSING_SCHEMA } from "@/lib/data/supabase-adapter";
import { useWedding } from "@/lib/store";

export function LoadError() {
  const { error, reload } = useWedding();
  const missing = error === MISSING_SCHEMA;
  return (
    <main className="paper grid min-h-dvh place-items-center px-4 text-center">
      <div className="card max-w-lg p-8">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-rose-50 ring-1 ring-rose-100">
          <DatabaseZap className="size-6 text-rose-600" aria-hidden />
        </div>
        <h1 className="mt-5 text-3xl font-semibold">{missing ? "Database nog niet ingericht" : "Oeps, laden mislukt"}</h1>
        <p className="mt-2 text-ink-500">
          {missing ? (
            <>
              Supabase is gekoppeld, maar de tabellen bestaan nog niet. Open in Supabase de <strong>SQL Editor</strong>, plak de inhoud van{" "}
              <code className="rounded bg-ivory px-1 text-sm">supabase/migrations/20260927000000_init.sql</code> en klik op <strong>Run</strong>.
            </>
          ) : (
            (error ?? "Controleer je verbinding en probeer het opnieuw.")
          )}
        </p>
        <Button className="mt-6" onClick={() => void reload()}>
          Opnieuw proberen
        </Button>
      </div>
    </main>
  );
}
