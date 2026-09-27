"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Shell } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { useWedding } from "@/lib/store";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { status, reload } = useWedding();
  const router = useRouter();

  useEffect(() => {
    if (status === "no-wedding") router.replace("/onboarding");
    if (status === "unauthenticated") router.replace("/login?next=/dashboard");
  }, [status, router]);

  if (status === "error") {
    return (
      <div className="grid min-h-dvh place-items-center px-4 text-center">
        <div>
          <h1 className="text-3xl font-semibold">Oeps, laden mislukt</h1>
          <p className="mt-2 text-ink-500">Controleer je verbinding en of de database-migratie is uitgevoerd.</p>
          <Button className="mt-6" onClick={() => void reload()}>
            Opnieuw proberen
          </Button>
        </div>
      </div>
    );
  }
  if (status !== "ready") return <Spinner label="Jullie plan wordt geladen…" />;
  return <Shell>{children}</Shell>;
}
