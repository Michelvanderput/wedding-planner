import type { Metadata } from "next";
import { RsvpCard } from "./rsvp-card";

export const metadata: Metadata = { title: "RSVP", robots: { index: false } };

export default async function RsvpPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <RsvpCard token={token} />;
}
