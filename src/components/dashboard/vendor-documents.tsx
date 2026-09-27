"use client";

import { Download, FileText, Loader2, Paperclip, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useWedding } from "@/lib/store";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { nowIso, uid } from "@/lib/utils";

const MAX = 20 * 1024 * 1024;
const size = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} kB`);

/** Contracten en offertes bij een leverancier (privé opslag in Supabase). */
export function VendorDocuments({ vendorId }: { vendorId: string }) {
  const { wedding, documents, add, remove, mode } = useWedding();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const sb = getSupabaseBrowser();
  const list = documents.filter((d) => d.vendor_id === vendorId);

  if (mode !== "supabase") {
    return <p className="rounded-xl bg-ivory px-3 py-2 text-sm text-ink-500">Documenten bewaren (contracten, offertes) kan zodra Supabase is gekoppeld.</p>;
  }

  async function upload(file?: File) {
    if (!file || !sb || !wedding) return;
    if (file.size > MAX) return toast.error("Bestand te groot", "Maximaal 20 MB.");
    setBusy(true);
    const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
    const path = `${wedding.id}/${uid()}-${safe}`;
    const { error } = await sb.storage.from("documents").upload(path, file, { contentType: file.type || "application/octet-stream" });
    setBusy(false);
    if (input.current) input.current.value = "";
    if (error) return toast.error("Uploaden mislukt", /bucket not found/i.test(error.message) ? "Voer eerst de nieuwste database-migratie uit." : error.message);
    add("documents", { id: uid(), wedding_id: wedding.id, created_at: nowIso(), vendor_id: vendorId, name: file.name.slice(0, 200), path, size: file.size, mime: file.type });
    toast.success("Document toegevoegd");
  }

  /** Downloaden via een tijdelijke beveiligde link (60 sec). Geen window.open: dat blokkeert
   *  Safari na een netwerkverzoek als pop-up. */
  async function open(path: string, name: string) {
    if (!sb) return;
    const { data, error } = await sb.storage.from("documents").createSignedUrl(path, 60, { download: name });
    if (error || !data) return toast.error("Downloaden mislukt", error?.message);
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function del(id: string, path: string) {
    if (!sb) return;
    await sb.storage.from("documents").remove([path]);
    remove("documents", id);
  }

  return (
    <div>
      {list.length > 0 && (
        <ul className="mb-3 divide-y divide-line rounded-2xl border border-line">
          {list.map((d) => (
            <li key={d.id} className="flex items-center gap-2 px-3 py-2">
              <FileText className="size-4 shrink-0 text-rose-500" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{d.name}</span>
                <span className="text-xs text-ink-500">{size(d.size)}</span>
              </span>
              <button type="button" onClick={() => open(d.path, d.name)} className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-700" aria-label={`${d.name} downloaden`}>
                <Download className="size-4" />
              </button>
              <button type="button" onClick={() => del(d.id, d.path)} className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-700" aria-label={`${d.name} verwijderen`}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-dashed border-ink-300 px-4 text-sm text-ink-700 hover:border-rose-300 hover:bg-rose-50">
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Paperclip className="size-4" aria-hidden />}
        {busy ? "Uploaden…" : "Contract of offerte toevoegen"}
        <input ref={input} type="file" className="sr-only" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.heic,.txt" onChange={(e) => void upload(e.target.files?.[0])} disabled={busy} />
      </label>
    </div>
  );
}
