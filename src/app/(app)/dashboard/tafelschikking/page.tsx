"use client";

import { LayoutGroup, motion } from "framer-motion";
import { Armchair, GripVertical, Pencil, Plus, Trash2, UserMinus, Users } from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";
import { Fab } from "@/components/ui/fab";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useWedding } from "@/lib/store";
import type { Guest, SeatingTable } from "@/lib/types";
import { cn, initials, nowIso, uid } from "@/lib/utils";

type Draft = Pick<SeatingTable, "name" | "capacity" | "shape">;

/** Aantal plekken dat een gast inneemt (inclusief +1). */
const seats = (g: Guest) => (g.plus_one ? 2 : 1);

export default function SeatingPage() {
  const { wedding, guests, seating_tables, add, update, remove } = useWedding();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SeatingTable | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: "", capacity: 8, shape: "round" });
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const seatable = useMemo(() => guests.filter((g) => g.rsvp !== "declined" && g.invited_to === "day"), [guests]);
  const unassigned = seatable.filter((g) => !g.table_id || !seating_tables.some((t) => t.id === g.table_id));
  const byTable = (id: string) => seatable.filter((g) => g.table_id === id);
  const totalSeats = seating_tables.reduce((a, t) => a + t.capacity, 0);
  const needed = seatable.reduce((a, g) => a + seats(g), 0);

  function assign(guestId: string, tableId: string | null) {
    const g = guests.find((x) => x.id === guestId);
    if (!g || g.table_id === tableId) return;
    if (tableId) {
      const t = seating_tables.find((x) => x.id === tableId);
      const used = byTable(tableId).reduce((a, x) => a + seats(x), 0);
      if (t && used + seats(g) > t.capacity) {
        toast.error(`${t.name} is vol`, "Verhoog de capaciteit of kies een andere tafel.");
        return;
      }
    }
    update("guests", guestId, { table_id: tableId });
  }

  const onDrop = (tableId: string | null) => (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setDragOver(null);
    setDragging(null);
    if (id) assign(id, tableId);
  };
  const allowDrop = (key: string) => (e: DragEvent) => {
    e.preventDefault();
    setDragOver(key);
  };

  function openNew() {
    setEditing(null);
    setDraft({ name: `Tafel ${seating_tables.length + 1}`, capacity: 8, shape: "round" });
    setOpen(true);
  }
  function openEdit(t: SeatingTable) {
    setEditing(t);
    setDraft({ name: t.name, capacity: t.capacity, shape: t.shape });
    setOpen(true);
  }
  function save() {
    if (!draft.name.trim() || !wedding) return;
    const clean = { ...draft, capacity: Math.max(1, Math.min(40, Number(draft.capacity) || 1)) };
    if (editing) update("seating_tables", editing.id, clean);
    else add("seating_tables", { ...clean, id: uid(), wedding_id: wedding.id, created_at: nowIso() });
    setOpen(false);
  }

  const chip = (g: Guest, inTable = false) => (
    <motion.li
      key={g.id}
      layout
      layoutId={`guest-${g.id}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: dragging === g.id ? 0.4 : 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
    >
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", g.id);
          e.dataTransfer.effectAllowed = "move";
          setDragging(g.id);
        }}
        onDragEnd={() => setDragging(null)}
        className="group flex cursor-grab items-center gap-2 rounded-xl border border-line bg-white py-1.5 pr-1.5 pl-2 text-sm shadow-sm active:cursor-grabbing"
      >
      <GripVertical className="size-3.5 shrink-0 text-ink-300" aria-hidden />
      <span className="min-w-0 flex-1 truncate">
        {g.name}
        {g.plus_one && <span className="text-ink-500"> +1</span>}
      </span>
      {inTable ? (
        <button onClick={() => assign(g.id, null)} className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-rose-50 hover:text-rose-700" aria-label={`${g.name} van tafel halen`}>
          <UserMinus className="size-3.5" />
        </button>
      ) : (
        <>
          <label htmlFor={`seat-${g.id}`} className="sr-only">Tafel voor {g.name}</label>
          <select
            id={`seat-${g.id}`}
            value=""
            onChange={(e) => assign(g.id, e.target.value || null)}
            className="h-8 max-w-24 rounded-lg border border-line bg-ivory px-1.5 text-xs text-ink-700"
          >
            <option value="">Tafel…</option>
            {seating_tables.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </>
      )}
      </div>
    </motion.li>
  );

  return (
    <>
      <PageHeader
        eyebrow="Wie zit waar?"
        title="Tafelschikking"
        description="Sleep daggasten naar een tafel, of kies een tafel via het menu. Afmeldingen worden automatisch overgeslagen."
        actions={
          <Button onClick={openNew} className="max-sm:hidden">
            <Plus className="size-4" aria-hidden /> Tafel
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { l: "Tafels", v: seating_tables.length },
          { l: "Plekken", v: `${needed} / ${totalSeats}` },
          { l: "Nog plaatsen", v: unassigned.length },
        ].map((s) => (
          <div key={s.l} className="card p-4">
            <p className="text-sm text-ink-500">{s.l}</p>
            <p className={cn("stat text-2xl tabular-nums sm:text-3xl", s.l === "Plekken" && needed > totalSeats && "text-rose-700")}>{s.v}</p>
          </div>
        ))}
      </div>

      <LayoutGroup>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Nog niet geplaatst */}
        <section
          onDragOver={allowDrop("pool")}
          onDragLeave={() => setDragOver(null)}
          onDrop={onDrop(null)}
          className={cn("card h-fit p-4 transition lg:sticky lg:top-6", dragOver === "pool" && "ring-2 ring-rose-300")}
          aria-label="Nog niet geplaatst"
        >
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <Users className="size-5 text-rose-500" aria-hidden /> Nog te plaatsen
            <span className="ml-auto font-sans text-sm font-normal text-ink-500">{unassigned.length}</span>
          </h2>
          {unassigned.length === 0 ? (
            <p className="rounded-xl bg-sage-50 px-3 py-4 text-center text-sm text-sage-700">
              {seatable.length ? "Iedereen heeft een plekje!" : "Voeg eerst daggasten toe."}
            </p>
          ) : (
            <ul className="max-h-[60dvh] space-y-2 overflow-y-auto overscroll-contain pr-1">
              {unassigned.map((g) => chip(g))}
            </ul>
          )}
        </section>

        {/* Tafels */}
        {seating_tables.length === 0 ? (
          <EmptyState icon={Armchair} title="Nog geen tafels" body="Maak tafels aan en sleep je gasten erheen." action={<Button onClick={openNew}>Eerste tafel</Button>} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {seating_tables.map((t) => {
              const list = byTable(t.id);
              const used = list.reduce((a, g) => a + seats(g), 0);
              const full = used >= t.capacity;
              return (
                <motion.section
                  key={t.id}
                  layout
                  onDragOver={allowDrop(t.id)}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={onDrop(t.id)}
                  className={cn("card p-4 transition-shadow", dragOver === t.id && "shadow-[var(--shadow-lift)] ring-2 ring-rose-300")}
                  aria-label={t.name}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{t.name}</h3>
                    <button onClick={() => openEdit(t)} className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-700" aria-label={`Bewerk ${t.name}`}>
                      <Pencil className="size-4" />
                    </button>
                  </div>
                  <TableVisual table={t} guests={list} />
                  <p className={cn("mb-2 text-center text-sm tabular-nums", full ? "font-medium text-sage-700" : "text-ink-500")}>
                    {used} / {t.capacity} plekken {full && "· vol"}
                  </p>
                  <ul className="min-h-12 space-y-1.5 rounded-xl border border-dashed border-transparent p-0.5 data-[empty=true]:border-line" data-empty={list.length === 0}>
                    {list.map((g) => chip(g, true))}
                    {list.length === 0 && <li className="py-3 text-center text-xs text-ink-500">Sleep gasten hierheen</li>}
                  </ul>
                </motion.section>
              );
            })}
          </div>
        )}
      </div>
      </LayoutGroup>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Tafel bewerken" : "Nieuwe tafel"}
        footer={
          <>
            {editing && (
              <Button variant="danger" className="mr-auto" onClick={() => { remove("seating_tables", editing.id); setOpen(false); }}>
                <Trash2 className="size-4" aria-hidden /> Verwijderen
              </Button>
            )}
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuleren</Button>
            <Button onClick={save} disabled={!draft.name.trim()}>Opslaan</Button>
          </>
        }
      >
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Input className="sm:col-span-2" label="Naam" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input label="Aantal plekken" type="number" min={1} max={40} value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: Number(e.target.value) })} />
          <Select label="Vorm" value={draft.shape} onChange={(e) => setDraft({ ...draft, shape: e.target.value as "round" | "rect" })} options={[{ value: "round", label: "Rond" }, { value: "rect", label: "Lang" }]} />
          <button type="submit" hidden />
        </form>
      </Modal>
      <Fab label="Nieuwe tafel" icon={Plus} onClick={openNew} />
    </>
  );
}

function TableVisual({ table, guests }: { table: SeatingTable; guests: Guest[] }) {
  const names = guests.flatMap((g) => (g.plus_one ? [g.name, `+1 ${g.name}`] : [g.name]));
  const n = Math.min(table.capacity, 16);
  const size = 150;
  const c = size / 2;

  const positions = Array.from({ length: n }, (_, i) => {
    if (table.shape === "round") {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      return { x: c + Math.cos(a) * 58, y: c + Math.sin(a) * 58 };
    }
    const perSide = Math.ceil(n / 2);
    const side = i < perSide ? -1 : 1;
    const idx = i < perSide ? i : i - perSide;
    return { x: 20 + ((idx + 0.5) * (size - 40)) / perSide, y: c + side * 36 };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto my-2 size-36" role="img" aria-label={`${table.name}: ${names.length} van ${table.capacity} plekken bezet`}>
      {table.shape === "round" ? (
        <circle cx={c} cy={c} r={38} fill="var(--color-ivory-deep)" stroke="var(--color-gold-300)" strokeWidth="1.5" />
      ) : (
        <rect x={16} y={c - 20} width={size - 32} height={40} rx={10} fill="var(--color-ivory-deep)" stroke="var(--color-gold-300)" strokeWidth="1.5" />
      )}
      {positions.map((p, i) => {
        const taken = names[i];
        return (
          <g key={i}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r={11}
              initial={false}
              animate={{ fill: taken ? "var(--color-rose-400)" : "#ffffff" }}
              stroke={taken ? "var(--color-rose-500)" : "var(--color-line)"}
              strokeWidth="1.5"
            >
              {taken && <title>{taken}</title>}
            </motion.circle>
            {taken && (
              <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize="9" fontWeight="600" fill="#fff">
                {taken.startsWith("+1") ? "+1" : initials(taken)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
