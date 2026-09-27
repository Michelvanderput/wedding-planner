"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, ExternalLink, Eye, EyeOff, Globe, ImageIcon, Link2, Plus, Sparkles, Trash2, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InvitationView } from "@/components/invitation/invitation-view";
import { RsvpSettings } from "@/components/invitation/rsvp-settings";
import { ThemeEditor } from "@/components/invitation/theme-editor";
import { Button, ButtonLink } from "@/components/ui/button";
import { QrCode } from "@/components/ui/qr";
import { Segmented } from "@/components/ui/segmented";
import { buildPreviewData, storeDraft, type PreviewAs } from "@/lib/invitation/preview";
import { resolveTheme, type InvitationTheme } from "@/lib/invitation/theme";
import { Input, Textarea, Toggle } from "@/components/ui/field";
import { Badge, PageHeader } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { aiText, useAiEnabled } from "@/lib/ai";
import { useWedding } from "@/lib/store";
import { SLUG_PATTERN as SLUG, isSlugAvailable, suggestFreeSlug } from "@/lib/invitation/slug";
import { SITE_URL } from "@/lib/supabase/config";
import type { FaqItem, InvitationData, SiteContent } from "@/lib/types";
import { cn, coupleName, formatDate, slugify } from "@/lib/utils";


