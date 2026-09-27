"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { haptic } from "@/lib/pwa/haptics";

/** Zwevende hoofdactie op mobiel (boven de tabbalk), zoals in native apps. */
export function Fab({ label, icon: Icon, onClick }: { label: string; icon: LucideIcon; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={() => {
        haptic();
        onClick();
      }}
      aria-label={label}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 420, damping: 24, delay: 0.15 }}
      className="fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-30 grid size-14 print:hidden place-items-center rounded-full bg-rose-600 text-white shadow-[0_12px_30px_-8px_rgb(174_59_99/0.6)] sm:hidden"
    >
      <Icon className="size-6" aria-hidden />
    </motion.button>
  );
}
