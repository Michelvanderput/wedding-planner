"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InvitationView } from "@/components/invitation/invitation-view";
import { Segmented } from "@/components/ui/segmented";
import { Spinner } from "@/components/ui/misc";
import { useWedding } from "@/lib/store";
import type { InvitationData } from "@/lib/types";

type As = "public" | "day" | "evening";

/** Voorbeeld van de uitnodiging, opgebouwd uit de eigen (nog niet opgeslagen) gegevens. */
export default function PreviewPage() {
  const { wedding, timeline_events, status } = useWedding();
  const [as, setAs] = useState<As>("day");

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("als");
    if (v === "public" || v === "day" || v === "evening") setAs(v);
  }, []);

  const data = useMemo<InvitationData | null>(() => {
    if (!wedding) return null;
    const timeline = [...timeline_events]
      .filter((e) => e.audience !== "private" && (as !== "evening" || e.audience === "all"))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map(({ start_time, end_time, title, location, notes, audience }) => ({ start_time, end_time, title, location, notes, audience }));
    return {
      partner_one: wedding.partner_one,
      partner_two: wedding.partner_two,
      wedding_date: wedding.wedding_date,
      ceremony_time: wedding.ceremony_time,
      venue: wedding.venue,
      city: wedding.city,
      color_palette: wedding.color_palette,
      site: wedding.site,
      timeline,
      guest: as === "public" ? undefined : { name: as === "day" ? "Anna de Vries" : "Daan Meijer", invited_to: as, rsvp: "pending", plus_one: false, dietary: "" },
    };
  }, [wedding, timeline_events, as]);

  if (status !== "ready" || !data) return <Spinner label="Voorbeeld laden…" />;

  const banner = (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white/95 pt-safe backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-6">
      <Link href="/dashboard/uitnodiging" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-700 hover:bg-rose-50">
        <ArrowLeft className="size-4" aria-hidden /> <span className="hidden sm:inline">Terug naar editor</span>
      </Link>
      <span className="hidden text-sm text-ink-500 md:inline">Voorbeeld als:</span>
      <div className="ml-auto sm:ml-0">
        <Segmented
          id="preview-as"
          value={as}
          onChange={setAs}
          options={[
            ["day", "Daggast"],
            ["evening", "Avondgast"],
            ["public", "Openbaar"],
          ]}
        />
      </div>
      </div>
    </div>
  );

  return (
    <div className="pt-[calc(3.5rem+env(safe-area-inset-top))]">
      <InvitationView
        data={data}
        banner={banner}
        rsvp={
          as === "public" ? undefined : (
            <div className="card mx-auto max-w-lg p-8 text-center text-ink-500">Hier vullen gasten hun RSVP in (dag/avond, dieetwensen, +1).</div>
          )
        }
      />
    </div>
  );
}
