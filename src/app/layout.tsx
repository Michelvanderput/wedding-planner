import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Great_Vibes } from "next/font/google";
import { Providers } from "@/components/providers";
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
};

export const viewport: Viewport = {
  themeColor: "#fbf7f4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${sans.variable} ${serif.variable} ${script.variable}`}>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
