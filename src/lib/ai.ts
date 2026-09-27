"use client";

import { useEffect, useState } from "react";

export type AiTask = "checklist" | "timeline" | "invitation" | "vendor_email" | "image_prompt" | "coach" | "welcome" | "faq";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Er ging iets mis");
  return data as T;
}

export const aiText = (task: AiTask, context: Record<string, unknown>) =>
  post<{ text?: string; items?: unknown[] }>("/api/ai/text", { task, context });

export const aiImage = (prompt: string) => post<{ url: string }>("/api/ai/image", { prompt });

let cached: boolean | null = null;

/** Is er een FAL_KEY ingesteld op de server? */
export function useAiEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(cached);
  useEffect(() => {
    if (cached !== null) return;
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d: { enabled: boolean }) => {
        cached = d.enabled;
        setEnabled(d.enabled);
      })
      .catch(() => setEnabled(false));
  }, []);
  return enabled;
}
