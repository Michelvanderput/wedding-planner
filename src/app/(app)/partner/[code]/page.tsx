"use client";

import { motion } from "framer-motion";
import { HeartHandshake } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RingsMark } from "@/components/decor/logo";
import { Petals } from "@/components/decor/petals";
import { ButtonLink } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { acceptPartnerInvite } from "@/lib/partner";
import { useWedding } from "@/lib/store";

/** Partner opent de uitnodigingslink → wordt mede-beheerder van de bruiloft. */
export default function PartnerInvitePage() {
  const { code } = useParams<{ code: string }>();
  const { status, mode, wedding, reload } = useWedding();
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (status === "loading" || started.current) return;
    if (mode === "local") {
      setError("Samen plannen werkt alleen als de app aan Supabase is gekoppeld.");
      return;
    }
    if (status === "unauthenticated") {
      router.replace(`/login?next=/partner/${code}`);
      return;
    }
    started.current = true;
    acceptPartnerInvite(code)
      .then(async (weddingId) => {
        if (wedding && wedding.id !== weddingId) throw new Error("Je beheert al een andere bruiloft.");
        await reload();
        toast.success("Welkom!", "Jullie plannen nu samen.");
        router.replace("/dashboard");
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Er ging iets mis."));
  }, [status, mode, code, wedding, reload, router, toast]);

  if (!error) return <Spinner label="Uitnodiging accepteren…" />;

  return (
    <main className="paper relative grid min-h-dvh place-items-center px-4">
      <Petals count={8} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card relative max-w-md p-8 text-center">
        <RingsMark className="mx-auto size-12" />
        <div className="mx-auto mt-5 grid size-14 place-items-center rounded-full bg-rose-50">
          <HeartHandshake className="size-7 text-rose-600" aria-hidden />
        </div>
        <h1 className="mt-4 text-3xl font-semibold">Dat lukte niet</h1>
        <p className="mt-2 text-ink-500">{error}</p>
        <ButtonLink href={wedding ? "/dashboard" : "/onboarding"} className="mt-6">
          {wedding ? "Naar het dashboard" : "Terug"}
        </ButtonLink>
      </motion.div>
    </main>
  );
}
