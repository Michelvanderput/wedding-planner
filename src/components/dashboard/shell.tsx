"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Armchair,
  Clock,
  Images,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MailOpen,
  Menu,
  Settings,
  Store,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/decor/logo";
import { useWedding } from "@/lib/store";
import { cn, coupleName, daysUntil } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overzicht", icon: LayoutDashboard },
  { href: "/dashboard/checklist", label: "Takenlijst", icon: ListChecks },
  { href: "/dashboard/gasten", label: "Gasten", icon: Users },
  { href: "/dashboard/budget", label: "Budget", icon: Wallet },
  { href: "/dashboard/leveranciers", label: "Leveranciers", icon: Store },
  { href: "/dashboard/dagplanning", label: "Draaiboek", icon: Clock },
  { href: "/dashboard/tafelschikking", label: "Tafelschikking", icon: Armchair },
  { href: "/dashboard/inspiratie", label: "Inspiratie", icon: Images },
  { href: "/dashboard/uitnodiging", label: "Uitnodiging", icon: MailOpen },
  { href: "/dashboard/instellingen", label: "Instellingen", icon: Settings },
];

const MOBILE = NAV.slice(0, 4);

const isActive = (path: string, href: string) => (href === "/dashboard" ? path === href : path.startsWith(href));

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { wedding, tasks, mode, email, signOut } = useWedding();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);

  const done = tasks.filter((t) => t.done).length;
  const days = daysUntil(wedding?.wedding_date);

  async function logout() {
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  const nav = (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(path, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-[15px] transition-colors duration-200",
              active ? "font-medium text-rose-800" : "text-ink-700 hover:bg-white/70 hover:text-ink-900",
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-2xl bg-white shadow-[var(--shadow-soft)] ring-1 ring-rose-100"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
            <item.icon
              className={cn(
                "relative size-[18px] transition-transform duration-200 group-hover:scale-110",
                active ? "text-rose-600" : "text-ink-500",
              )}
              aria-hidden
            />
            <span className="relative">{item.label}</span>
            {item.href === "/dashboard/checklist" && tasks.length > 0 && (
              <span className="relative ml-auto text-xs text-ink-500 tabular-nums">
                {done}/{tasks.length}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="mt-auto space-y-3 pt-6">
      <div className="rounded-2xl bg-gradient-to-br from-rose-100/80 to-gold-100/80 p-4">
        <p className="font-script text-2xl leading-tight text-rose-700">
          {coupleName(wedding?.partner_one, wedding?.partner_two)}
        </p>
        <p className="mt-1 text-sm text-ink-700">
          {days === null ? "Datum nog te bepalen" : days > 0 ? `Nog ${days} dagen` : days === 0 ? "Vandaag is de dag!" : "Getrouwd ♥"}
        </p>
      </div>
      {mode === "supabase" ? (
        <button
          onClick={logout}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3.5 text-sm text-ink-500 transition hover:bg-white/70 hover:text-ink-900"
        >
          <LogOut className="size-4" aria-hidden />
          <span className="truncate">Uitloggen{email ? ` · ${email}` : ""}</span>
        </button>
      ) : (
        <p className="px-3.5 text-xs text-ink-500">Lokale modus – gegevens staan in deze browser.</p>
      )}
    </div>
  );

  return (
    <div className="paper min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-line/70 bg-ivory/80 px-5 py-6 backdrop-blur-xl lg:flex">
        <Logo href="/dashboard" className="mb-8 px-2" />
        {nav}
        {footer}
      </aside>

      {/* Mobiele topbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/70 bg-ivory/80 px-4 backdrop-blur-xl lg:hidden">
        <Logo href="/dashboard" />
        <button
          onClick={() => setOpen(true)}
          className="grid size-11 place-items-center rounded-full text-ink-700 hover:bg-white"
          aria-label="Menu openen"
          aria-expanded={open}
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Mobiele drawer */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-ink-900/30 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 right-0 flex w-[85%] max-w-xs flex-col bg-ivory px-5 py-5 shadow-[var(--shadow-lift)]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%", transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-serif text-xl font-semibold">Menu</span>
                <button onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full hover:bg-white" aria-label="Menu sluiten">
                  <X className="size-5" />
                </button>
              </div>
              <div className="overflow-y-auto">{nav}</div>
              {footer}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="px-4 pt-6 pb-28 sm:px-6 lg:ml-72 lg:px-10 lg:pt-10 lg:pb-16">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* Mobiele bottom nav */}
      <nav
        aria-label="Snelmenu"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {MOBILE.map((item) => {
            const active = isActive(path, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                    active ? "font-medium text-rose-700" : "text-ink-500",
                  )}
                >
                  <item.icon className="size-5" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button onClick={() => setOpen(true)} className="flex min-h-16 w-full flex-col items-center justify-center gap-1 text-[11px] text-ink-500">
              <Menu className="size-5" aria-hidden />
              Meer
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
