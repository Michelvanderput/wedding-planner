"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Shell } from "@/components/dashboard/shell";
import { LoadError } from "@/components/dashboard/load-error";
import { Spinner } from "@/components/ui/misc";
import { useWedding } from "@/lib/store";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { status } = useWedding();
  const router = useRouter();

  useEffect(() => {
    if (status === "no-wedding") router.replace("/onboarding");
    if (status === "unauthenticated") router.replace("/login?next=/dashboard");
  }, [status, router]);

  if (status === "error") return <LoadError />;
  if (status !== "ready") return <Spinner label="Jullie plan wordt geladen…" />;
  return <Shell>{children}</Shell>;
}
