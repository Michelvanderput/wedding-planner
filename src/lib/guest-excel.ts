"use client";

import { INVITED_LABEL, RSVP_LABEL } from "./defaults";
import type { Guest, InvitedTo, Rsvp, Side, Wedding } from "./types";

/** Velden die via Excel in- en uitgevoerd worden. */
export type GuestDraft = Pick<Guest, "name" | "email" | "phone" | "side" | "group_name" | "invited_to" | "rsvp" | "plus_one" | "dietary" | "meal">;

export interface ParsedRow {
  row: number; // regelnummer in het bestand
  data: GuestDraft;
  errors: string[];
  warnings: string[];
  matchId: string | null; // bestaande gast met dezelfde naam
}

const SHEET = "Gastenlijst";
const MAX_ROWS = 1000;

const clean = (s: string) => s.replace(/[",]/g, " ").replace(/\s+/g, " ").trim() || "?";

function sideLabels(w: Pick<Wedding, "partner_one" | "partner_two">): Record<Side, string> {
  return {
    partner_one: `Kant ${clean(w.partner_one || "partner 1")}`,
    partner_two: `Kant ${clean(w.partner_two || "partner 2")}`,
    both: "Gezamenlijk",
  };
}

const COLS = [
  { key: "name", header: "Naam *", width: 28 },
  { key: "email", header: "E-mail", width: 28 },
  { key: "phone", header: "Telefoon", width: 16 },
  { key: "invited_to", header: "Uitgenodigd als", width: 18 },
  { key: "side", header: "Kant", width: 20 },
  { key: "group_name", header: "Groep", width: 16 },
  { key: "plus_one", header: "+1", width: 8 },
  { key: "dietary", header: "Dieetwensen", width: 28 },
  { key: "meal", header: "Menukeuze", width: 18 },
  { key: "rsvp", header: "RSVP", width: 20 },
] as const;

type ColKey = (typeof COLS)[number]["key"];

/** Maakt het Excel-bestand: leeg template of een export van de huidige gasten. */
export async function buildGuestWorkbook(wedding: Wedding, guests: Guest[] = []): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Ja, ik wil!";
  wb.created = new Date();
  const sides = sideLabels(wedding);

  const ws = wb.addWorksheet(SHEET, { views: [{ state: "frozen", ySplit: 1 }] });
  // Eigen RSVP-vragen als extra kolommen (alleen export; bij importeren genegeerd).
  const questions = (wedding.site?.rsvp_questions ?? []).filter((q) => q.label.trim());
  ws.columns = [
    ...COLS.map((c) => ({ header: c.header, key: c.key, width: c.width })),
    ...questions.map((q) => ({ header: q.label, key: `q_${q.id}`, width: 26 })),
  ];

  const head = ws.getRow(1);
  head.height = 24;
  head.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFAE3B63" } };
    cell.alignment = { vertical: "middle" };
    cell.border = { bottom: { style: "thin", color: { argb: "FF8F2E50" } } };
  });
  ws.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + COLS.length + questions.length)}1` };

  for (const g of guests) {
    ws.addRow({
      name: g.name,
      email: g.email,
      phone: g.phone,
      invited_to: INVITED_LABEL[g.invited_to],
      side: sides[g.side],
      group_name: g.group_name,
      plus_one: g.plus_one ? "Ja" : "Nee",
      dietary: g.dietary,
      meal: g.meal ?? "",
      rsvp: RSVP_LABEL[g.rsvp],
      ...Object.fromEntries(questions.map((q) => [`q_${q.id}`, g.answers?.[q.id] ?? ""])),
    });
  }

  // Keuzelijsten voor vaste waarden.
  const lists: Partial<Record<ColKey, string[]>> = {
    invited_to: Object.values(INVITED_LABEL),
    side: Object.values(sides),
    plus_one: ["Ja", "Nee"],
    rsvp: Object.values(RSVP_LABEL),
  };
  COLS.forEach((c, i) => {
    const values = lists[c.key];
    if (!values) return;
    const col = String.fromCharCode(65 + i);
    for (let r = 2; r <= MAX_ROWS + 1; r++) {
      ws.getCell(`${col}${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${values.join(",")}"`],
        showErrorMessage: true,
        errorStyle: "warning",
        errorTitle: "Onbekende waarde",
        error: `Kies uit: ${values.join(", ")}`,
      };
    }
  });

  // Uitlegblad
  const info = wb.addWorksheet("Uitleg");
  info.getColumn(1).width = 22;
  info.getColumn(2).width = 70;
  const title = info.addRow(["Gastenlijst invullen"]);
  title.font = { bold: true, size: 16, color: { argb: "FF8F2E50" } };
  info.addRow([]);
  const rows: [string, string][] = [
    ["Naam *", "Verplicht. Eén gast per regel (voor stellen: zet de partner als +1 of op een eigen regel)."],
    ["E-mail / Telefoon", "Optioneel. Handig om de persoonlijke uitnodiging te versturen."],
    ["Uitgenodigd als", `${INVITED_LABEL.day} of ${INVITED_LABEL.evening}. Leeg = ${INVITED_LABEL.day}.`],
    ["Kant", `${Object.values(sides).join(", ")}. Leeg = Gezamenlijk.`],
    ["Groep", "Vrij veld, bijv. Familie, Vrienden, Werk, Sportclub."],
    ["+1", "Ja als de gast iemand mag meenemen. Leeg = Nee."],
    ["Dieetwensen", "Bijv. vegetarisch, glutenvrij, notenallergie."],
    ["Menukeuze", "Optioneel, bijv. Vlees, Vis of Vegetarisch."],
    ["RSVP", `${Object.values(RSVP_LABEL).join(", ")}. Leeg = ${RSVP_LABEL.pending}.`],
    ["", ""],
    ["Uploaden", "Sla het bestand op en kies in de app bij Gasten → Importeren. Je ziet eerst een voorbeeld voordat er iets wordt opgeslagen."],
    ["Bestaande gasten", "Staat een naam al in de app? Dan wordt die gast bijgewerkt in plaats van dubbel toegevoegd."],
  ];
  rows.forEach(([a, b]) => {
    const r = info.addRow([a, b]);
    r.getCell(1).font = { bold: true };
    r.getCell(2).alignment = { wrapText: true, vertical: "top" };
  });

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Inlezen ─────────────────────────────────────────────────────────────

