"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { QrCode } from "@/components/ui/qr";
import { useWedding } from "@/lib/store";
import { SITE_URL } from "@/lib/supabase/config";
import { INVITED_LABEL } from "@/lib/defaults";
import { QrCode as QrIcon } from "lucide-react";

/** Printbare kaartjes met een persoonlijke QR-code per gast (bijv. om bij de trouwkaart te voegen). */
export default function GuestQrCards() {
  const { guests, wedding, mode } = useWedding();
  const [origin, setOrigin] = useState(SITE_URL);
  useEffect(() => {
    if (!SITE_URL) setOrigin(window.location.origin);
  }, []);
  const sorted = [...guests].sort((a, b) => a.name.localeCompare(b.name, "nl"));

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          eyebrow="Voor de trouwkaart"
          title="QR-kaartjes"
          description="Iedere gast een eigen QR-code naar de persoonlijke uitnodiging. Print ze op stickers of kaartjes."
          actions={
            <>
              <Link href="/dashboard/gasten" className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-[15px] font-medium hover:bg-rose-50">
                <ArrowLeft className="size-4" aria-hidden /> Gasten
              </Link>
              <Button onClick={() => window.print()} disabled={mode !== "supabase" || !guests.length}>
                <Printer className="size-4" aria-hidden /> Printen
              </Button>
            </>
          }
        />
      </div>
      {mode !== "supabase" ? (
        <EmptyState icon={QrIcon} title="Koppel eerst Supabase" body="Persoonlijke uitnodigingen (en dus QR-codes) werken alleen met een gekoppelde database." />
      ) : !guests.length ? (
        <EmptyState icon={QrIcon} title="Nog geen gasten" body="Voeg eerst gasten toe." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:gap-3">
          {sorted.map((g) => (
            <div key={g.id} className="card flex break-inside-avoid flex-col items-center p-4 text-center print:rounded-lg print:border print:border-line">
              <p className="font-script text-2xl leading-tight text-rose-700">{g.name.split(" ")[0]}</p>
              <p className="text-xs text-ink-500">{INVITED_LABEL[g.invited_to]}</p>
              <QrCode value={`${origin}/rsvp/${g.rsvp_token}`} size={120} className="mt-2" />
              <p className="mt-2 text-[11px] text-ink-500">Scan voor je uitnodiging &amp; RSVP</p>
              <p className="text-[11px] text-ink-300">{wedding?.partner_one} &amp; {wedding?.partner_two}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
