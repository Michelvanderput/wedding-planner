import type { NextConfig } from "next";

import { findSupabaseEnv } from "./src/lib/supabase/env";

// Supabase-URL en publieke sleutel opzoeken (ook met voorvoegsel, bijv. STORAGE_SUPABASE_URL).
// Een service_role- of sb_secret_-sleutel wordt altijd geweigerd. Ontbreken ze tijdens de
// build, dan vult de server ze tijdens runtime alsnog in (zie src/lib/supabase/config.ts).
const { url: supabaseUrl, key: supabaseKey } = findSupabaseEnv(process.env);

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
