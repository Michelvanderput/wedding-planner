import type { Metadata } from "next";
import { InvitationView } from "@/components/invitation/invitation-view";
import { InvitationUnavailable } from "@/components/invitation/unavailable";
import { loadWeddingSite } from "@/lib/invitation/load";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await loadWeddingSite((await params).slug).catch(() => null);
  if (!data) return { title: "Uitnodiging", robots: { index: false } };
  const title = `${data.partner_one} & ${data.partner_two} gaan trouwen`;
  const description = [formatDate(data.wedding_date), data.venue, data.city].filter(Boolean).join(" · ");
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, images: data.site.hero_image ? [data.site.hero_image] : undefined },
  };
}

export default async function WeddingSitePage({ params }: Props) {
  const data = await loadWeddingSite((await params).slug).catch(() => null);
  if (!data) {
    return (
      <InvitationUnavailable
        title="Deze pagina is (nog) niet beschikbaar"
        body="Het bruidspaar heeft deze uitnodiging nog niet gepubliceerd, of de link klopt niet."
      />
    );
  }
  return <InvitationView data={data} />;
}