const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9+]/g, "");

/** Kolomkoppen die we herkennen (ook Engels en veelvoorkomende varianten). */
const HEADER_ALIASES: Record<ColKey, string[]> = {
  name: ["naam", "name", "volledigenaam", "gast", "gastnaam", "voornaamachternaam", "fullname"],
  email: ["email", "emailadres", "mail", "mailadres"],
  phone: ["telefoon", "telefoonnummer", "tel", "mobiel", "phone", "gsm", "nummer"],
  invited_to: ["uitgenodigdals", "type", "dagofavond", "uitnodiging", "dagavond", "invitedto", "soort"],
  side: ["kant", "side", "familievan", "van"],
  group_name: ["groep", "group", "relatie", "categorie"],
  plus_one: ["+1", "plus1", "plusone", "introduce", "partnermee", "metpartner", "aanhang"],
  dietary: ["dieetwensen", "dieet", "allergieen", "allergie", "dietary", "dieetwensenallergieen", "eetwensen"],
  rsvp: ["rsvp", "status", "komt", "aanwezig", "reactie"],
  meal: ["menukeuze", "menu", "maaltijd", "gerecht", "hoofdgerecht", "meal"],
};

function mapHeaders(headers: unknown[]): Partial<Record<ColKey, number>> {
  const map: Partial<Record<ColKey, number>> = {};
  headers.forEach((h, i) => {
    const n = norm(h);
    if (!n) return;
    for (const [key, aliases] of Object.entries(HEADER_ALIASES) as [ColKey, string[]][]) {
      if (map[key] === undefined && (aliases.includes(n) || aliases.some((a) => a.length > 3 && n.startsWith(a)))) {
        map[key] = i;
        return;
      }
    }
  });
  return map;
}

const YES = ["ja", "j", "yes", "y", "true", "waar", "1", "x", "v"];

