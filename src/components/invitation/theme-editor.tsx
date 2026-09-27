"use client";

import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Palette, RotateCcw, Sparkles, TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Toggle } from "@/components/ui/field";
import { invitationFontVars } from "@/lib/invitation/fonts";
import {
  FONT_PAIRINGS,
  PRESETS,
  PRESET_FOR_STYLE,
  SECTION_LABEL,
  applyPreset,
  contrastIssues,
  isHex,
  themeStyle,
  type CornerId,
  type DecorationId,
  type DividerId,
  type EmblemId,
  type HeroId,
  type InvitationTheme,
  type MotionId,
  type PatternId,
  type SectionId,
} from "@/lib/invitation/theme";
import { cn } from "@/lib/utils";

interface Props {
  theme: InvitationTheme;
  onChange: (t: InvitationTheme) => void;
  style?: string; // stijl uit de onboarding, voor een suggestie
  names: [string, string];
  hasImage: boolean;
}

/** Extra kant-en-klare kleurpaletten (bovenop de thema's). */
const PALETTES: { label: string; accent: string; accent2: string; accent3: string; background: string }[] = [
  { label: "Oudroze", accent: "#9e4f5f", accent2: "#c9a27e", accent3: "#8a9a86", background: "#fbf6f4" },
  { label: "Eucalyptus", accent: "#3f6b5e", accent2: "#c2a063", accent3: "#9bb3a4", background: "#f4f7f5" },
  { label: "Champagne", accent: "#8a6a3c", accent2: "#d8c09a", accent3: "#a79a86", background: "#fdfaf4" },
  { label: "Dusty blue", accent: "#3f5f80", accent2: "#c7a877", accent3: "#9fb1c4", background: "#f5f8fb" },
  { label: "Fuchsia", accent: "#a02b6b", accent2: "#e2a33d", accent3: "#6b8f71", background: "#fff7fb" },
  { label: "Olijf", accent: "#5b6532", accent2: "#c08a3e", accent3: "#9aa17a", background: "#f8f7f0" },
  { label: "Smaragd nacht", accent: "#e0c07a", accent2: "#7fc3a4", accent3: "#6e9e8c", background: "#0f2a24" },
  { label: "Bordeaux nacht", accent: "#e6b8a2", accent2: "#d9a45a", accent3: "#b07a7a", background: "#2a0f17" },
];

const PATTERNS: { id: PatternId; label: string }[] = [
  { id: "none", label: "Effen" },
  { id: "glow", label: "Zacht verloop" },
  { id: "dots", label: "Stippen" },
  { id: "linen", label: "Linnen" },
  { id: "botanical", label: "Botanisch" },
  { id: "deco", label: "Art deco" },
  { id: "stars", label: "Sterrenhemel" },
];
const DECORATIONS: { id: DecorationId; label: string }[] = [
  { id: "sprigs-petals", label: "Takjes + blaadjes" },
  { id: "sprigs", label: "Takjes" },
  { id: "petals", label: "Vallende blaadjes" },
  { id: "sparkles", label: "Sterretjes" },
  { id: "deco", label: "Art-deco hoeken" },
  { id: "none", label: "Geen" },
];
const HEROES: { id: HeroId; label: string; needsImage?: boolean }[] = [
  { id: "centered", label: "Gecentreerd" },
  { id: "arch", label: "Foto in boog" },
  { id: "split", label: "Foto naast tekst" },
  { id: "full", label: "Foto volledig", needsImage: true },
];
const CORNERS: { id: CornerId; label: string }[] = [
  { id: "round", label: "Rond" },
  { id: "soft", label: "Zacht" },
  { id: "sharp", label: "Strak" },
];
const DIVIDERS: { id: DividerId; label: string }[] = [
  { id: "diamond", label: "Ruit" },
  { id: "heart", label: "Hartje" },
  { id: "flower", label: "Bloem" },
  { id: "dots", label: "Stipjes" },
  { id: "line", label: "Lijn" },
];
const EMBLEMS: { id: EmblemId; label: string }[] = [
  { id: "rings", label: "Ringen" },
  { id: "monogram", label: "Monogram" },
  { id: "heart", label: "Hartje" },
  { id: "none", label: "Geen" },
];
const MOTIONS: { id: MotionId; label: string; hint: string }[] = [
  { id: "rich", label: "Uitbundig", hint: "Alle animaties en bewegende versiering" },
  { id: "subtle", label: "Subtiel", hint: "Zachte overgangen" },
  { id: "none", label: "Stil", hint: "Geen beweging" },
];
const TAGLINES = ["Save the date", "Wij gaan trouwen", "Wij zeggen ja!", "Samen verder", "je bent van harte uitgenodigd"];
const CLOSINGS = ["Wij kijken ernaar uit!", "Liefs, en tot dan", "Dansschoenen mee!", "Het wordt een feest"];

