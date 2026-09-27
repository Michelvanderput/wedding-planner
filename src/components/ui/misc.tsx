"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 26 } },
};

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}

export function Rise({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={rise} className={cn("min-w-0", className)}>
      {children}
    </motion.div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        {eyebrow && <p className="font-script text-2xl text-gold-600">{eyebrow}</p>}
        <h1 className="text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </motion.header>
  );
}

const BADGE = {
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  gold: "bg-gold-50 text-gold-700 ring-gold-200",
  sage: "bg-sage-50 text-sage-700 ring-sage-200",
  ink: "bg-ivory text-ink-700 ring-line",
};

export function Badge({
  tone = "ink",
  children,
  className,
}: {
  tone?: keyof typeof BADGE;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        BADGE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card flex flex-col items-center px-6 py-14 text-center"
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 animate-ping rounded-full bg-rose-100 opacity-40 [animation-duration:3s]" />
        <div className="relative grid size-16 place-items-center rounded-full bg-gradient-to-br from-rose-50 to-gold-50 ring-1 ring-rose-100">
          <Icon className="size-7 text-rose-500" aria-hidden />
        </div>
      </div>
      <h3 className="text-2xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-ink-500">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  label,
  children,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  label: string;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-rose-500)" />
            <stop offset="100%" stopColor="var(--color-gold-400)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-rose-100)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * (1 - v) : c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Bar({ value, tone = "rose", label }: { value: number; tone?: "rose" | "gold" | "sage"; label: string }) {
  const v = Math.max(0, Math.min(1, value));
  const color = { rose: "bg-rose-500", gold: "bg-gold-500", sage: "bg-sage-500" }[tone];
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-ivory-deep"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
    >
      <motion.div
        className={cn("h-full origin-left rounded-full", color)}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: v }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export function Spinner({ label = "Laden…" }: { label?: string }) {
  return (
    <div className="grid min-h-[60dvh] place-items-center" role="status">
      <div className="flex flex-col items-center gap-4">
        <motion.svg
          viewBox="0 0 48 48"
          className="size-12 text-rose-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          aria-hidden
        >
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="24" cy="12" rx="6" ry="11" fill="currentColor" opacity="0.55" transform={`rotate(${a} 24 24)`} />
          ))}
          <circle cx="24" cy="24" r="4" fill="var(--color-gold-400)" />
        </motion.svg>
        <p className="font-serif text-lg text-ink-500 italic">{label}</p>
      </div>
    </div>
  );
}
