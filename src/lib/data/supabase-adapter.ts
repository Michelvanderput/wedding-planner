import type { SupabaseClient } from "@supabase/supabase-js";
import { COLLECTION_KEYS, OPTIONAL_COLLECTIONS, emptyCollections, withRowDefaults, withWeddingDefaults, type Collections, type Wedding } from "../types";
import type { DataAdapter } from "./adapter";

const NUMERIC_FIELDS = new Set(["budget_total", "estimated", "actual", "price", "deposit", "amount"]);

/** Postgres `numeric` komt als string terug – normaliseer naar number. */
function normalize<T>(row: T): T {
  const out = { ...row } as Record<string, unknown>;
  for (const k of Object.keys(out)) {
    if (NUMERIC_FIELDS.has(k) && out[k] !== null && out[k] !== undefined) out[k] = Number(out[k]);
  }
  return out as T;
}

export const MISSING_SCHEMA =
  "De database is nog niet (volledig) ingericht. Voer de SQL-bestanden in supabase/migrations/ op volgorde uit in de Supabase SQL-editor.";

/** Herkent "tabel/functie bestaat niet" (PostgREST-schemacache of Postgres zelf). */
export const isMissingSchema = (e: { code?: string; message?: string }) =>
  ["PGRST205", "PGRST202", "PGRST204", "42P01", "42703"].includes(e.code ?? "") ||
  /could not find the (table|function|'.+' column)/i.test(e.message ?? "");

function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === "23505" && /public_slug/.test(error.message)) throw new Error("Deze link is al in gebruik. Kies een andere.");
  throw new Error(isMissingSchema(error) ? MISSING_SCHEMA : error.message);
}

export function createSupabaseAdapter(sb: SupabaseClient): DataAdapter {
  return {
    mode: "supabase",

    async load() {
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return { kind: "unauthenticated" };

      const { data: weddings, error } = await sb
        .from("weddings")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1);
      check(error);
      const wedding = weddings?.[0] ? withWeddingDefaults(normalize(weddings[0] as Wedding)) : null;
      const collections = emptyCollections();

      if (wedding) {
        const results = await Promise.all(
          COLLECTION_KEYS.map((k) =>
            sb.from(k).select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: true }),
          ),
        );
        results.forEach((res, i) => {
          const key = COLLECTION_KEYS[i];
          // Nieuwere tabellen die nog niet gemigreerd zijn: leeg laten i.p.v. de hele app te blokkeren.
          if (res.error && OPTIONAL_COLLECTIONS.includes(key) && isMissingSchema(res.error)) return;
          check(res.error);
          (collections[key] as unknown[]) = (res.data ?? []).map((r) => withRowDefaults(key, normalize(r)));
        });
      }
      return { kind: "ok", wedding, collections, email: user.email };
    },

    async createWedding(wedding, seed) {
      check((await sb.from("weddings").insert(wedding)).error);
      // Volgorde volgt de foreign keys (tafels vóór gasten, leveranciers vóór budget).
      for (const k of COLLECTION_KEYS) {
        const rows = (seed as Collections)[k] as unknown as Record<string, unknown>[] | undefined;
        if (rows?.length) check((await sb.from(k).insert(rows)).error);
      }
    },

    async updateWedding(id, patch) {
      check((await sb.from("weddings").update(patch).eq("id", id)).error);
    },

    async insert(key, rows) {
      if (rows.length) check((await sb.from(key).insert(rows as unknown as Record<string, unknown>[])).error);
    },

    async update(key, id, patch) {
      check((await sb.from(key).update(patch as Record<string, unknown>).eq("id", id)).error);
    },

    async remove(key, id) {
      check((await sb.from(key).delete().eq("id", id)).error);
    },

    async deleteWedding(id) {
      check((await sb.from("weddings").delete().eq("id", id)).error);
    },

    async signOut() {
      await sb.auth.signOut();
    },
  };
}
