"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  // onClose is vaak een inline functie (elke render nieuw). Via een ref hoeft het effect
  // daardoor niet opnieuw te draaien bij elke toetsaanslag; anders sprong de focus steeds
  // terug naar het eerste veld.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && panel.current) {
        const els = panel.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      panel.current?.querySelector<HTMLElement>("input,select,textarea")?.focus();
    }, 60);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      lastFocus.current?.focus?.();
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center pt-safe sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink-900/30 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.16 } }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-[var(--shadow-lift)] sm:rounded-3xl ${
              size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg"
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 pt-6 pb-4">
              <div>
                <h2 id={titleId} className="text-2xl font-semibold text-ink-900">
                  {title}
                </h2>
                {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="-mt-1 -mr-2 rounded-full p-2.5 text-ink-500 transition hover:bg-rose-50 hover:text-rose-700"
                aria-label="Sluiten"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
            {footer && (
              <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-ivory/60 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
