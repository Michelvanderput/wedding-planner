"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ListChecks, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Fab } from "@/components/ui/fab";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Badge, Bar, EmptyState, PageHeader } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { aiText, useAiEnabled } from "@/lib/ai";
import { PRIORITY_LABEL, TASK_CATEGORIES } from "@/lib/defaults";
import { haptic } from "@/lib/pwa/haptics";
import { useWedding } from "@/lib/store";
import type { Assignee, Priority, Task } from "@/lib/types";
import { AssigneeBadge, assigneeLabel, assigneeOptions } from "@/components/dashboard/assignee";
import { addMonths, cn, coupleName, daysUntil, formatDate, formatDateShort, nowIso, parseDate, toDateInput, uid } from "@/lib/utils";

type Filter = "open" | "done" | "all";
type Group = "time" | "category";

const blank = (): Omit<Task, "id" | "wedding_id" | "created_at"> => ({
  title: "",
  category: "Algemeen",
  due_date: null,
  done: false,
  priority: "medium",
  notes: "",
  assignee: "",
});

function bucket(t: Task) {
  const d = daysUntil(t.due_date);
  if (d === null) return "Zonder datum";
  if (d < 0) return "Te laat";
  if (d <= 31) return "Deze maand";
  if (d <= 92) return "Komende 3 maanden";
  return "Later";
}
const BUCKETS = ["Te laat", "Deze maand", "Komende 3 maanden", "Later", "Zonder datum"];

interface Suggestion {
  title: string;
  category: string;
  months_before: number;
  priority: Priority;
  pick: boolean;
}

