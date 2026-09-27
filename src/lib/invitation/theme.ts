import type { CSSProperties } from "react";

// ── Keuzes ─────────────────────────────────────────────────────────────
export type FontId = "klassiek" | "kalligrafie" | "parijs" | "speels" | "handgeschreven" | "modern" | "tijdloos" | "artdeco" | "boho" | "editorial";
export type PatternId = "none" | "glow" | "dots" | "linen" | "botanical" | "deco" | "stars";
export type DecorationId = "sprigs" | "petals" | "sprigs-petals" | "sparkles" | "deco" | "none";
export type HeroId = "centered" | "arch" | "split" | "full";
export type CornerId = "round" | "soft" | "sharp";
export type DividerId = "diamond" | "heart" | "flower" | "dots" | "line";
export type EmblemId = "rings" | "monogram" | "heart" | "none";
export type MotionId = "rich" | "subtle" | "none";
export type SectionId = "welkom" | "programma" | "locatie" | "praktisch" | "vragen" | "rsvp" | "contact";

export interface InvitationTheme {
  preset: string;
  accent: string;
  accent2: string;
  accent3: string;
  background: string;
  fonts: FontId;
  pattern: PatternId;
  decoration: DecorationId;
  hero: HeroId;
  corners: CornerId;
  divider: DividerId;
  emblem: EmblemId;
  motion: MotionId;
  countdown: boolean;
  calendar: boolean;
  sections: SectionId[];
  hidden: SectionId[];
  tagline: string;
  closing: string;
}

export const SECTION_LABEL: Record<SectionId, string> = {
  welkom: "Welkom",
  programma: "Programma",
  locatie: "Locatie",
  praktisch: "Praktische info",
  vragen: "Veelgestelde vragen",
  rsvp: "RSVP",
  contact: "Contact ceremoniemeester",
};
export const DEFAULT_SECTIONS: SectionId[] = ["welkom", "programma", "locatie", "praktisch", "vragen", "rsvp", "contact"];

// ── Lettertypecombinaties ──────────────────────────────────────────────
export interface FontPairing {
  id: FontId;
  label: string;
  hint: string;
  script: string; // namen & sierteksten
  heading: string;
  body: string;
  /** Schaal voor de namen (hoofdletterfonts zijn breder dan schrijfletters). */
  nameScale: number;
  nameCase?: "uppercase";
  nameTracking?: string;
}

export const FONT_PAIRINGS: FontPairing[] = [
  { id: "klassiek", label: "Klassiek romantisch", hint: "Great Vibes · Cormorant", script: "var(--font-great-vibes)", heading: "var(--font-cormorant)", body: "var(--font-dm-sans)", nameScale: 1 },
  { id: "kalligrafie", label: "Kalligrafie", hint: "Pinyon Script · Playfair", script: "var(--ff-pinyon)", heading: "var(--ff-playfair)", body: "var(--ff-montserrat)", nameScale: 0.86 },
  { id: "parijs", label: "Parisienne", hint: "Parisienne · Cormorant", script: "var(--ff-parisienne)", heading: "var(--font-cormorant)", body: "var(--ff-josefin)", nameScale: 0.92 },
  { id: "speels", label: "Speels", hint: "Dancing Script · Quicksand", script: "var(--ff-dancing)", heading: "var(--ff-quicksand)", body: "var(--ff-quicksand)", nameScale: 0.84 },
  { id: "handgeschreven", label: "Handgeschreven", hint: "Allura · Lora", script: "var(--ff-allura)", heading: "var(--ff-lora)", body: "var(--ff-lora)", nameScale: 1.04 },
  { id: "modern", label: "Modern", hint: "Italiana · Montserrat", script: "var(--ff-italiana)", heading: "var(--ff-italiana)", body: "var(--ff-montserrat)", nameScale: 0.66, nameTracking: "0.02em" },
  { id: "tijdloos", label: "Tijdloos", hint: "Cinzel · EB Garamond", script: "var(--ff-cinzel)", heading: "var(--ff-cinzel)", body: "var(--ff-garamond)", nameScale: 0.5, nameCase: "uppercase", nameTracking: "0.06em" },
  { id: "artdeco", label: "Art deco", hint: "Poiret One · Josefin Sans", script: "var(--ff-poiret)", heading: "var(--ff-poiret)", body: "var(--ff-josefin)", nameScale: 0.58, nameCase: "uppercase", nameTracking: "0.08em" },
  { id: "boho", label: "Boho", hint: "Dancing Script · Marcellus", script: "var(--ff-dancing)", heading: "var(--ff-marcellus)", body: "var(--ff-josefin)", nameScale: 0.84 },
  { id: "editorial", label: "Editorial", hint: "Playfair italic · DM Sans", script: "var(--ff-playfair)", heading: "var(--ff-playfair)", body: "var(--font-dm-sans)", nameScale: 0.62 },
];

