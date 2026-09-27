"use client";

import { AlertTriangle, CheckCircle2, FileSpreadsheet, RefreshCw, Upload, XCircle } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { INVITED_LABEL, RSVP_LABEL } from "@/lib/defaults";
import { buildGuestWorkbook, downloadBlob, parseGuestFile, type ParsedRow } from "@/lib/guest-excel";
import { useWedding } from "@/lib/store";
import type { Guest } from "@/lib/types";
import { cn, nowIso, uid } from "@/lib/utils";

export function GuestImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { wedding, guests, add, update } = useWedding();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);

  function reset() {
    setRows(null);
    setError("");
    setFileName("");
    if (input.current) input.current.value = "";
  }

  function close() {
    reset();
    onClose();
  }

  async function template() {
    if (!wedding) return;
    setBusy(true);
    try {
      downloadBlob(await buildGuestWorkbook(wedding), "gastenlijst-template.xlsx");
    } catch (e) {
      toast.error("Downloaden mislukt", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  async function read(file: File | undefined) {
    if (!file || !wedding) return;
    setBusy(true);
    setError("");
    setFileName(file.name);
    try {
      setRows(await parseGuestFile(file, wedding, guests));
    } catch (e) {
      setRows(null);
      setError(e instanceof Error ? e.message : "Bestand lezen mislukt");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDrag(false);
    void read(e.dataTransfer.files?.[0]);
  }

  const valid = rows?.filter((r) => r.errors.length === 0) ?? [];
  const toAdd = valid.filter((r) => !r.matchId);
  const toUpdate = updateExisting ? valid.filter((r) => r.matchId) : [];
  const skipped = (rows?.length ?? 0) - toAdd.length - toUpdate.length;

  function commit() {
    if (!wedding) return;
    const now = nowIso();
    const newGuests: Guest[] = toAdd.map((r) => ({
      ...r.data,
      id: uid(),
      wedding_id: wedding.id,
      created_at: now,
      rsvp_token: uid(),
      table_id: null,
    }));
    if (newGuests.length) add("guests", newGuests);
    toUpdate.forEach((r) => update("guests", r.matchId!, r.data));
    toast.success("Import voltooid", `${newGuests.length} toegevoegd, ${toUpdate.length} bijgewerkt${skipped ? `, ${skipped} overgeslagen` : ""}.`);
    close();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Gastenlijst importeren"
      description="Vul het Excel-template in en upload het hier. Je ziet eerst een voorbeeld voordat er iets wordt opgeslagen."
      footer={
        rows ? (
          <>
            <Button variant="ghost" className="mr-auto" onClick={reset}>
              <RefreshCw className="size-4" aria-hidden /> Ander bestand
            </Button>
            <Button variant="secondary" onClick={close}>
              Annuleren
            </Button>
            <Button onClick={commit} disabled={toAdd.length + toUpdate.length === 0}>
              Importeer {toAdd.length + toUpdate.length} {toAdd.length + toUpdate.length === 1 ? "gast" : "gasten"}
            </Button>
          </>
        ) : undefined
      }
    >
      {!rows ? (
        <div className="space-y-5">
          <ol className="grid gap-3 sm:grid-cols-2">
            <li className="rounded-2xl border border-line bg-ivory/60 p-4">
              <p className="text-sm font-semibold text-ink-900">1. Download het template</p>
              <p className="mt-1 text-sm text-ink-500">Met keuzelijsten voor dag/avond, kant, +1 en RSVP.</p>
              <Button size="sm" variant="secondary" className="mt-3" onClick={template} loading={busy && !fileName}>
                <FileSpreadsheet className="size-4 text-sage-600" aria-hidden /> Template (.xlsx)
              </Button>
            </li>
            <li className="rounded-2xl border border-line bg-ivory/60 p-4">
              <p className="text-sm font-semibold text-ink-900">2. Vul in en upload</p>
              <p className="mt-1 text-sm text-ink-500">Ook je eigen .xlsx of .csv werkt, zolang er een kolom &ldquo;Naam&rdquo; in staat.</p>
            </li>
          </ol>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={cn(
              "flex min-h-44 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-4 py-8 text-center transition",
              drag ? "border-rose-400 bg-rose-50" : "border-line bg-white hover:border-rose-300 hover:bg-rose-50/40",
            )}
          >
            <Upload className={cn("size-8", drag ? "text-rose-600" : "text-rose-400")} aria-hidden />
            <span className="font-medium text-ink-900">{busy ? "Bestand lezen…" : "Sleep je bestand hierheen of klik om te kiezen"}</span>
            <span className="text-sm text-ink-500">.xlsx of .csv · max. 5 MB</span>
            <input
              ref={input}
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="sr-only"
              onChange={(e) => void read(e.target.files?.[0])}
            />
          </label>
          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="truncate text-sm text-ink-500">
            <FileSpreadsheet className="mr-1 inline size-4 align-text-bottom text-sage-600" aria-hidden />
            {fileName}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-sage-50 p-3">
              <p className="stat text-2xl text-sage-700">{toAdd.length}</p>
              <p className="text-xs text-ink-700">nieuw</p>
            </div>
            <div className="rounded-2xl bg-gold-50 p-3">
              <p className="stat text-2xl text-gold-700">{toUpdate.length}</p>
              <p className="text-xs text-ink-700">bijwerken</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3">
              <p className="stat text-2xl text-rose-700">{skipped}</p>
              <p className="text-xs text-ink-700">overslaan</p>
            </div>
          </div>
          {valid.some((r) => r.matchId) && (
            <div className="rounded-2xl border border-line px-3">
              <Toggle checked={updateExisting} onChange={setUpdateExisting} label="Gasten die al in de lijst staan bijwerken" />
            </div>
          )}

          <div className="max-h-[42dvh] overflow-auto rounded-2xl border border-line">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="sticky top-0 bg-ivory text-xs text-ink-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Regel</th>
                  <th className="px-3 py-2 font-medium">Naam</th>
                  <th className="px-3 py-2 font-medium">Als</th>
                  <th className="px-3 py-2 font-medium">RSVP</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => {
                  const bad = r.errors.length > 0;
                  const willUpdate = !bad && r.matchId && updateExisting;
                  const skip = bad || (r.matchId && !updateExisting);
                  return (
                    <tr key={r.row} className={cn(bad && "bg-rose-50/60")}>
                      <td className="px-3 py-2 text-ink-500 tabular-nums">{r.row}</td>
                      <td className="px-3 py-2 font-medium">
                        {r.data.name || <em className="text-ink-300">leeg</em>}
                        {r.data.plus_one && <span className="text-ink-500"> +1</span>}
                      </td>
                      <td className="px-3 py-2 text-ink-700">{INVITED_LABEL[r.data.invited_to]}</td>
                      <td className="px-3 py-2 text-ink-700">{RSVP_LABEL[r.data.rsvp]}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium",
                            skip ? "text-rose-700" : willUpdate ? "text-gold-700" : "text-sage-700",
                          )}
                        >
                          {skip ? <XCircle className="size-3.5" aria-hidden /> : <CheckCircle2 className="size-3.5" aria-hidden />}
                          {bad ? r.errors.join(", ") : skip ? "Bestaat al" : willUpdate ? "Bijwerken" : "Nieuw"}
                        </span>
                        {r.warnings.length > 0 && (
                          <span className="mt-0.5 flex items-start gap-1 text-xs text-gold-700">
                            <AlertTriangle className="mt-px size-3 shrink-0" aria-hidden /> {r.warnings.join("; ")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
