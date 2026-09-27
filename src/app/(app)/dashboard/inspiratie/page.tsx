"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, ImagePlus, Images, Link2, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { aiImage, aiText, useAiEnabled } from "@/lib/ai";
import { useWedding } from "@/lib/store";
import type { Inspiration } from "@/lib/types";
import { cn, nowIso, uid } from "@/lib/utils";

const SUBJECTS = [
  { label: "Tafeldecoratie", en: "wedding reception table setting with centerpieces" },
  { label: "Bruidsboeket", en: "bridal bouquet" },
  { label: "Ceremonieboog", en: "outdoor wedding ceremony arch with flowers" },
  { label: "Bruidstaart", en: "elegant wedding cake" },
  { label: "Trouwjurk", en: "wedding dress on a mannequin in soft light" },
  { label: "Locatie-styling", en: "wedding venue interior styled for the reception" },
  { label: "Uitnodiging", en: "flat lay of wedding invitation stationery suite" },
  { label: "Lounge-hoek", en: "cozy wedding lounge area with candles" },
];

export default function InspirationPage() {
  const { wedding, inspirations, add, update, remove } = useWedding();
  const toast = useToast();
  const ai = useAiEnabled();
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(0);
  const [enhancing, setEnhancing] = useState(false);
  const [viewing, setViewing] = useState<Inspiration | null>(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState("");

  const palette = wedding?.color_palette?.join(", ") ?? "";
  const basePrompt = () =>
    `${subject.en}, ${wedding?.style ?? "romantic"} wedding style${palette ? `, color palette ${palette}` : ""}`;

  async function enhance() {
    setEnhancing(true);
    try {
      const res = await aiText("image_prompt", { style: wedding?.style, colors: palette, subject: prompt || subject.en });
      if (res.text) setPrompt(res.text);
    } catch (e) {
      toast.error("Prompt verbeteren mislukt", e instanceof Error ? e.message : undefined);
    } finally {
      setEnhancing(false);
    }
  }

  async function generate(e?: FormEvent) {
    e?.preventDefault();
    if (!wedding) return;
    const p = prompt.trim() || basePrompt();
    setGenerating((n) => n + 1);
    try {
      const { url } = await aiImage(p);
      add("inspirations", { id: uid(), wedding_id: wedding.id, created_at: nowIso(), image_url: url, prompt: p, note: "", category: subject.label });
      toast.success("Nieuwe inspiratie toegevoegd");
    } catch (err) {
      toast.error("Afbeelding maken mislukt", err instanceof Error ? err.message : undefined);
    } finally {
      setGenerating((n) => n - 1);
    }
  }

  function addUrl() {
    if (!wedding || !/^https:\/\//.test(url.trim())) return;
    add("inspirations", { id: uid(), wedding_id: wedding.id, created_at: nowIso(), image_url: url.trim(), prompt: "", note: "", category: "Eigen afbeelding" });
    setUrl("");
    setUrlOpen(false);
  }

  const sorted = [...inspirations].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <>
      <PageHeader
        eyebrow="Dromen mag"
        title="Inspiratie"
        description="Jullie moodboard. Laat AI beelden maken in jullie eigen stijl, of bewaar afbeeldingen die je online vindt."
        actions={
          <Button variant="secondary" onClick={() => setUrlOpen(true)}>
            <Link2 className="size-4" aria-hidden /> Afbeelding via link
          </Button>
        }
      />

      {/* Generator */}
      <section className="relative mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-gold-50 via-white to-rose-50 p-6 shadow-[var(--shadow-soft)] ring-1 ring-line sm:p-8">
        <div className="absolute -top-20 -right-20 size-64 rounded-full bg-rose-100/70 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-rose-300 text-white">
              <Wand2 className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-2xl font-semibold">AI-moodboard</h2>
              <p className="text-sm text-ink-500">
                Stijl: <strong className="text-ink-700">{wedding?.style || "—"}</strong>
                {wedding?.color_palette?.length ? (
                  <span className="ml-2 inline-flex -space-x-1 align-middle">
                    {wedding.color_palette.map((c) => (
                      <span key={c} className="inline-block size-4 rounded-full border border-white" style={{ background: c }} />
                    ))}
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          {ai === false ? (
            <p className="mt-5 rounded-xl bg-white/80 px-4 py-3 text-sm text-ink-500">
              Voeg <code className="rounded bg-ivory px-1">FAL_KEY</code> toe aan je omgevingsvariabelen om beelden te genereren. Afbeeldingen via een link toevoegen werkt altijd.
            </p>
          ) : (
            <form onSubmit={generate} className="mt-5">
              <fieldset>
                <legend className="label">Waar zoek je inspiratie voor?</legend>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => { setSubject(s); setPrompt(""); }}
                      aria-pressed={subject.label === s.label}
                      className={cn(
                        "min-h-10 rounded-full border px-4 text-sm transition-all duration-200",
                        subject.label === s.label ? "border-rose-400 bg-rose-600 text-white shadow-[var(--shadow-glow)]" : "border-line bg-white text-ink-700 hover:border-rose-200",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="mt-4">
                <Textarea
                  label="Beschrijving (optioneel, mag in het Engels of Nederlands)"
                  placeholder={basePrompt()}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={2}
                  maxLength={800}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="submit" variant="gold" loading={generating > 0}>
                  <Sparkles className="size-4" aria-hidden /> {generating > 0 ? "Bezig met schilderen…" : "Genereer beeld"}
                </Button>
                <Button type="button" variant="secondary" onClick={enhance} loading={enhancing}>
                  <Wand2 className="size-4" aria-hidden /> Maak beschrijving mooier
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      {sorted.length === 0 && generating === 0 ? (
        <EmptyState icon={Images} title="Jullie moodboard is nog leeg" body="Genereer je eerste beeld of voeg een afbeelding toe via een link." />
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
          <AnimatePresence initial={false}>
            {Array.from({ length: generating }).map((_, i) => (
              <motion.div key={`gen-${i}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mb-4 break-inside-avoid">
                <div className="shine relative grid aspect-[4/3] place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-rose-100 to-gold-100">
                  <Sparkles className="size-8 animate-pulse text-white" aria-hidden />
                  <span className="sr-only">Afbeelding wordt gemaakt</span>
                </div>
              </motion.div>
            ))}
            {sorted.map((img, i) => (
              <motion.figure
                key={img.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="group mb-4 break-inside-avoid"
              >
                <button onClick={() => setViewing(img)} className="relative block w-full overflow-hidden rounded-3xl shadow-[var(--shadow-soft)]" aria-label={`Bekijk ${img.category}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_url} alt={img.note || img.prompt || img.category} loading="lazy" className="w-full transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/60 to-transparent p-4 pt-10 text-left text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {img.category}
                    {img.note && <span className="block font-normal text-white/80">{img.note}</span>}
                  </span>
                </button>
              </motion.figure>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.category ?? ""}
        size="lg"
        footer={
          viewing && (
            <>
              <Button variant="danger" className="mr-auto" onClick={() => { remove("inspirations", viewing.id); setViewing(null); }}>
                <Trash2 className="size-4" aria-hidden /> Verwijderen
              </Button>
              <a href={viewing.image_url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-[15px] font-medium hover:bg-rose-50">
                <Download className="size-4" aria-hidden /> Openen
              </a>
            </>
          )
        }
      >
        {viewing && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewing.image_url} alt={viewing.prompt || viewing.category} className="w-full rounded-2xl" />
            <div className="mt-4">
              <Input
                label="Notitie"
                placeholder="Wat vind je hier mooi aan?"
                defaultValue={viewing.note}
                onBlur={(e) => e.target.value !== viewing.note && update("inspirations", viewing.id, { note: e.target.value })}
              />
            </div>
            {viewing.prompt && <p className="mt-3 text-xs text-ink-500">Prompt: {viewing.prompt}</p>}
          </>
        )}
      </Modal>

      <Modal
        open={urlOpen}
        onClose={() => setUrlOpen(false)}
        title="Afbeelding toevoegen"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUrlOpen(false)}>Annuleren</Button>
            <Button onClick={addUrl} disabled={!/^https:\/\//.test(url.trim())}>
              <ImagePlus className="size-4" aria-hidden /> Toevoegen
            </Button>
          </>
        }
      >
        <Input label="Link naar afbeelding" type="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} hint="Rechtsklik op een afbeelding en kies 'Afbeeldingsadres kopiëren'." />
      </Modal>
    </>
  );
}
