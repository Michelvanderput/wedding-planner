import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Great_Vibes } from "next/font/google";
import { connection } from "next/server";
import { Providers } from "@/components/providers";
import { findSupabaseEnv } from "@/lib/supabase/env";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const script = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-great-vibes", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Ja, ik wil! · Bruiloftsplanner", template: "%s · Ja, ik wil!" },
  description:
    "Plan jullie perfecte bruiloft: takenlijst, gasten & RSVP, budget, leveranciers, draaiboek, tafelschikking en een AI-moodboard – alles op één plek.",
  applicationName: "Ja, ik wil!",
  appleWebApp: { capable: true, title: "Ja, ik wil!", statusBarStyle: "default" },
  // Geen automatische blauwe links op telefoonnummers, datums en bedragen (iOS).
  formatDetection: { telephone: false, date: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f4",
  width: "device-width",
  initialScale: 1,
  // Tot aan de randen tekenen (notch / home-balk); we houden zelf rekening met safe areas.
  viewportFit: "cover",
  // Pinch-zoom blijft bewust mogelijk (toegankelijkheid); dubbeltik- en invoerzoom zijn uitgezet in CSS.
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Had de build de Supabase-gegevens niet (bijv. pas later toegevoegd in Vercel)? Dan lezen
  // we ze per verzoek uit de runtime-omgeving en geven we de publieke waarden aan de browser.
  let runtimeSb: { url: string; key: string } | null = null;
  if (!process.env.NEXT_PUBLIC_BUILD_HAD_SUPABASE) {
    await connection();
    const { url, key } = findSupabaseEnv(process.env);
    if (url && key) runtimeSb = { url, key };
  }
  return (
    <html lang="nl" className={`${sans.variable} ${serif.variable} ${script.variable}`}>
      <head>
        {runtimeSb && (
          <script
            // Alleen de publieke URL en anon/publishable-sleutel; nooit een geheime sleutel.
            dangerouslySetInnerHTML={{ __html: `window.__WP_SB__=${JSON.stringify(runtimeSb).replace(/</g, "\\u003c")}` }}
          />
        )}
      </head>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
