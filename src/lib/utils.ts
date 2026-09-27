import clsx, { type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });

export const nowIso = () => new Date().toISOString();

const euro = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
export const formatEuro = (n: number | null | undefined) => euro.format(Number(n) || 0);

/** Parse yyyy-mm-dd as a local date (avoids timezone shifts). */
export const parseDate = (d: string | null | undefined) => {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
};

export const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const formatDate = (d: string | null | undefined, opts?: Intl.DateTimeFormatOptions) => {
  const date = parseDate(d);
  if (!date) return "";
  return date.toLocaleDateString("nl-NL", opts ?? { day: "numeric", month: "long", year: "numeric" });
};

export const formatDateShort = (d: string | null | undefined) =>
  formatDate(d, { day: "numeric", month: "short" });

export const startOfToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

export const daysUntil = (d: string | null | undefined) => {
  const date = parseDate(d);
  if (!date) return null;
  return Math.round((date.getTime() - startOfToday().getTime()) / 86_400_000);
};

export const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export const coupleName = (a?: string, b?: string) =>
  [a, b].filter((s) => s && s.trim()).join(" & ") || "Jullie bruiloft";
