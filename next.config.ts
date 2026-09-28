import type { NextConfig } from "next";

/**
 * Supabase-integraties gebruiken verschillende namen, soms met een voorvoegsel
 * (bijv. STORAGE_SUPABASE_URL via de Vercel Marketplace). We zoeken de URL en de
 * publieke sleutel op en maken ze beschikbaar onder één naam.
 *
 * Veiligheid: alleen een publieke sleutel (anon / sb_publishable_) mag naar de browser.
 * Een service_role- of sb_secret_-sleutel wordt hier altijd geweigerd.
 */
function isPublicKey(v: string) {
  if (v.startsWith("sb_publishable_")) return true;
  if (v.startsWith("sb_secret_")) return false;
  const parts = v.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { role?: string };
    return payload.role === "anon";
  } catch {
    return false;
  }
}

function find(patterns: RegExp[], accept: (v: string) => boolean = () => true) {
  for (const re of patterns) {
    for (const [k, v] of Object.entries(process.env)) {
      if (v && re.test(k) && accept(v.trim())) return v.trim();
    }
  }
  return "";
}

const supabaseUrl = find([/^NEXT_PUBLIC_SUPABASE_URL$/, /^SUPABASE_URL$/, /(^|_)SUPABASE_URL$/], (v) => /^https?:\/\//.test(v));
const supabaseKey = find(
  [
    /^NEXT_PUBLIC_SUPABASE_ANON_KEY$/,
    /^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY$/,
    /^SUPABASE_ANON_KEY$/,
    /^SUPABASE_PUBLISHABLE_KEY$/,
    /(^|_)SUPABASE_(ANON|PUBLISHABLE)_KEY$/,
  ],
  isPublicKey,
);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey,
    // Voor de diagnose op /api/status: had de build de Supabase-gegevens?
    NEXT_PUBLIC_BUILD_HAD_SUPABASE: supabaseUrl && supabaseKey ? "1" : "",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.fal.media" },
      { protocol: "https", hostname: "fal.media" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
