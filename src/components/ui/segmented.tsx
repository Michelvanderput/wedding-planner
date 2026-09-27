"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  id,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
  id: string;
}) {
  return (
    <div className="inline-flex shrink-0 rounded-full bg-ivory-deep p-1" role="radiogroup">
      {options.map(([v, l]) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn("relative min-h-9 rounded-full px-3.5 text-sm transition-colors", value === v ? "font-medium text-rose-700" : "text-ink-500 hover:text-ink-900")}
        >
          {value === v && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-white shadow-sm" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
          <span className="relative">{l}</span>
        </button>
      ))}
    </div>
  );
}
