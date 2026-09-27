"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/lib/pwa/use-install";

const DISMISS_KEY = "bruiloftsplanner:install-dismissed";

/** Uitleg + knop om de app op het beginscherm te zetten. `compact` = wegklikbare banner op het dashboard. */
export function InstallCard({ compact = false }: { compact?: boolean }) {
  const { state, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(compact && localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, [compact]);

  const show = state === "available" || state === "ios";
  if (compact && (dismissed || !show)) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // geen opslag
    }
  }

  const body =
    state === "installed"
      ? "De app staat op je beginscherm. Open hem daar voor het volledige app-gevoel."
      : state === "available"
        ? "Zet de planner op je beginscherm: opent volledig scherm, zonder adresbalk."
        : state === "ios"
          ? "Tik in Safari op Deel en kies 'Zet op beginscherm'. De planner opent dan als app."
          : "Open deze pagina op je telefoon om de planner als app op je beginscherm te zetten.";

  const content = (
    <div className={compact ? "flex items-start gap-3" : ""}>
      {compact && (
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-rose-600">
          <Smartphone className="size-5" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {!compact && (
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-rose-50 text-rose-600">
              <Smartphone className="size-5" aria-hidden />
            </span>
            <h2 className="text-xl font-semibold">App op je telefoon</h2>
          </div>
        )}
        {compact && <p className="font-medium text-ink-900">Gebruik de planner als app</p>}
        <p className={compact ? "mt-0.5 text-sm text-ink-700" : "mt-3 text-sm text-ink-700"}>
          {state === "ios" ? (
            <>
              Tik in Safari op <Share className="inline size-4 align-text-bottom text-rose-600" aria-label="Deel" /> en kies{" "}
              <strong>Zet op beginscherm</strong>.
            </>
          ) : (
            body
          )}
        </p>
        {state === "available" && (
          <Button size="sm" className="mt-3" onClick={() => void install()}>
            <Download className="size-4" aria-hidden /> Installeer app
          </Button>
        )}
      </div>
      {compact && (
        <button onClick={dismiss} className="-m-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-white" aria-label="Melding sluiten">
          <X className="size-4" />
        </button>
      )}
    </div>
  );

  if (!compact) return <section className="card p-6">{content}</section>;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-3xl border border-rose-100 bg-gradient-to-r from-rose-50 to-gold-50 p-4 lg:hidden"
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}
