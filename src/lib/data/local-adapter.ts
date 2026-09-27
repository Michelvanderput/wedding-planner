import { COLLECTION_KEYS, emptyCollections, type Collections, type Wedding } from "../types";
import type { DataAdapter } from "./adapter";

const KEY = "bruiloftsplanner:v1";

export interface Snapshot {
  wedding: Wedding | null;
  collections: Collections;
}

export function readLocalSnapshot(): Snapshot {
  return read();
}

export function clearLocalSnapshot() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

function read(): Snapshot {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Snapshot;
      return { wedding: parsed.wedding ?? null, collections: { ...emptyCollections(), ...parsed.collections } };
    }
  } catch {
    // corrupte of geblokkeerde opslag → begin leeg
  }
  return { wedding: null, collections: emptyCollections() };
}

function write(s: Snapshot) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // opslag vol of geblokkeerd; de app blijft in-memory werken
  }
}

export function createLocalAdapter(): DataAdapter {
  const mutate = (fn: (s: Snapshot) => void) => {
    const s = read();
    fn(s);
    write(s);
    return Promise.resolve();
  };

  return {
    mode: "local",
    load: async () => ({ kind: "ok", ...read() }),
    createWedding: (wedding, seed) =>
      mutate((s) => {
        s.wedding = wedding;
        s.collections = emptyCollections();
        for (const k of COLLECTION_KEYS) {
          (s.collections[k] as unknown[]) = (seed[k] as unknown[]) ?? [];
        }
      }),
    updateWedding: (_id, patch) =>
      mutate((s) => {
        if (s.wedding) s.wedding = { ...s.wedding, ...patch };
      }),
    insert: (key, rows) =>
      mutate((s) => {
        (s.collections[key] as unknown[]) = [...s.collections[key], ...rows];
      }),
    update: (key, id, patch) =>
      mutate((s) => {
        (s.collections[key] as unknown[]) = s.collections[key].map((r) => (r.id === id ? { ...r, ...patch } : r));
      }),
    remove: (key, id) =>
      mutate((s) => {
        (s.collections[key] as unknown[]) = s.collections[key].filter((r) => r.id !== id);
        if (key === "seating_tables") {
          s.collections.guests = s.collections.guests.map((g) => (g.table_id === id ? { ...g, table_id: null } : g));
        }
        if (key === "vendors") {
          s.collections.budget_items = s.collections.budget_items.map((b) =>
            b.vendor_id === id ? { ...b, vendor_id: null } : b,
          );
        }
      }),
    deleteWedding: () =>
      mutate((s) => {
        s.wedding = null;
        s.collections = emptyCollections();
      }),
    signOut: async () => {},
  };
}
