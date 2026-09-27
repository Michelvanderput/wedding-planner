"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DataAdapter } from "./data/adapter";
import { createLocalAdapter } from "./data/local-adapter";
import { createSupabaseAdapter } from "./data/supabase-adapter";
import { getSupabaseBrowser } from "./supabase/client";
import { emptyCollections, type CollectionKey, type Collections, type RowOf, type Wedding } from "./types";
import { useToast } from "@/components/ui/toast";

type Status = "loading" | "ready" | "no-wedding" | "unauthenticated" | "error";

interface StoreValue extends Collections {
  status: Status;
  error: string | null;
  mode: "local" | "supabase";
  email: string | null;
  wedding: Wedding | null;
  createWedding: (wedding: Wedding, seed: Partial<Collections>) => Promise<void>;
  updateWedding: (patch: Partial<Wedding>) => void;
  add: <K extends CollectionKey>(key: K, rows: RowOf<K> | RowOf<K>[]) => void;
  update: <K extends CollectionKey>(key: K, id: string, patch: Partial<RowOf<K>>) => void;
  remove: <K extends CollectionKey>(key: K, id: string) => void;
  deleteWedding: () => Promise<void>;
  signOut: () => Promise<void>;
  reload: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function WeddingProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const adapterRef = useRef<DataAdapter | null>(null);
  if (!adapterRef.current) {
    const sb = getSupabaseBrowser();
    adapterRef.current = sb ? createSupabaseAdapter(sb) : createLocalAdapter();
  }
  const adapter = adapterRef.current;

  const [status, setStatus] = useState<Status>("loading");
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [collections, setCollections] = useState<Collections>(emptyCollections);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const res = await adapter.load();
      if (res.kind === "unauthenticated") {
        setStatus("unauthenticated");
        return;
      }
      setWedding(res.wedding);
      setCollections(res.collections);
      setEmail(res.email ?? null);
      setStatus(res.wedding ? "ready" : "no-wedding");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, [adapter]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** Optimistisch bijwerken; bij een fout melden en opnieuw synchroniseren. */
  const persist = useCallback(
    (p: Promise<void>) => {
      p.catch((e: unknown) => {
        console.error(e);
        toast.error("Opslaan mislukt", e instanceof Error ? e.message : undefined);
        void reload();
      });
    },
    [reload, toast],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ...collections,
      status,
      error,
      mode: adapter.mode,
      email,
      wedding,
      createWedding: async (w, seed) => {
        await adapter.createWedding(w, seed);
        await reload();
      },
      updateWedding: (patch) => {
        if (!wedding) return;
        setWedding({ ...wedding, ...patch });
        persist(adapter.updateWedding(wedding.id, patch));
      },
      add: (key, rowOrRows) => {
        const rows = (Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows]) as RowOf<typeof key>[];
        setCollections((c) => ({ ...c, [key]: [...c[key], ...rows] }));
        persist(adapter.insert(key, rows));
      },
      update: (key, id, patch) => {
        setCollections((c) => ({
          ...c,
          [key]: (c[key] as RowOf<typeof key>[]).map((r) => (r.id === id ? { ...r, ...patch } : r)),
        }));
        persist(adapter.update(key, id, patch));
      },
      remove: (key, id) => {
        setCollections((c) => {
          const next = { ...c, [key]: (c[key] as RowOf<typeof key>[]).filter((r) => r.id !== id) } as Collections;
          if (key === "seating_tables")
            next.guests = next.guests.map((g) => (g.table_id === id ? { ...g, table_id: null } : g));
          if (key === "vendors")
            next.budget_items = next.budget_items.map((b) => (b.vendor_id === id ? { ...b, vendor_id: null } : b));
          return next;
        });
        persist(adapter.remove(key, id));
      },
      deleteWedding: async () => {
        if (!wedding) return;
        await adapter.deleteWedding(wedding.id);
        setWedding(null);
        setCollections(emptyCollections());
        setStatus("no-wedding");
      },
      signOut: async () => {
        await adapter.signOut();
      },
      reload,
    }),
    [adapter, collections, email, error, persist, reload, status, wedding],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useWedding() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useWedding moet binnen <WeddingProvider> gebruikt worden");
  return ctx;
}
