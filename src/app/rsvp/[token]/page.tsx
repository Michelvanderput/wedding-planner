import type { Metadata } from "next";
import { InvitationView } from "@/components/invitation/invitation-view";
import { InvitationUnavailable } from "@/components/invitation/unavailable";
import { loadInvitation } from "@/lib/invitation/load";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { RsvpForm } from "./rsvp-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await loadInvitation((await params).token).catch(() => null);
  return {
    title: data ? `Uitnodiging ${data.partner_one} & ${data.partner_two}` : "Uitnodiging",
    robots: { index: false, follow: false },
  };
}

export default async function PersonalInvitationPage({ params }: Props) {
  const { token } = await params;
  if (!isSupabaseConfigured) {
    return <InvitationUnavailable title="Uitnodiging niet beschikbaar" body="Deze site is nog niet gekoppeld aan een database." />;
  }
  const data = await loadInvitation(token).catch(() => null);
  if (!data?.guest) {
    return (
      <InvitationUnavailable
        title="Uitnodiging niet gevonden"
        body="Controleer of je de volledige link hebt gebruikt, of neem contact op met het bruidspaar."
      />
    );
  }
  return <InvitationView data={data} rsvp={<RsvpForm token={token} guest={data.guest} couple={`${data.partner_one} & ${data.partner_two}`} />} />;
}
