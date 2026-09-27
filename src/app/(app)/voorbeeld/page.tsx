"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InvitationView } from "@/components/invitation/invitation-view";
import { Segmented } from "@/components/ui/segmented";
import { Spinner } from "@/components/ui/misc";
import { useWedding } from "@/lib/store";
import { buildPreviewData, readDraft, type PreviewAs as As } from "@/lib/invitation/preview";
import type { InvitationData, SiteContent } from "@/lib/types";

/** Voorbeeld van de uitnodiging, opgebouwd uit de eigen (nog niet opgeslagen) gegevens. */
export default function PreviewPage() {
  const { wedding, timeline_events, status, gifts, gift_claims, guestbook } = useWedding();
  const [as, setAs] = useState<As>("day");

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("als");
    if (v === "public" || v === "day" || v === "evening") setAs(v);
  }, []);

  // Toon nog niet opgeslagen wijzigingen uit de editor, als die er zijn.
  const [draft, setDraft] = useState<SiteContent | null>(null);
  useEffect(() => {
    if (wedding) setDraft(readDraft(wedding.id));
  }, [wedding]);

  const data = useMemo<InvitationData | null>(
    () => (wedding ? buildPreviewData(wedding, timeline_events, draft ?? wedding.site, as, { gifts, claims: gift_claims, guestbook }) : null),
    [wedding, timeline_events, draft, as, gifts, gift_claims, guestbook],
  );

  if (status !== "ready" || !data) return <Spinner label="Voorbeeld laden…" />;

  const banner = (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white/95 pt-safe backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-6">
      <Link href="/dashboard/uitnodiging" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-700 hover:bg-rose-50">
        <ArrowLeft className="size-4" aria-hidden /> <span className="hidden sm:inline">Terug naar editor</span>
      </Link>
      <span className="hidden text-sm text-ink-500 md:inline">Voorbeeld als gast:</span>
      <div className="ml-auto sm:ml-0">
        <Segmented
          id="preview-as"
          value={as}
          onChange={setAs}
          options={[
            ["day", "Dag"],
            ["evening", "Avond"],
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
