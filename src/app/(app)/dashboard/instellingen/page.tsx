"use client";

import { motion } from "framer-motion";
import { Check, Cloud, Download, HardDrive, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Badge, PageHeader } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useAiEnabled } from "@/lib/ai";
import { WEDDING_STYLES } from "@/lib/defaults";
import { useWedding } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const store = useWedding();
  const { wedding, updateWedding, deleteWedding, mode, email } = store;
  const toast = useToast();
  const router = useRouter();
  const ai = useAiEnabled();
  const [confirm, setConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [form, setForm] = useState(() => ({
    partner_one: wedding?.partner_one ?? "",
    partner_two: wedding?.partner_two ?? "",
    wedding_date: wedding?.wedding_date ?? "",
    ceremony_time: wedding?.ceremony_time ?? "",
    venue: wedding?.venue ?? "",
    city: wedding?.city ?? "",
    guest_estimate: String(wedding?.guest_estimate ?? ""),
  }));

  if (!wedding) return null;

  function save(e: FormEvent) {
    e.preventDefault();
    updateWedding({
      ...form,
      wedding_date: form.wedding_date || null,
      ceremony_time: form.ceremony_time || null,
      guest_estimate: Number(form.guest_estimate) || 0,
    });
    toast.success("Gegevens opgeslagen");
  }

  function exportJson() {
    const { wedding: w, tasks, guests, vendors, budget_items, timeline_events, seating_tables, inspirations } = store;
    const data = { exported_at: new Date().toISOString(), wedding: w, tasks, guests, vendors, budget_items, timeline_events, seating_tables, inspirations };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "bruiloft-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function destroy() {
    try {
      await deleteWedding();
      toast.info("Planning verwijderd");
      router.replace("/onboarding");
    } catch (e) {
      toast.error("Verwijderen mislukt", e instanceof Error ? e.message : undefined);
    }
  }

  const f = <K extends keyof typeof form>(k: K) => ({
    value: form[k],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <>
      <PageHeader eyebrow="Alles op maat" title="Instellingen" />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={save} className="card p-6">
            <h2 className="text-2xl font-semibold">Jullie bruiloft</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input label="Partner 1" {...f("partner_one")} />
              <Input label="Partner 2" {...f("partner_two")} />
              <Input label="Trouwdatum" type="date" {...f("wedding_date")} />
              <Input label="Tijd ceremonie" type="time" {...f("ceremony_time")} />
              <Input label="Locatie" {...f("venue")} />
              <Input label="Plaats" {...f("city")} />
              <Input label="Verwacht aantal gasten" type="number" min={0} {...f("guest_estimate")} />
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="submit">Opslaan</Button>
            </div>
          </motion.form>

          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
            <h2 className="text-2xl font-semibold">Stijl & kleuren</h2>
            <p className="mt-1 text-sm text-ink-500">Wordt gebruikt voor het moodboard en AI-suggesties.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Stijl">
              {WEDDING_STYLES.map((s) => {
                const active = wedding.style === s.value;
                return (
                  <button
                    key={s.value}
                    role="radio"
                    aria-checked={active}
                    onClick={() => updateWedding({ style: s.value, color_palette: s.colors })}
                    className={cn("flex items-center gap-3 rounded-2xl border p-3 text-left transition", active ? "border-rose-400 bg-rose-50" : "border-line hover:border-rose-200")}
                  >
                    <div className="flex -space-x-2">
                      {s.colors.map((c) => (
                        <span key={c} className="size-7 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />
                      ))}
                    </div>
                    <span className="flex-1 font-medium">{s.value}</span>
                    {active && <Check className="size-4 text-rose-600" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </motion.section>
        </div>

        <div className="space-y-6">
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
            <h2 className="text-xl font-semibold">Status</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                {mode === "supabase" ? <Cloud className="mt-0.5 size-5 text-sage-600" aria-hidden /> : <HardDrive className="mt-0.5 size-5 text-gold-600" aria-hidden />}
                <div>
                  <p className="font-medium">
                    Opslag <Badge tone={mode === "supabase" ? "sage" : "gold"}>{mode === "supabase" ? "Supabase" : "Lokaal"}</Badge>
                  </p>
                  <p className="text-ink-500">
                    {mode === "supabase"
                      ? `Veilig opgeslagen in jullie account${email ? ` (${email})` : ""}.`
                      : "Gegevens staan in deze browser. Koppel Supabase om te synchroniseren tussen apparaten."}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className={cn("mt-0.5 size-5", ai ? "text-sage-600" : "text-ink-300")} aria-hidden />
                <div>
                  <p className="font-medium">
                    AI-assistent <Badge tone={ai ? "sage" : "ink"}>{ai === null ? "…" : ai ? "Actief" : "Uit"}</Badge>
                  </p>
                  <p className="text-ink-500">{ai ? "Aangedreven door fal.ai." : "Stel FAL_KEY in om AI-functies te activeren."}</p>
                </div>
              </li>
            </ul>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
            <h2 className="text-xl font-semibold">Gegevens</h2>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="secondary" onClick={exportJson}>
                <Download className="size-4" aria-hidden /> Backup downloaden
              </Button>
              <Button variant="danger" onClick={() => setConfirm(true)}>
                <Trash2 className="size-4" aria-hidden /> Planning verwijderen
              </Button>
            </div>
          </motion.section>
        </div>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Planning verwijderen?"
        description="Alle taken, gasten, leveranciers en andere gegevens worden permanent verwijderd."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>Annuleren</Button>
            <Button onClick={destroy} disabled={confirmText.toLowerCase() !== "verwijderen"} className="bg-rose-700">
              Definitief verwijderen
            </Button>
          </>
        }
      >
        <Input label='Typ "verwijderen" om te bevestigen' value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
      </Modal>
    </>
  );
}
