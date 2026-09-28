/**
 * Supabase-gegevens opzoeken in een set omgevingsvariabelen. Gedeeld door next.config
 * (build) en de server (runtime), zodat de app ook werkt als de variabelen pas na de
 * build zijn toegevoegd of een voorvoegsel hebben (bijv. STORAGE_SUPABASE_URL).
 *
 * Veiligheid: alleen een publieke sleutel (anon / sb_publishable_) wordt ooit teruggegeven.
 */
export type KeyKind = "publishable" | "anon" | "secret" | "service_role" | "unknown" | "missing";
type Env = Record<string, string | undefined>;

const clean = (v: string) => v.trim().replace(/^["']|["']$/g, "").trim();

function decodeJwtRole(v: string): string | undefined {
  const parts = v.split(".");
  if (parts.length !== 3) return undefined;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof atob === "function" ? atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "=")) : Buffer.from(b64, "base64").toString("utf8");
    return (JSON.parse(json) as { role?: string }).role;
  } catch {
    return undefined;
  }
}

export function classifyKey(raw: string | undefined): KeyKind {
  if (!raw || !clean(raw)) return "missing";
  const v = clean(raw);
  if (v.startsWith("sb_publishable_")) return "publishable";
  if (v.startsWith("sb_secret_")) return "secret";
  const role = decodeJwtRole(v);
  if (role === "anon") return "anon";
  if (role === "service_role") return "service_role";
  return "unknown";
}

/** "abc.supabase.co", "https://abc.supabase.co/rest/v1/" → "https://abc.supabase.co" */
export function normalizeUrl(raw: string | undefined): string {
  if (!raw) return "";
  let v = clean(raw);
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  v = v.replace(/\/(rest|auth)\/v1\/?.*$/i, "").replace(/\/+$/, "");
  try {
    const u = new URL(v);
    return u.hostname.includes(".") || u.hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname) ? u.origin : "";
  } catch {
    return "";
  }
}

const URL_NAMES = [/^NEXT_PUBLIC_SUPABASE_URL$/, /^SUPABASE_URL$/, /(^|_)SUPABASE_URL$/];
const KEY_NAMES = [
  /^NEXT_PUBLIC_SUPABASE_ANON_KEY$/,
  /^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY$/,
  /^SUPABASE_ANON_KEY$/,
  /^SUPABASE_PUBLISHABLE_KEY$/,
  /(^|_)SUPABASE_(ANON|PUBLISHABLE)_KEY$/,
];

function names(env: Env, patterns: RegExp[]) {
  const out: string[] = [];
  for (const re of patterns) for (const k of Object.keys(env)) if (re.test(k) && !out.includes(k)) out.push(k);
  return out;
}

export function findSupabaseEnv(env: Env) {
  const urlNames = names(env, URL_NAMES);
  const keyNames = names(env, KEY_NAMES);
  const urlName = urlNames.find((k) => normalizeUrl(env[k]));
  const keyName = keyNames.find((k) => ["publishable", "anon"].includes(classifyKey(env[k])));
  return {
    url: urlName ? normalizeUrl(env[urlName]) : "",
    key: keyName ? clean(env[keyName]!) : "",
    /** Diagnose zonder waarden: welke naam, en wat voor soort waarde. */
    report: {
      url: urlNames.map((k) => ({ name: k, valid: Boolean(normalizeUrl(env[k])) })),
      key: keyNames.map((k) => ({ name: k, kind: classifyKey(env[k]) })),
    },
  };
}