export default function ChecklistPage() {
  const { wedding, tasks, add, update, remove, guests } = useWedding();
  const toast = useToast();
  const ai = useAiEnabled();
  const [filter, setFilter] = useState<Filter>("open");
  const [who, setWho] = useState<"all" | Assignee>("all");
  const [group, setGroup] = useState<Group>("time");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [draft, setDraft] = useState(blank());
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const done = tasks.filter((t) => t.done).length;

  const groups = useMemo(() => {
    const q = query.toLowerCase();
    const list = tasks
      .filter((t) => (filter === "all" ? true : filter === "done" ? t.done : !t.done))
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
      // Iemands taken = aan die persoon toegewezen óf samen
      .filter((t) => who === "all" || t.assignee === who || (who !== "" && who !== "ceremoniemeester" && t.assignee === "both"))
      .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
    const map = new Map<string, Task[]>();
    for (const t of list) {
      const k = group === "time" ? (t.done ? "Afgerond" : bucket(t)) : t.category;
      map.set(k, [...(map.get(k) ?? []), t]);
    }
    const order = group === "time" ? [...BUCKETS, "Afgerond"] : [...map.keys()].sort();
    return order.filter((k) => map.has(k)).map((k) => [k, map.get(k)!] as const);
  }, [tasks, filter, group, query, who]);

  function openNew() {
    setEditing(null);
    setDraft(blank());
    setOpen(true);
  }
  function openEdit(t: Task) {
    setEditing(t);
    setDraft({ title: t.title, category: t.category, due_date: t.due_date, done: t.done, priority: t.priority, notes: t.notes, assignee: t.assignee ?? "" });
    setOpen(true);
  }
  function save() {
    if (!draft.title.trim() || !wedding) return;
    if (editing) update("tasks", editing.id, draft);
    else add("tasks", { ...draft, id: uid(), wedding_id: wedding.id, created_at: nowIso() });
    setOpen(false);
    toast.success(editing ? "Taak bijgewerkt" : "Taak toegevoegd");
  }

  function toggle(t: Task) {
    haptic(t.done ? 6 : [8, 40, 12]);
    update("tasks", t.id, { done: !t.done });
    if (!t.done) {
      const left = tasks.length - done - 1;
      if (left === 0) toast.success("Alles afgevinkt!", "Jullie zijn helemaal klaar voor de grote dag.");
    }
  }

  async function suggest() {
    if (!wedding) return;
    setAiOpen(true);
    setAiLoading(true);
    setSuggestions([]);
    try {
      const res = await aiText("checklist", {
        couple: coupleName(wedding.partner_one, wedding.partner_two),
        date: formatDate(wedding.wedding_date),
        venue: wedding.venue,
        city: wedding.city,
        style: wedding.style,
        guests: guests.length || wedding.guest_estimate,
        budget: wedding.budget_total,
        existing: tasks.map((t) => t.title).join("; "),
      });
      const items = (res.items ?? []) as Omit<Suggestion, "pick">[];
      setSuggestions(items.filter((i) => i?.title).map((i) => ({ ...i, pick: true })));
    } catch (e) {
      toast.error("Geen suggesties ontvangen", e instanceof Error ? e.message : undefined);
      setAiOpen(false);
    } finally {
      setAiLoading(false);
    }
  }

  function addSuggestions() {
    if (!wedding) return;
    const date = parseDate(wedding.wedding_date) ?? addMonths(new Date(), 12);
    const today = new Date();
    const rows: Task[] = suggestions
      .filter((s) => s.pick)
      .map((s) => {
        const scale = Math.min(1, Math.max(0, (date.getTime() - today.getTime()) / 86_400_000 / 365));
        let due = new Date(date.getTime() - Math.max(0, Number(s.months_before) || 0) * 30.4 * scale * 86_400_000);
        if (due < today) due = today;
        return {
          id: uid(),
          wedding_id: wedding.id,
          created_at: nowIso(),
          title: String(s.title).slice(0, 200),
          category: TASK_CATEGORIES.includes(s.category) ? s.category : "Algemeen",
          due_date: toDateInput(due),
          done: false,
          priority: (["low", "medium", "high"] as const).includes(s.priority) ? s.priority : "medium",
          notes: "",
          assignee: "" as const,
        };
      });
    if (rows.length) add("tasks", rows);
    setAiOpen(false);
    toast.success(`${rows.length} taken toegevoegd`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Stap voor stap"
        title="Takenlijst"
        description={`${done} van de ${tasks.length} taken afgerond. Afvinken voelt heerlijk.`}
        actions={
          <>
            {ai !== false && (
              <Button variant="secondary" onClick={suggest}>
                <Sparkles className="size-4 text-gold-600" aria-hidden /> AI-suggesties
              </Button>
            )}
            <Button onClick={openNew} className="max-sm:hidden">
              <Plus className="size-4" aria-hidden /> Nieuwe taak
            </Button>
          </>
        }
      />

      <div className="card mb-6 p-4 sm:p-5">
        <Bar value={tasks.length ? done / tasks.length : 0} label="Voortgang takenlijst" />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
            <label htmlFor="task-search" className="sr-only">Zoek taken</label>
            <input id="task-search" className="field pl-10" placeholder="Zoek een taak…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              ["open", "Open"],
              ["done", "Klaar"],
              ["all", "Alles"],
            ]}
            id="filter"
          />
          <label htmlFor="who" className="sr-only">Wie</label>
          <select id="who" value={who} onChange={(e) => setWho(e.target.value as "all" | Assignee)} className="field h-11 py-0 sm:w-44">
            <option value="all">Iedereen</option>
            {assigneeOptions(wedding).map((o) => (
              <option key={o.value || "none"} value={o.value}>
                {o.value === "" ? "Niet toegewezen" : o.value === "both" ? "Samen" : `Taken van ${o.label}`}
              </option>
            ))}
          </select>
          <Segmented
            value={group}
            onChange={setGroup}
            options={[
              ["time", "Planning"],
              ["category", "Categorie"],
            ]}
            id="group"
          />
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title="Nog geen taken" body="Voeg je eerste taak toe of laat AI suggesties doen." action={<Button onClick={openNew}>Nieuwe taak</Button>} />
      ) : groups.length === 0 ? (
        <p className="py-16 text-center text-ink-500">Geen taken gevonden.</p>
      ) : (
        <div className="space-y-8">
          {groups.map(([name, list]) => (
            <section key={name}>
              <h2 className={cn("mb-3 flex items-center gap-2 text-xl font-semibold", name === "Te laat" && "text-rose-700")}>
                {name} <span className="font-sans text-sm font-normal text-ink-500">{list.length}</span>
              </h2>
              <ul className="card divide-y divide-line overflow-hidden">
                <AnimatePresence initial={false}>
                  {list.map((t) => (
                    <motion.li
                      key={t.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                      className="group flex items-center gap-2 px-3 py-2 sm:px-4"
                    >
                      <button
                        onClick={() => toggle(t)}
                        role="checkbox"
                        aria-checked={t.done}
                        aria-label={t.title}
                        className="grid size-11 shrink-0 place-items-center"
                      >
                        <motion.span
                          animate={t.done ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                          transition={{ duration: 0.35 }}
                          className={cn(
                            "grid size-6 place-items-center rounded-full border-2 transition-colors duration-200",
                            t.done ? "border-sage-500 bg-sage-500 text-white" : "border-rose-200 hover:border-rose-400",
                          )}
                        >
                          {t.done && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                        </motion.span>
                      </button>
                      <button onClick={() => openEdit(t)} className="min-w-0 flex-1 py-1 text-left">
                        <p className={cn("font-medium transition-colors", t.done && "text-ink-500 line-through decoration-rose-300")}>{t.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ink-500">
                          {group === "time" && <span>{t.category}</span>}
                          {t.priority === "high" && !t.done && <Badge tone="rose">Belangrijk</Badge>}
                          {t.assignee && <span className="inline-flex items-center gap-1"><AssigneeBadge a={t.assignee} wedding={wedding} />{assigneeLabel(t.assignee, wedding)}</span>}
                          {t.notes && <span className="truncate">· {t.notes}</span>}
                        </p>
                      </button>
                      {t.due_date && <span className="hidden text-sm text-ink-500 tabular-nums sm:block">{formatDateShort(t.due_date)}</span>}
                      <button
                        onClick={() => openEdit(t)}
                        className="grid size-10 place-items-center rounded-full text-ink-500 opacity-100 transition hover:bg-rose-50 hover:text-rose-700 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                        aria-label={`Bewerk ${t.title}`}
                      >
                        <Pencil className="size-4" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Taak bewerken" : "Nieuwe taak"}
        footer={
          <>
            {editing && (
              <Button
                variant="danger"
                className="mr-auto"
                onClick={() => {
                  remove("tasks", editing.id);
                  setOpen(false);
                  toast.info("Taak verwijderd");
                }}
              >
                <Trash2 className="size-4" aria-hidden /> Verwijderen
              </Button>
            )}
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuleren</Button>
            <Button onClick={save} disabled={!draft.title.trim()}>Opslaan</Button>
          </>
        }
      >
        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Input className="sm:col-span-2" label="Taak" required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <Select label="Categorie" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} options={TASK_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <Input label="Deadline" type="date" value={draft.due_date ?? ""} onChange={(e) => setDraft({ ...draft, due_date: e.target.value || null })} />
          <Select
            label="Prioriteit"
            value={draft.priority}
            onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}
            options={(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))}
          />
          <Select label="Wie pakt het op?" value={draft.assignee} onChange={(e) => setDraft({ ...draft, assignee: e.target.value as Assignee })} options={assigneeOptions(wedding)} />
          <Textarea className="sm:col-span-2" label="Notities" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          <button type="submit" hidden />
        </form>
      </Modal>

      <Modal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title="Suggesties van Flora"
        description="Persoonlijke taken op basis van jullie bruiloft. Kies wat je wilt toevoegen."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAiOpen(false)}>Sluiten</Button>
            <Button onClick={addSuggestions} disabled={aiLoading || !suggestions.some((s) => s.pick)}>
              Toevoegen ({suggestions.filter((s) => s.pick).length})
            </Button>
          </>
        }
      >
        {aiLoading ? (
          <div className="space-y-3" aria-live="polite" aria-busy="true">
            <p className="flex items-center gap-2 text-sm text-ink-500">
              <Sparkles className="size-4 animate-pulse text-gold-500" aria-hidden /> Flora denkt met jullie mee…
            </p>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shine h-14 rounded-2xl bg-rose-50" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <motion.li key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <label className={cn("flex items-center gap-3 rounded-2xl border p-3 transition", s.pick ? "border-rose-300 bg-rose-50" : "border-line")}>
                  <input
                    type="checkbox"
                    checked={s.pick}
                    onChange={() => setSuggestions((all) => all.map((x, j) => (j === i ? { ...x, pick: !x.pick } : x)))}
                    className="size-5 accent-rose-600"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{s.title}</span>
                    <span className="text-sm text-ink-500">
                      {s.category} · {s.months_before} mnd van tevoren
                    </span>
                  </span>
                </label>
              </motion.li>
            ))}
          </ul>
        )}
      </Modal>
      <Fab label="Nieuwe taak" icon={Plus} onClick={openNew} />
    </>
  );
}
