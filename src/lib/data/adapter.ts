import type { CollectionKey, Collections, RowOf, Wedding } from "../types";

export type LoadResult =
  | { kind: "unauthenticated" }
  | { kind: "ok"; wedding: Wedding | null; collections: Collections; email?: string | null };

/**
 * Eén interface, twee implementaties:
 *  - LocalAdapter    → localStorage (werkt direct, zonder backend)
 *  - SupabaseAdapter → Postgres + RLS (zodra env-variabelen zijn gezet)
 */
export interface DataAdapter {
  mode: "local" | "supabase";
  load(): Promise<LoadResult>;
  createWedding(wedding: Wedding, seed: Partial<Collections>): Promise<void>;
  updateWedding(id: string, patch: Partial<Wedding>): Promise<void>;
  insert<K extends CollectionKey>(key: K, rows: RowOf<K>[]): Promise<void>;
  update<K extends CollectionKey>(key: K, id: string, patch: Partial<RowOf<K>>): Promise<void>;
  remove<K extends CollectionKey>(key: K, id: string): Promise<void>;
  deleteWedding(id: string): Promise<void>;
  signOut(): Promise<void>;
}
