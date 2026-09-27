import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";

export function RingsMark({ className }: { className?: string }) {
  const id = `lg-gold-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#e2c992" />
          <stop offset="1" stopColor="#9a7535" />
        </linearGradient>
      </defs>
      <circle cx="15" cy="23" r="10" fill="none" stroke={`url(#${id})`} strokeWidth="2.6" />
      <circle cx="25" cy="23" r="10" fill="none" stroke="#c8527a" strokeWidth="2.6" />
      <path d="M25 6.5l2.2 2.6L25 11.7l-2.2-2.6z" fill="#e2c992" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Ja, ik wil! – home">
      <RingsMark className="size-9 transition-transform duration-500 group-hover:rotate-[8deg]" />
      <span className="font-script text-[28px] leading-none text-rose-700">Ja, ik wil!</span>
    </Link>
  );
}