export default function InvitationEditor() {
  const { wedding, updateWedding, inspirations, guests, mode, timeline_events, gifts, gift_claims, guestbook, update: updateRow, remove } = useWedding();
  const toast = useToast();
  const ai = useAiEnabled();
  const [site, setSite] = useState<SiteContent | null>(wedding?.site ?? null);
  const [slug, setSlug] = useState(wedding?.public_slug ?? "");
  const [aiBusy, setAiBusy] = useState<"welcome" | "faq" | null>(null);
  const [origin, setOrigin] = useState(SITE_URL);
  const [saving, setSaving] = useState(false);
  const [slugFree, setSlugFree] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"inhoud" | "vormgeving">("inhoud");
  const [previewAs, setPreviewAs] = useState<PreviewAs>("day");
  const [mobilePreview, setMobilePreview] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "vormgeving") setTab("vormgeving");
  }, []);

  useEffect(() => {
    if (!SITE_URL) setOrigin(window.location.origin);
  }, []);

  // Standaardlink voorstellen die nog vrij is.
  const weddingId = wedding?.id;
  const hasSlug = !!wedding?.public_slug;
  useEffect(() => {
    if (!wedding || hasSlug) return;
    const base = slugify(`${wedding.partner_one} en ${wedding.partner_two}`) || "onze-bruiloft";
    let cancelled = false;
    if (mode === "supabase") void suggestFreeSlug(base, wedding.id, wedding.wedding_date?.slice(0, 4)).then((s) => !cancelled && setSlug((cur) => cur || s));
    else setSlug((cur) => cur || base);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingId, hasSlug, mode]);

  // Beschikbaarheid live controleren (met kleine vertraging tijdens typen).
  useEffect(() => {
    setSlugFree(null);
    if (!weddingId || mode !== "supabase" || !SLUG.test(slug) || slug === wedding?.public_slug) return;
    const t = setTimeout(() => void isSlugAvailable(slug, weddingId).then(setSlugFree), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, weddingId, mode]);

  const dirty = useMemo(
    () => !!wedding && !!site && (JSON.stringify(site) !== JSON.stringify(wedding.site) || (slug || null) !== wedding.public_slug),
    [site, slug, wedding],
  );

  // Waarschuwen bij weggaan met onopgeslagen wijzigingen.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  if (!wedding || !site) return null;
  const slugValid = SLUG.test(slug);
  const publicUrl = `${origin}/uitnodiging/${slug}`;
  const set = <K extends keyof SiteContent>(k: K, v: SiteContent[K]) => setSite({ ...site, [k]: v });
  const setFaq = (faq: FaqItem[]) => set("faq", faq);

  async function save(extra?: Partial<SiteContent>) {
    if (!site || !wedding) return;
    const slugChanged = (slug || null) !== wedding.public_slug;
    if (slugChanged && slug && !slugValid) {
      toast.error("Controleer de link", "Gebruik 3–60 kleine letters, cijfers of streepjes.");
      return;
    }
    if (extra?.published && !slugValid) {
      toast.error("Kies eerst een link", "Zonder link kan de pagina niet online.");
      return;
    }
    setSaving(true);
    try {
      // 1. Link apart opslaan, zodat een bezette link nooit de inhoud blokkeert.
      let slugOk = true;
      if (slugChanged && mode === "supabase") {
        const free = await isSlugAvailable(slug, wedding.id);
        if (free === false) {
          slugOk = false;
          setSlugFree(false);
          toast.error("Deze link is al in gebruik", "Kies een andere link. Je teksten worden wel opgeslagen.");
        } else slugOk = await updateWedding({ public_slug: slug || null });
      }
      // 2. Inhoud opslaan (publiceren alleen als de link in orde is).
      const publish = extra?.published === true && !slugOk ? {} : extra;
      const next = {
        ...site,
        ...publish,
        faq: site.faq.filter((f) => f.q.trim() || f.a.trim()),
        rsvp_questions: site.rsvp_questions.filter((q) => q.label.trim()),
      };
      setSite(next);
      const siteOk = await updateWedding({ site: next });
      if (siteOk && slugOk) {
        toast.success(extra?.published === true ? "Uitnodiging gepubliceerd!" : extra?.published === false ? "Uitnodiging offline gehaald" : "Opgeslagen");
      } else if (siteOk) toast.info("Teksten opgeslagen", "Alleen de link is nog niet aangepast.");
    } finally {
      setSaving(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link gekopieerd");
    } catch {
      toast.error("Kopiëren lukte niet");
    }
  }

  const ctx = {
    couple: coupleName(wedding.partner_one, wedding.partner_two),
    date: formatDate(wedding.wedding_date),
    venue: wedding.venue,
    city: wedding.city,
    style: wedding.style,
  };

  async function writeWelcome() {
    setAiBusy("welcome");
    try {
      const res = await aiText("welcome", { ...ctx, extra: site?.welcome });
      if (res.text) set("welcome", res.text);
    } catch (e) {
      toast.error("Tekst schrijven mislukt", e instanceof Error ? e.message : undefined);
    } finally {
      setAiBusy(null);
    }
  }

  async function suggestFaq() {
    if (!site) return;
    setAiBusy("faq");
    try {
      const res = await aiText("faq", {
        ...ctx,
        dress_code: site.dress_code,
        gifts: site.gifts,
        parking: site.parking,
        existing: site.faq.map((f) => f.q).join("; "),
      });
      const items = ((res.items ?? []) as FaqItem[]).filter((i) => i?.q && i?.a).map((i) => ({ q: String(i.q), a: String(i.a) }));
      setSite((s) => (s ? { ...s, faq: [...s.faq, ...items] } : s));
      toast.info(`${items.length} vragen toegevoegd`, "Controleer de antwoorden en vul [INVULLEN] aan.");
    } catch (e) {
      toast.error("Suggesties mislukt", e instanceof Error ? e.message : undefined);
    } finally {
      setAiBusy(null);
    }
  }

  const images = inspirations.filter((i) => i.image_url);
  const theme = resolveTheme(site.theme);
  const previewData = buildPreviewData(wedding, timeline_events, site, previewAs, { gifts, claims: gift_claims, guestbook });

  /** Voorbeeld openen mét nog niet opgeslagen wijzigingen. */
  function openPreview() {
    if (!wedding || !site) return;
    storeDraft(wedding.id, site);
    router.push(`/voorbeeld?als=${previewAs}`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Voor jullie gasten"
        title="Uitnodiging"
        description="Een eigen pagina met alle informatie voor jullie gasten: programma, locatie, praktische zaken en RSVP."
        actions={
          <>
            <Button variant="secondary" onClick={openPreview}>
              <Eye className="size-4" aria-hidden /> Voorbeeld
            </Button>
            <Button onClick={() => save()} disabled={!dirty} loading={saving}>
              {dirty ? "Opslaan" : <><Check className="size-4" aria-hidden /> Opgeslagen</>}
            </Button>
          </>
        }
      />

      <div className="mb-6">
        <Segmented
          id="inv-tab"
          value={tab}
          onChange={setTab}
          options={[
            ["inhoud", "Inhoud"],
            ["vormgeving", "Vormgeving"],
          ]}
        />
      </div>

      {tab === "vormgeving" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          <div className="min-w-0">
            <ThemeEditor
              theme={theme}
              onChange={(t) => set("theme", t)}
              style={wedding.style}
              names={[wedding.partner_one, wedding.partner_two]}
              hasImage={!!site.hero_image}
            />
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <LivePreview data={previewData} theme={theme} as={previewAs} onAs={setPreviewAs} />
            </div>
          </aside>
          <button
            type="button"
            onClick={() => setMobilePreview(true)}
            className={cn(
              "fixed left-1/2 z-30 inline-flex h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900 px-5 text-sm font-medium text-ivory shadow-[var(--shadow-lift)] transition-[bottom] duration-300 lg:hidden",
              dirty ? "bottom-[calc(9rem+env(safe-area-inset-bottom))]" : "bottom-[calc(5.25rem+env(safe-area-inset-bottom))]",
            )}
          >
            <Eye className="size-4" aria-hidden /> Live voorbeeld
          </button>
          <AnimatePresence>
            {mobilePreview && (
              <motion.div
                className="fixed inset-0 z-[95] flex flex-col bg-ink-900/60 backdrop-blur-sm lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role="dialog"
                aria-modal="true"
                aria-label="Live voorbeeld"
              >
                <div className="flex items-center gap-2 bg-white px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2">
                  <Segmented
                    id="prev-as-m"
                    value={previewAs}
                    onChange={setPreviewAs}
                    options={[
                      ["day", "Dag"],
                      ["evening", "Avond"],
                      ["public", "Openbaar"],
                    ]}
                  />
                  <button onClick={() => setMobilePreview(false)} className="ml-auto grid size-11 place-items-center rounded-full hover:bg-rose-50" aria-label="Voorbeeld sluiten">
                    <X className="size-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  <InvitationView data={previewData} themeOverride={theme} embedded rsvp={previewAs === "public" ? undefined : <RsvpPlaceholder />} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {tab === "inhoud" && (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {/* Welkom */}
          <section className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-2xl font-semibold">Welkomsttekst</h2>
              {ai !== false && (
                <Button size="sm" variant="secondary" onClick={writeWelcome} loading={aiBusy === "welcome"}>
                  <Sparkles className="size-4 text-gold-600" aria-hidden /> {site.welcome ? "Herschrijf" : "Schrijf met AI"}
                </Button>
              )}
            </div>
            <Textarea
              className="mt-4"
              label="Persoonlijke boodschap"
              rows={5}
              placeholder="Lieve familie en vrienden, wat zijn we blij dat jullie deze dag met ons willen vieren…"
              value={site.welcome}
              onChange={(e) => set("welcome", e.target.value)}
            />
          </section>

          {/* Locatie */}
          <section className="card p-6">
            <h2 className="text-2xl font-semibold">Locatie</h2>
            <p className="mt-1 text-sm text-ink-500">
              Naam en plaats ({[wedding.venue, wedding.city].filter(Boolean).join(", ") || "nog niet ingevuld"}) pas je aan bij{" "}
              <Link href="/dashboard/instellingen" className="text-rose-700 underline-offset-2 hover:underline">
                Instellingen
              </Link>
              .
            </p>
            <Input
              className="mt-4"
              label="Volledig adres"
              placeholder="Straat 1, 1234 AB Plaats"
              value={site.address}
              onChange={(e) => set("address", e.target.value)}
              hint="Voor de kaart en de knop 'Route plannen'."
            />
          </section>

          {/* Praktisch */}
          <section className="card p-6">
            <h2 className="text-2xl font-semibold">Praktische info</h2>
            <p className="mt-1 text-sm text-ink-500">Lege velden worden niet getoond.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Textarea label="Dresscode" placeholder="Feestelijk, graag geen wit" value={site.dress_code} onChange={(e) => set("dress_code", e.target.value)} />
              <Textarea label="Cadeautip" placeholder="Een bijdrage voor onze huwelijksreis" value={site.gifts} onChange={(e) => set("gifts", e.target.value)} />
              <Textarea label="Parkeren & vervoer" placeholder="Gratis parkeren op het terrein" value={site.parking} onChange={(e) => set("parking", e.target.value)} />
              <Textarea label="Overnachten" placeholder="Hotel De Linde op 5 min. rijden" value={site.accommodation} onChange={(e) => set("accommodation", e.target.value)} />
            </div>
          </section>

          {/* FAQ */}
          <section className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-2xl font-semibold">Veelgestelde vragen</h2>
              <div className="flex gap-2">
                {ai !== false && (
                  <Button size="sm" variant="secondary" onClick={suggestFaq} loading={aiBusy === "faq"}>
                    <Sparkles className="size-4 text-gold-600" aria-hidden /> Suggesties
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => setFaq([...site.faq, { q: "", a: "" }])}>
                  <Plus className="size-4" aria-hidden /> Vraag
                </Button>
              </div>
            </div>
            {site.faq.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-ivory px-4 py-6 text-center text-sm text-ink-500">
                Bijvoorbeeld: &ldquo;Mogen kinderen mee?&rdquo; of &ldquo;Tot hoe laat duurt het feest?&rdquo;
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                <AnimatePresence initial={false}>
                  {site.faq.map((f, i) => (
                    <motion.li
                      key={i}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn("rounded-2xl border p-4", /\[INVULLEN\]/.test(f.a) ? "border-gold-300 bg-gold-50" : "border-line bg-white")}
                    >
                      <div className="flex items-start gap-2">
                        <div className="grid min-w-0 flex-1 gap-3">
                          <Input label={`Vraag ${i + 1}`} value={f.q} onChange={(e) => setFaq(site.faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                          <Textarea label="Antwoord" rows={2} value={f.a} onChange={(e) => setFaq(site.faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
                        </div>
                        <button
                          onClick={() => setFaq(site.faq.filter((_, j) => j !== i))}
                          className="mt-7 grid size-10 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-700"
                          aria-label={`Vraag ${i + 1} verwijderen`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </section>

          {/* Contact & RSVP */}
          <section className="card p-6">
            <h2 className="text-2xl font-semibold">Contact & RSVP</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Ceremoniemeester" placeholder="Naam" value={site.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
              <Input label="Telefoon ceremoniemeester" type="tel" placeholder="06 12345678" value={site.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
              <Input label="Reageren vóór" type="date" value={site.rsvp_deadline} onChange={(e) => set("rsvp_deadline", e.target.value)} />
            </div>
          </section>

          <RsvpSettings
            meals={site.rsvp_meals}
            questions={site.rsvp_questions}
            onMeals={(m) => set("rsvp_meals", m)}
            onQuestions={(q) => set("rsvp_questions", q)}
          />

          {/* Gastenboek-moderatie */}
          {guestbook.length > 0 && (
            <section className="card p-6">
              <h2 className="text-2xl font-semibold">Gastenboek</h2>
              <p className="mt-1 text-sm text-ink-500">{guestbook.length} berichten van gasten. Verborgen berichten zien gasten niet.</p>
              <ul className="mt-4 space-y-2">
                {[...guestbook]
                  .sort((x, y) => y.created_at.localeCompare(x.created_at))
                  .map((e) => (
                    <li key={e.id} className={cn("flex items-start gap-3 rounded-2xl border p-3", e.hidden ? "border-dashed border-line bg-ivory/60" : "border-line bg-white")}>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm whitespace-pre-line [overflow-wrap:anywhere]", e.hidden ? "text-ink-500" : "text-ink-900")}>{e.message}</p>
                        <p className="mt-1 text-xs text-ink-500">— {e.name}</p>
                      </div>
                      <button
                        onClick={() => updateRow("guestbook", e.id, { hidden: !e.hidden })}
                        className="grid size-9 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-700"
                        aria-label={e.hidden ? "Bericht tonen" : "Bericht verbergen"}
                      >
                        {e.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                      <button
                        onClick={() => remove("guestbook", e.id)}
                        className="grid size-9 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-700"
                        aria-label="Bericht verwijderen"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {/* Afbeelding */}
          <section className="card p-6">
            <h2 className="text-2xl font-semibold">Openingsfoto</h2>
            <p className="mt-1 text-sm text-ink-500">Kies een beeld uit jullie moodboard of plak een link. Zonder foto krijgt de pagina een botanische illustratie.</p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              <button
                onClick={() => set("hero_image", "")}
                aria-pressed={!site.hero_image}
                className={cn(
                  "grid aspect-[4/3] place-items-center rounded-xl border-2 text-xs text-ink-500 transition",
                  !site.hero_image ? "border-rose-500 bg-rose-50" : "border-line bg-ivory hover:border-rose-200",
                )}
              >
                <span className="flex flex-col items-center gap-1">
                  <X className="size-4" aria-hidden /> Geen foto
                </span>
              </button>
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => set("hero_image", img.image_url)}
                  aria-pressed={site.hero_image === img.image_url}
                  aria-label={`Kies ${img.category}`}
                  className={cn(
                    "relative aspect-[4/3] overflow-hidden rounded-xl border-2 transition",
                    site.hero_image === img.image_url ? "border-rose-500" : "border-transparent hover:border-rose-200",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_url} alt="" className="size-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
            {images.length === 0 && (
              <p className="mt-3 flex items-center gap-2 text-sm text-ink-500">
                <ImageIcon className="size-4" aria-hidden /> Nog geen beelden.{" "}
                <Link href="/dashboard/inspiratie" className="text-rose-700 hover:underline">
                  Maak er een in Inspiratie
                </Link>
              </p>
            )}
            <Input
              className="mt-4"
              label="Of plak een afbeeldingslink"
              type="url"
              placeholder="https://…"
              value={images.some((i) => i.image_url === site.hero_image) ? "" : site.hero_image}
              onChange={(e) => set("hero_image", e.target.value)}
            />
          </section>
        </div>

        {/* Zijkolom: publiceren & delen */}
        <aside className="min-w-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="card p-6">
            <div className="flex items-center gap-3">
              <span className={cn("grid size-10 place-items-center rounded-full", site.published ? "bg-sage-100 text-sage-700" : "bg-ivory-deep text-ink-500")}>
                <Globe className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Algemene link</h2>
                <Badge tone={site.published ? "sage" : "ink"}>{site.published ? "Online" : "Offline"}</Badge>
              </div>
            </div>
            {mode === "local" ? (
              <p className="mt-4 rounded-xl bg-gold-50 px-4 py-3 text-sm text-ink-700">
                Koppel Supabase om de uitnodiging online te zetten. Het voorbeeld werkt wel al.
              </p>
            ) : (
              <>
                <div className="mt-4">
                  <label htmlFor="slug" className="label">
                    Adres van jullie pagina
                  </label>
                  <div className={cn("flex items-center overflow-hidden rounded-xl border bg-white focus-within:ring-4 focus-within:ring-rose-100", (slug && !slugValid) || slugFree === false ? "border-rose-400" : "border-line")}>
                    <span className="shrink-0 bg-ivory px-3 py-2.5 text-sm text-ink-500">/uitnodiging/</span>
                    <input
                      id="slug"
                      className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-[15px] focus:outline-none"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 60))}
                      aria-invalid={!!slug && !slugValid}
                      aria-describedby="slug-hint"
                    />
                  </div>
                  <p id="slug-hint" aria-live="polite" className={cn("mt-1.5 text-xs", (slug && !slugValid) || slugFree === false ? "text-rose-700" : slugFree ? "text-sage-700" : "text-ink-500")}>
                    {slug && !slugValid
                      ? "3–60 tekens: kleine letters, cijfers of streepjes (niet aan begin/eind)."
                      : slugFree === false
                        ? "Deze link is al in gebruik. Kies een andere."
                        : slugFree
                          ? "Deze link is nog vrij."
                          : "Deze link kun je delen in een groepsapp of op je kaart."}
                  </p>
                </div>
                <div className="mt-4 rounded-2xl border border-line bg-ivory p-3">
                  <Toggle
                    checked={site.published}
                    onChange={(v) => save({ published: v })}
                    label={site.published ? "Pagina is openbaar" : "Pagina publiceren"}
                  />
                </div>
                {site.published && wedding.public_slug && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => copy(`${origin}/uitnodiging/${wedding.public_slug}`)}>
                      <Copy className="size-4" aria-hidden /> Kopieer
                    </Button>
                    <a
                      href={`/uitnodiging/${wedding.public_slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-medium hover:bg-rose-50"
                    >
                      <ExternalLink className="size-4" aria-hidden /> Open
                    </a>
                  </div>
                )}
                {site.published && wedding.public_slug && (
                  <div className="mt-4 flex flex-col items-center rounded-2xl bg-ivory p-3 text-center">
                    <QrCode value={`${origin}/uitnodiging/${wedding.public_slug}`} size={140} filename="uitnodiging-qr.png" />
                    <p className="mt-1 text-xs text-ink-500">Zet deze QR-code op je trouwkaart of save-the-date.</p>
                  </div>
                )}
                {dirty && slugValid && slug !== wedding.public_slug && (
                  <p className="mt-3 truncate text-xs text-ink-500">Na opslaan: {publicUrl}</p>
                )}
              </>
            )}
          </section>

          <section className="card p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-rose-50 text-rose-600">
                <Link2 className="size-5" aria-hidden />
              </span>
              <h2 className="text-xl font-semibold">Persoonlijke links</h2>
            </div>
            <p className="mt-3 text-sm text-ink-700">
              Iedere gast heeft een eigen link met hun naam, het juiste programma (dag of avond) en een RSVP-formulier. Die werkt ook als de algemene pagina offline staat.
            </p>
            <ButtonLink href="/dashboard/gasten" variant="secondary" size="sm" className="mt-4 w-full">
              <Users className="size-4" aria-hidden /> Naar gasten ({guests.length})
            </ButtonLink>
          </section>

          <section className="card p-6 text-sm text-ink-700">
            <h2 className="text-xl font-semibold">Programma</h2>
            <p className="mt-2">
              Het programma komt uit jullie{" "}
              <Link href="/dashboard/dagplanning" className="text-rose-700 hover:underline">
                draaiboek
              </Link>
              . Per onderdeel kies je daar wie het ziet: iedereen, alleen daggasten, of alleen jullie.
            </p>
          </section>
        </aside>
      </div>

      )}

      {/* Zwevende opslaan-balk bij wijzigingen */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-full border border-line bg-white py-2 pr-2 pl-5 shadow-[var(--shadow-lift)] lg:bottom-6 lg:left-72"
          >
            <span className="text-sm text-ink-700">Niet-opgeslagen wijzigingen</span>
            <Button size="sm" onClick={() => save()} loading={saving}>
              Opslaan
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function RsvpPlaceholder() {
  return (
    <div className="card mx-auto max-w-lg p-6 text-center text-sm text-ink-500">
      Hier vullen gasten hun RSVP in: komen ze, dieetwensen en +1.
    </div>
  );
}

/** Telefoonframe met de echte uitnodiging, live bijgewerkt tijdens het ontwerpen. */
function LivePreview({ data, theme, as, onAs }: { data: InvitationData; theme: InvitationTheme; as: PreviewAs; onAs: (v: PreviewAs) => void }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink-700">Live voorbeeld</p>
        <Segmented
          id="prev-as"
          value={as}
          onChange={onAs}
          options={[
            ["day", "Dag"],
            ["evening", "Avond"],
            ["public", "Openbaar"],
          ]}
        />
      </div>
      <div className="mx-auto w-[375px] max-w-full rounded-[2.75rem] border-[10px] border-ink-900 bg-ink-900 shadow-[var(--shadow-lift)]">
        <div className="h-[calc(100dvh-11rem)] max-h-[760px] min-h-[520px] overflow-y-auto overscroll-contain rounded-[2rem] bg-white">
          <InvitationView data={data} themeOverride={theme} embedded rsvp={as === "public" ? undefined : <RsvpPlaceholder />} />
        </div>
      </div>
    </div>
  );
}