// ── Thema's ────────────────────────────────────────────────────────────
type Look = Omit<InvitationTheme, "countdown" | "calendar" | "sections" | "hidden" | "tagline" | "closing">;

export const PRESETS: (Look & { label: string; hint: string; dark?: boolean })[] = [
  { preset: "romantisch", label: "Romantisch roze", hint: "Rozenblad, champagne & takjes", accent: "#ae3b63", accent2: "#b8904a", accent3: "#7d9a78", background: "#fbf7f4", fonts: "klassiek", pattern: "glow", decoration: "sprigs-petals", hero: "centered", corners: "round", divider: "diamond", emblem: "rings", motion: "rich" },
  { preset: "klassiek", label: "Klassiek ivoor & goud", hint: "Tijdloos, ingetogen, chique", accent: "#7a5b28", accent2: "#c2a063", accent3: "#6f7d6a", background: "#fffdf8", fonts: "tijdloos", pattern: "linen", decoration: "none", hero: "centered", corners: "soft", divider: "line", emblem: "monogram", motion: "subtle" },
  { preset: "botanisch", label: "Botanisch salie", hint: "Groen, natuurlijk, tuinfeest", accent: "#4f6b4b", accent2: "#b8904a", accent3: "#8fa582", background: "#f5f7f1", fonts: "handgeschreven", pattern: "botanical", decoration: "sprigs", hero: "arch", corners: "round", divider: "flower", emblem: "rings", motion: "rich" },
  { preset: "modern", label: "Modern minimal", hint: "Zwart-wit, strak, veel ruimte", accent: "#1f1f1f", accent2: "#8a8a8a", accent3: "#b5b5b5", background: "#ffffff", fonts: "modern", pattern: "none", decoration: "none", hero: "split", corners: "sharp", divider: "line", emblem: "monogram", motion: "subtle" },
  { preset: "boho", label: "Boho terracotta", hint: "Aards, warm, vrij", accent: "#a8502f", accent2: "#c9a27e", accent3: "#8a9a5b", background: "#faf3eb", fonts: "boho", pattern: "dots", decoration: "petals", hero: "arch", corners: "round", divider: "flower", emblem: "heart", motion: "rich" },
  { preset: "nachtblauw", label: "Nachtblauw & goud", hint: "Avondfeest onder de sterren", accent: "#d4af6a", accent2: "#a9bde0", accent3: "#8394bf", background: "#0f1b33", fonts: "kalligrafie", pattern: "stars", decoration: "sparkles", hero: "centered", corners: "soft", divider: "diamond", emblem: "rings", motion: "rich", dark: true },
  { preset: "lavendel", label: "Lavendel", hint: "Zacht paars, dromerig", accent: "#6d4f99", accent2: "#c7a76c", accent3: "#9db29a", background: "#f8f5fb", fonts: "parijs", pattern: "glow", decoration: "petals", hero: "centered", corners: "round", divider: "heart", emblem: "rings", motion: "rich" },
  { preset: "mediterraan", label: "Mediterraan", hint: "Zeeblauw, citroen, zon", accent: "#1f5fa8", accent2: "#c99a1c", accent3: "#6e9e75", background: "#fbfaf6", fonts: "speels", pattern: "dots", decoration: "sprigs", hero: "split", corners: "soft", divider: "dots", emblem: "heart", motion: "rich" },
  { preset: "bordeaux", label: "Herfst bordeaux", hint: "Diep rood, koper, warm", accent: "#7a1f32", accent2: "#b57a35", accent3: "#7a6a3a", background: "#fbf6f1", fonts: "kalligrafie", pattern: "linen", decoration: "sprigs", hero: "centered", corners: "round", divider: "flower", emblem: "monogram", motion: "subtle" },
  { preset: "perzik", label: "Zomerse perzik", hint: "Fris, zonnig, vrolijk", accent: "#b4553a", accent2: "#dc9a5e", accent3: "#8fae80", background: "#fff7f1", fonts: "speels", pattern: "glow", decoration: "petals", hero: "arch", corners: "round", divider: "heart", emblem: "heart", motion: "rich" },
  { preset: "artdeco", label: "Art deco", hint: "Gatsby, zwart & goud", accent: "#cfae63", accent2: "#e9dcc0", accent3: "#8c7a55", background: "#121212", fonts: "artdeco", pattern: "deco", decoration: "deco", hero: "centered", corners: "sharp", divider: "diamond", emblem: "monogram", motion: "subtle", dark: true },
  { preset: "winter", label: "Winters", hint: "IJsblauw, zilver, sprankelend", accent: "#35637f", accent2: "#9aaebf", accent3: "#8fa9b8", background: "#f4f8fb", fonts: "editorial", pattern: "dots", decoration: "sparkles", hero: "centered", corners: "soft", divider: "dots", emblem: "rings", motion: "rich" },
];