function toRow(
  cells: string[],
  map: Partial<Record<ColKey, number>>,
  wedding: Pick<Wedding, "partner_one" | "partner_two">,
): { data: GuestDraft; errors: string[]; warnings: string[] } {
  const get = (k: ColKey) => (map[k] !== undefined ? (cells[map[k]!] ?? "").trim() : "");
  const errors: string[] = [];
  const warnings: string[] = [];

  const name = get("name").slice(0, 120);
  if (!name) errors.push("Naam ontbreekt");

  const inv = norm(get("invited_to"));
  const invited_to: InvitedTo = inv.startsWith("avond") || inv.startsWith("even") ? "evening" : "day";
  if (inv && !["dag", "daggast", "day", "avond", "avondgast", "evening"].includes(inv)) warnings.push(`"${get("invited_to")}" gelezen als ${INVITED_LABEL[invited_to]}`);

  const s = norm(get("side"));
  const p1 = norm(wedding.partner_one);
  const p2 = norm(wedding.partner_two);
  let side: Side = "both";
  if (s && p1 && s.includes(p1)) side = "partner_one";
  else if (s && p2 && s.includes(p2)) side = "partner_two";
  else if (/^(kant)?(partner)?1$|bruid$/.test(s)) side = "partner_one";
  else if (/^(kant)?(partner)?2$|bruidegom$/.test(s)) side = "partner_two";
  else if (s && !/gezamenlijk|beide|both|samen/.test(s)) warnings.push(`Kant "${get("side")}" niet herkend → Gezamenlijk`);

  const r = norm(get("rsvp"));
  let rsvp: Rsvp = "pending";
  if (/^(komt|ja|yes|attending|aanwezig|bevestigd|j)$/.test(r)) rsvp = "attending";
  else if (/^(kanniet|nee|no|declined|afgemeld|afwezig|n)$/.test(r)) rsvp = "declined";
  else if (r && !/wacht|pending|open|onbekend/.test(r)) warnings.push(`RSVP "${get("rsvp")}" niet herkend → wacht op antwoord`);

  const email = get("email").slice(0, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) warnings.push("E-mailadres lijkt ongeldig");

  return {
    data: {
      name,
      email,
      phone: get("phone").slice(0, 40),
      invited_to,
      side,
      group_name: get("group_name").slice(0, 80),
      plus_one: YES.includes(norm(get("plus_one"))),
      dietary: get("dietary").slice(0, 500),
      meal: get("meal").slice(0, 100),
      rsvp,
    },
    errors,
    warnings,
  };
}

function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delim = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

async function readRows(file: File): Promise<string[][]> {
  if (/\.(csv|txt)$/i.test(file.name) || file.type === "text/csv") {
    return parseCsv((await file.text()).replace(/^﻿/, ""));
  }
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Kies een .xlsx- of .csv-bestand. (Oude .xls-bestanden eerst opslaan als .xlsx.)");
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new Error("Dit bestand kon niet worden gelezen. Is het een geldig Excel-bestand?");
  }
  const ws = wb.getWorksheet(SHEET) ?? wb.worksheets.find((w) => w.name !== "Uitleg") ?? wb.worksheets[0];
  if (!ws) throw new Error("Het bestand bevat geen werkblad.");
  const out: string[][] = [];
  ws.eachRow({ includeEmpty: true }, (row, n) => {
    const cells: string[] = [];
    for (let c = 1; c <= Math.max(row.cellCount, COLS.length); c++) cells.push(row.getCell(c).text ?? "");
    out[n - 1] = cells;
  });
  return Array.from(out, (r) => r ?? []);
}

/** Leest een geüpload bestand en vergelijkt met de bestaande gastenlijst. */
export async function parseGuestFile(
  file: File,
  wedding: Pick<Wedding, "partner_one" | "partner_two">,
  existing: Pick<Guest, "id" | "name">[],
): Promise<ParsedRow[]> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Het bestand is groter dan 5 MB.");
  const rows = await readRows(file);
  const headerIdx = rows.findIndex((r) => r.some((c) => norm(c)));
  if (headerIdx === -1) throw new Error("Het bestand is leeg.");
  const map = mapHeaders(rows[headerIdx]);
  if (map.name === undefined) throw new Error('Geen kolom "Naam" gevonden. Gebruik het template of zet "Naam" in de eerste rij.');

  const byName = new Map(existing.map((g) => [norm(g.name), g.id]));
  const seen = new Set<string>();
  const parsed: ParsedRow[] = [];

  rows.slice(headerIdx + 1).forEach((cells, i) => {
    if (!cells.some((c) => String(c).trim())) return; // lege regel
    const { data, errors, warnings } = toRow(cells.map(String), map, wedding);
    // Geen menukolom in het bestand? Dan de bestaande menukeuze niet overschrijven.
    if (map.meal === undefined) delete (data as Partial<GuestDraft>).meal;
    const key = norm(data.name);
    if (key && seen.has(key)) errors.push("Staat dubbel in het bestand");
    if (key) seen.add(key);
    parsed.push({ row: headerIdx + i + 2, data, errors, warnings, matchId: byName.get(key) ?? null });
  });
  if (parsed.length > MAX_ROWS) throw new Error(`Maximaal ${MAX_ROWS} gasten per import.`);
  return parsed;
}