function Group({ title, icon, children, defaultOpen = false }: { title: string; icon?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group card overflow-hidden">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 font-serif text-xl font-semibold [&::-webkit-details-marker]:hidden">
        {icon}
        <span className="flex-1">{title}</span>
        <span className="text-ink-500 transition-transform duration-300 group-open:rotate-180" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="border-t border-line px-5 py-5">{children}</div>
    </details>
  );
}

function Chip({ active, onClick, children, disabled, title }: { active: boolean; onClick: () => void; children: ReactNode; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition disabled:opacity-40",
        active ? "border-rose-400 bg-rose-50 font-medium text-rose-800" : "border-line bg-white text-ink-700 hover:border-rose-200",
      )}
    >
      {active && <Check className="size-3.5" aria-hidden />}
      {children}
    </button>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-line bg-white p-2 pr-3">
      <input
        type="color"
        value={value}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value);
        }}
        className="size-10 shrink-0 cursor-pointer rounded-xl border-0 bg-transparent p-0"
        aria-label={`${label} kiezen`}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink-900">{label}</span>
        <input
          value={text === value ? value : text}
          onChange={(e) => {
            const v = e.target.value.trim();
            setText(v);
            if (isHex(v)) onChange(v.toLowerCase());
          }}
          className="w-24 bg-transparent font-mono text-xs text-ink-500 uppercase focus:outline-none"
          aria-label={`${label} als hexcode`}
          maxLength={7}
        />
      </span>
    </label>
  );
}