/** Welk thema past bij de stijl uit de onboarding. */
export const PRESET_FOR_STYLE: Record<string, string> = {
  Romantisch: "romantisch",
  Boho: "boho",
  Klassiek: "klassiek",
  "Modern minimalistisch": "modern",
  Rustiek: "botanisch",
  Tuinfeest: "botanisch",
};

export const DEFAULT_THEME: InvitationTheme = {
  ...PRESETS[0],
  countdown: true,
  calendar: true,
  sections: DEFAULT_SECTIONS,
  hidden: [],
  tagline: "",
  closing: "",
};

/** Vult een (gedeeltelijk) opgeslagen thema aan tot een volledig thema. */
export function resolveTheme(t?: Partial<InvitationTheme> | null): InvitationTheme {
  const merged = { ...DEFAULT_THEME, ...(t ?? {}) } as InvitationTheme;
  const known = merged.sections.filter((s) => DEFAULT_SECTIONS.includes(s));
  merged.sections = [...known, ...DEFAULT_SECTIONS.filter((s) => !known.includes(s))];
  merged.hidden = (merged.hidden ?? []).filter((s) => s !== "rsvp");
  if (!FONT_PAIRINGS.some((f) => f.id === merged.fonts)) merged.fonts = "klassiek";
  for (const k of ["accent", "accent2", "accent3", "background"] as const) if (!isHex(merged[k])) merged[k] = DEFAULT_THEME[k];
  return merged;
}

/** Past een thema-preset toe, maar laat onderdelen en eigen teksten staan. */
export function applyPreset(current: InvitationTheme, presetId: string): InvitationTheme {
  const p = PRESETS.find((x) => x.preset === presetId);
  if (!p) return current;
  const { label: _l, hint: _h, dark: _d, ...look } = p;
  return { ...current, ...look };
}

// ── Kleurberekeningen ──────────────────────────────────────────────────
export const isHex = (s: unknown): s is string => typeof s === "string" && /^#[0-9a-f]{6}$/i.test(s);

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const h = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return `#${h(r1 + (r2 - r1) * t)}${h(g1 + (g2 - g1) * t)}${h(b1 + (b2 - b1) * t)}`;
}

export const isDark = (t: Pick<InvitationTheme, "background">) => luminance(t.background) < 0.2;

/** Tekstkleur en kaartkleur die bij de achtergrond passen. */
export function derived(t: InvitationTheme) {
  const dark = isDark(t);
  const ink = dark ? "#f5efe6" : "#2b1d22";
  const surface = dark ? mix(t.background, "#ffffff", 0.07) : "#ffffff";
  return { dark, ink, surface };
}

/** Controles voor de editor: is alles goed leesbaar? */
export function contrastIssues(t: InvitationTheme): string[] {
  const { ink, surface } = derived(t);
  const out: string[] = [];
  if (contrast(t.accent, surface) < 4.5) out.push("Knoppen: tekst op de accentkleur is slecht leesbaar. Kies een donkerdere (of bij donkere achtergrond lichtere) accentkleur.");
  if (contrast(ink, t.background) < 7) out.push("De achtergrond is te midden-toon voor goed leesbare tekst. Kies een lichtere of juist donkere achtergrond.");
  return out;
}

/** CSS-variabelen die de kleuren en lettertypen van de app binnen de uitnodiging vervangen. */
export function themeStyle(t: InvitationTheme): CSSProperties {
  const { ink, surface } = derived(t);
  const f = FONT_PAIRINGS.find((x) => x.id === t.fonts) ?? FONT_PAIRINGS[0];
  const radius = { round: ["1.5rem", "1rem", "0.75rem"], soft: ["0.9rem", "0.7rem", "0.55rem"], sharp: ["0.25rem", "0.2rem", "0.15rem"] }[t.corners];
  return {
    "--t-accent": t.accent,
    "--t-accent2": t.accent2,
    "--t-accent3": t.accent3,
    "--t-bg": t.background,
    "--t-ink": ink,
    "--t-surface": surface,
    "--font-script": `${f.script}, cursive`,
    "--font-serif": `${f.heading}, ui-serif, Georgia, serif`,
    "--font-sans": `${f.body}, ui-sans-serif, system-ui, sans-serif`,
    "--inv-name-scale": String(f.nameScale),
    "--inv-name-case": f.nameCase ?? "none",
    "--inv-name-tracking": f.nameTracking ?? "normal",
    "--radius-3xl": radius[0],
    "--radius-2xl": radius[1],
    "--radius-xl": radius[2],
  } as CSSProperties;
}