export function ThemeEditor({ theme, onChange, style, names, hasImage }: Props) {
  const set = <K extends keyof InvitationTheme>(k: K, v: InvitationTheme[K]) => onChange({ ...theme, [k]: v });
  /** Eigen kleuren: het thema wordt een eigen variant (geen preset meer actief). */
  const custom = (patch: Partial<InvitationTheme>) => onChange({ ...theme, ...patch, preset: "eigen" });
  const suggested = style ? PRESET_FOR_STYLE[style] : undefined;
  const issues = contrastIssues(theme);
  const [a, b] = names;

  function move(s: SectionId, dir: -1 | 1) {
    const list = [...theme.sections];
    const i = list.indexOf(s);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    set("sections", list);
  }
  function toggleHidden(s: SectionId) {
    set("hidden", theme.hidden.includes(s) ? theme.hidden.filter((x) => x !== s) : [...theme.hidden, s]);
  }

  return (
    <div className={cn("space-y-4", invitationFontVars)}>
      {/* Thema's */}
      <Group title="Thema" icon={<Sparkles className="size-5 text-gold-600" aria-hidden />} defaultOpen>
        <p className="mb-4 text-sm text-ink-500">Eén klik zet kleuren, letters, achtergrond en versiering in één stijl. Daarna kun je alles verfijnen.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PRESETS.map((p) => {
            const active = theme.preset === p.preset;
            const pairing = FONT_PAIRINGS.find((f) => f.id === p.fonts)!;
            return (
              <button
                key={p.preset}
                type="button"
                onClick={() => onChange(applyPreset(theme, p.preset))}
                aria-pressed={active}
                className={cn(
                  "group/p relative overflow-hidden rounded-2xl border-2 text-left transition-all duration-200",
                  active ? "border-rose-500 shadow-[var(--shadow-soft)]" : "border-transparent ring-1 ring-line hover:ring-rose-200",
                )}
              >
                <div className="relative isolate grid h-24 place-items-center" style={{ background: p.background }}>
                  <div className="inv-pattern" data-pattern={p.pattern} style={themeStyle({ ...theme, ...p, fonts: p.fonts })} aria-hidden />
                  <span
                    className="relative px-2 text-center leading-none"
                    style={{
                      fontFamily: `${pairing.script}, cursive`,
                      color: p.accent,
                      fontSize: `max(1.35rem, ${2.1 * pairing.nameScale}rem)`,
                      textTransform: pairing.nameCase ?? "none",
                      letterSpacing: pairing.nameTracking,
                    }}
                  >
                    {initialOf(a)} &amp; {initialOf(b)}
                  </span>
                  <span className="absolute right-2 bottom-2 flex -space-x-1">
                    {[p.accent, p.accent2, p.accent3].map((c) => (
                      <span key={c} className="size-3.5 rounded-full border border-white/70" style={{ background: c }} />
                    ))}
                  </span>
                </div>
                <div className="bg-white px-3 py-2">
                  <p className="text-sm font-medium text-ink-900">{p.label}</p>
                  <p className="truncate text-xs text-ink-500">{p.hint}</p>
                </div>
                {active && (
                  <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-rose-600 text-white">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                )}
                {suggested === p.preset && !active && (
                  <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-ink-700">Past bij jullie stijl</span>
                )}
              </button>
            );
          })}
        </div>
      </Group>

      {/* Kleuren */}
      <Group title="Kleuren" icon={<Palette className="size-5 text-rose-600" aria-hidden />}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ColorField key={`a-${theme.accent}`} label="Accent (knoppen, namen)" value={theme.accent} onChange={(v) => custom({ accent: v })} />
          <ColorField key={`b-${theme.accent2}`} label="Tweede accent (details)" value={theme.accent2} onChange={(v) => custom({ accent2: v })} />
          <ColorField key={`c-${theme.accent3}`} label="Derde accent (versiering)" value={theme.accent3} onChange={(v) => custom({ accent3: v })} />
          <ColorField key={`d-${theme.background}`} label="Achtergrond" value={theme.background} onChange={(v) => custom({ background: v })} />
        </div>
        {issues.length > 0 && (
          <div role="status" className="mt-3 space-y-1 rounded-xl bg-gold-50 px-3 py-2 text-sm text-gold-700">
            {issues.map((i) => (
              <p key={i} className="flex gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {i}
              </p>
            ))}
          </div>
        )}
        <p className="mt-5 mb-2 text-sm font-medium text-ink-700">Of kies een palet</p>
        <div className="flex flex-wrap gap-2">
          {PALETTES.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => custom({ accent: p.accent, accent2: p.accent2, accent3: p.accent3, background: p.background })}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-white py-1 pr-3.5 pl-1.5 text-sm text-ink-700 hover:border-rose-200"
            >
              <span className="flex -space-x-1.5">
                {[p.background, p.accent, p.accent2].map((c, i) => (
                  <span key={i} className="size-6 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />
                ))}
              </span>
              {p.label}
            </button>
          ))}
        </div>
      </Group>

      {/* Lettertypen */}
      <Group title="Lettertypen" icon={<span className="font-script text-2xl leading-none text-rose-600">Aa</span>}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Lettertypen">
          {FONT_PAIRINGS.map((f) => {
            const active = theme.fonts === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set("fonts", f.id)}
                className={cn("rounded-2xl border p-3 text-left transition", active ? "border-rose-400 bg-rose-50" : "border-line bg-white hover:border-rose-200")}
              >
                <span
                  className="block truncate leading-tight text-ink-900"
                  style={{ fontFamily: `${f.script}, cursive`, fontSize: `${2 * f.nameScale}rem`, textTransform: f.nameCase ?? "none", letterSpacing: f.nameTracking }}
                >
                  {a || "Anna"} &amp; {b || "Tom"}
                </span>
                <span className="mt-1 block text-sm" style={{ fontFamily: `${f.heading}, serif` }}>
                  {f.label}
                </span>
                <span className="block text-xs text-ink-500" style={{ fontFamily: `${f.body}, sans-serif` }}>
                  {f.hint}
                </span>
              </button>
            );
          })}
        </div>
      </Group>

      {/* Achtergrond & versiering */}
      <Group title="Achtergrond & versiering">
        <p className="mb-2 text-sm font-medium text-ink-700">Achtergrond</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {PATTERNS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => set("pattern", p.id)}
              aria-pressed={theme.pattern === p.id}
              className={cn("overflow-hidden rounded-xl border-2 text-center transition", theme.pattern === p.id ? "border-rose-500" : "border-line hover:border-rose-200")}
            >
              <span className="relative block h-12 isolate" style={{ ...themeStyle(theme), background: theme.background }}>
                <span className="inv-pattern" data-pattern={p.id} />
              </span>
              <span className="block truncate bg-white px-1 py-1 text-[11px] text-ink-700">{p.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-5 mb-2 text-sm font-medium text-ink-700">Versiering in het openingsbeeld</p>
        <div className="flex flex-wrap gap-2">
          {DECORATIONS.map((d) => (
            <Chip key={d.id} active={theme.decoration === d.id} onClick={() => set("decoration", d.id)}>
              {d.label}
            </Chip>
          ))}
        </div>
      </Group>

      {/* Openingsbeeld */}
      <Group title="Openingsbeeld">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {HEROES.map((h) => {
            const disabled = h.needsImage && !hasImage;
            const active = theme.hero === h.id;
            return (
              <button
                key={h.id}
                type="button"
                disabled={disabled}
                onClick={() => set("hero", h.id)}
                aria-pressed={active}
                title={disabled ? "Kies eerst een openingsfoto (tab Inhoud)" : undefined}
                className={cn("rounded-2xl border-2 p-2 text-center transition disabled:opacity-40", active ? "border-rose-500 bg-rose-50" : "border-line bg-white hover:border-rose-200")}
              >
                <HeroThumb id={h.id} />
                <span className="mt-1.5 block text-xs font-medium text-ink-700">{h.label}</span>
              </button>
            );
          })}
        </div>
        {!hasImage && <p className="mt-3 text-xs text-ink-500">Tip: kies een openingsfoto bij het tabblad Inhoud. Zonder foto tonen boog en naast-tekst een sierlijk embleem.</p>}
      </Group>

      {/* Details */}
      <Group title="Details">
        <div className="space-y-5">
          <OptionRow label="Hoeken">
            {CORNERS.map((c) => (
              <Chip key={c.id} active={theme.corners === c.id} onClick={() => set("corners", c.id)}>
                <span className={cn("size-3.5 border-2 border-current", c.id === "round" ? "rounded-md" : c.id === "soft" ? "rounded-[3px]" : "rounded-none")} aria-hidden />
                {c.label}
              </Chip>
            ))}
          </OptionRow>
          <OptionRow label="Scheidingsteken">
            {DIVIDERS.map((d) => (
              <Chip key={d.id} active={theme.divider === d.id} onClick={() => set("divider", d.id)}>
                {d.label}
              </Chip>
            ))}
          </OptionRow>
          <OptionRow label="Embleem boven de namen">
            {EMBLEMS.map((e) => (
              <Chip key={e.id} active={theme.emblem === e.id} onClick={() => set("emblem", e.id)}>
                {e.label}
              </Chip>
            ))}
          </OptionRow>
          <OptionRow label="Animaties">
            {MOTIONS.map((m) => (
              <Chip key={m.id} active={theme.motion === m.id} onClick={() => set("motion", m.id)} title={m.hint}>
                {m.label}
              </Chip>
            ))}
          </OptionRow>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            <Toggle checked={theme.countdown} onChange={(v) => set("countdown", v)} label="Aftelklok tonen" />
            <Toggle checked={theme.calendar} onChange={(v) => set("calendar", v)} label="Knop 'Zet in agenda'" />
          </div>
        </div>
      </Group>

      {/* Onderdelen */}
      <Group title="Onderdelen & volgorde">
        <p className="mb-3 text-sm text-ink-500">Onderdelen zonder inhoud worden altijd overgeslagen. RSVP staat altijd op de persoonlijke uitnodiging.</p>
        <ul className="space-y-2">
          {theme.sections.map((s, i) => {
            const hidden = theme.hidden.includes(s);
            return (
              <li key={s} className={cn("flex items-center gap-2 rounded-2xl border px-3 py-1.5", hidden ? "border-dashed border-line bg-ivory/60" : "border-line bg-white")}>
                <span className={cn("flex-1 text-sm", hidden ? "text-ink-500 line-through" : "font-medium text-ink-900")}>{SECTION_LABEL[s]}</span>
                <button type="button" onClick={() => move(s, -1)} disabled={i === 0} className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-rose-50 disabled:opacity-30" aria-label={`${SECTION_LABEL[s]} omhoog`}>
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(s, 1)}
                  disabled={i === theme.sections.length - 1}
                  className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-rose-50 disabled:opacity-30"
                  aria-label={`${SECTION_LABEL[s]} omlaag`}
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleHidden(s)}
                  disabled={s === "rsvp"}
                  className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-rose-50 disabled:opacity-30"
                  aria-label={hidden ? `${SECTION_LABEL[s]} tonen` : `${SECTION_LABEL[s]} verbergen`}
                  aria-pressed={!hidden}
                >
                  {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Group>

      {/* Teksten */}
      <Group title="Eigen teksten">
        <label htmlFor="tagline" className="label">
          Openingszin boven de namen
        </label>
        <input id="tagline" className="field" placeholder="Wij gaan trouwen" value={theme.tagline} maxLength={60} onChange={(e) => set("tagline", e.target.value)} />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TAGLINES.map((t) => (
            <button key={t} type="button" onClick={() => set("tagline", t)} className="min-h-8 rounded-full bg-ivory-deep px-3 text-xs text-ink-700 hover:bg-rose-50">
              {t}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-ink-500">Op de persoonlijke uitnodiging staat er &ldquo;Lieve [naam],&rdquo; voor.</p>
        <label htmlFor="closing" className="label mt-5">
          Afsluitende zin onderaan
        </label>
        <input id="closing" className="field" placeholder="Wij kijken ernaar uit!" value={theme.closing} maxLength={120} onChange={(e) => set("closing", e.target.value)} />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CLOSINGS.map((t) => (
            <button key={t} type="button" onClick={() => set("closing", t)} className="min-h-8 rounded-full bg-ivory-deep px-3 text-xs text-ink-700 hover:bg-rose-50">
              {t}
            </button>
          ))}
        </div>
      </Group>

      <button
        type="button"
        onClick={() => onChange(applyPreset({ ...theme, sections: theme.sections, hidden: [], tagline: "", closing: "", countdown: true, calendar: true }, "romantisch"))}
        className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm text-ink-500 hover:bg-rose-50 hover:text-rose-700"
      >
        <RotateCcw className="size-4" aria-hidden /> Terug naar standaard
      </button>
    </div>
  );
}

function OptionRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink-700">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const initialOf = (s: string) => (s.trim()[0] ?? "").toUpperCase();

/** Schematische miniatuur van een openingsbeeld-indeling. */
function HeroThumb({ id }: { id: HeroId }) {
  const line = "rounded-full bg-ink-300";
  return (
    <span className="relative mx-auto flex h-16 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-ivory-deep" aria-hidden>
      {id === "full" && <span className="absolute inset-0 bg-gradient-to-br from-gold-200 to-rose-200" />}
      {id === "split" ? (
        <>
          <span className="flex flex-col gap-1">
            <span className={cn(line, "h-1.5 w-10")} />
            <span className={cn(line, "h-1 w-8")} />
            <span className={cn(line, "h-1 w-6")} />
          </span>
          <span className="h-11 w-8 rounded-t-full rounded-b-md bg-gold-300" />
        </>
      ) : (
        <span className="relative flex flex-col items-center gap-1">
          {id === "arch" && <span className="h-7 w-6 rounded-t-full rounded-b-sm bg-gold-300" />}
          <span className={cn(line, "h-1.5 w-12", id === "full" && "bg-white")} />
          <span className={cn(line, "h-1 w-8", id === "full" && "bg-white/80")} />
        </span>
      )}
    </span>
  );
}
