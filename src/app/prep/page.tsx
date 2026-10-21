"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTrip } from "@/components/TripProvider";
import { Loading } from "@/components/Loading";
import { Sheet } from "@/components/Sheet";
import {
  Button,
  Chip,
  Field,
  SectionLabel,
  inputClass,
  spring,
} from "@/components/ui";
import {
  CHECKLIST_SECTIONS,
  CHECKLIST_SECTION_KEYS,
  TRAVELLERS,
  type ChecklistDraft,
  type ChecklistItem,
  type Traveller,
  type Who,
} from "@/lib/types";
import { TRIP_START, diffDays, shortDate, todayInJapan } from "@/lib/dates";

/** Open things first, soonest deadline first; ticked-off things sink. */
const byUrgency = (a: ChecklistItem, b: ChecklistItem) =>
  Number(a.done) - Number(b.done) ||
  (a.due_by ?? "9999").localeCompare(b.due_by ?? "9999") ||
  a.sort_order - b.sort_order;

export default function PrepPage() {
  const { checklist, loading } = useTrip();
  const [who, setWho] = useState<Traveller | null>(null);
  const [hideDone, setHideDone] = useState(false);
  const [editing, setEditing] = useState<ChecklistDraft | null>(null);

  if (loading) return <Loading />;

  const today = todayInJapan();
  const done = checklist.filter((c) => c.done).length;
  const total = checklist.length;
  const next = checklist.filter((c) => !c.done && c.due_by).sort(byUrgency)[0];
  const overdue = checklist.filter(
    (c) => !c.done && c.due_by && c.due_by < today,
  ).length;
  const shown = checklist.filter(
    (c) =>
      (!who || c.owner === who || c.owner === "both") && (!hideDone || !c.done),
  );

  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-extrabold">Prep</h1>
        <Button variant="ink" onClick={() => setEditing({ section: "book" })}>
          + Add
        </Button>
      </div>

      <section className="paper-card relative mt-5 p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-2xl font-bold">
            {done} of {total} done
          </p>
          <p className="vhs-text text-lg uppercase text-ink-soft">
            {Math.max(diffDays(today, TRIP_START), 0)} days to go
          </p>
        </div>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-paper-edge"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label="Checklist progress"
        >
          <motion.div
            className="h-full rounded-full bg-sakura"
            initial={false}
            animate={{ width: total ? `${(done / total) * 100}%` : 0 }}
            transition={spring}
          />
        </div>
        {next && (
          <p className="mt-3 text-sm text-ink-soft">
            Next up: <span className="text-ink">{next.title}</span> · by{" "}
            {shortDate(next.due_by!)}
          </p>
        )}
        {overdue > 0 && (
          <p className="mt-1 text-sm font-medium text-tape-red">
            {overdue} overdue
          </p>
        )}
      </section>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={!who} onClick={() => setWho(null)}>
          Everyone
        </Chip>
        {(Object.keys(TRAVELLERS) as Traveller[]).map((w) => (
          <Chip
            key={w}
            active={who === w}
            color={TRAVELLERS[w].color}
            onClick={() => setWho(who === w ? null : w)}
          >
            {TRAVELLERS[w].name}&apos;s
          </Chip>
        ))}
        <Chip active={hideDone} onClick={() => setHideDone((v) => !v)}>
          Hide done
        </Chip>
      </div>

      <div className="md:columns-2 md:gap-8">
        {CHECKLIST_SECTION_KEYS.map((key) => {
          const all = checklist.filter((c) => c.section === key);
          const rows = shown.filter((c) => c.section === key).sort(byUrgency);
          if (rows.length === 0) return null;
          const sec = CHECKLIST_SECTIONS[key];
          return (
            <div key={key} className="break-inside-avoid">
              <SectionLabel>
                <span className="font-display" style={{ color: sec.color }}>
                  {sec.kanji}
                </span>{" "}
                {sec.label} · {all.filter((c) => c.done).length}/{all.length}
              </SectionLabel>
              <ul className="paper-card divide-y divide-paper-edge">
                <AnimatePresence initial={false}>
                  {rows.map((c) => (
                    <CheckRow
                      key={c.id}
                      item={c}
                      today={today}
                      onEdit={() => setEditing(c)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          );
        })}
      </div>

      {shown.length === 0 && (
        <p className="py-10 text-center text-ink-soft">
          {total ? "All done here. 準備完了!" : "Nothing on the list yet."}
        </p>
      )}

      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit to-do" : "New to-do"}
      >
        {editing && (
          <CheckForm
            key={editing.id ?? "new"}
            initial={editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Sheet>
    </>
  );
}

function CheckRow({
  item,
  today,
  onEdit,
}: {
  item: ChecklistItem;
  today: string;
  onEdit: () => void;
}) {
  const { updateCheck, me } = useTrip();
  const toggle = () =>
    updateCheck(item.id, {
      done: !item.done,
      done_by: item.done ? null : me,
      done_at: item.done ? null : new Date().toISOString(),
    });

  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={spring}
      className="flex items-start gap-3 px-4 py-3"
    >
      <motion.button
        type="button"
        role="checkbox"
        aria-checked={item.done}
        aria-label={`Mark "${item.title}" ${item.done ? "not done" : "done"}`}
        whileTap={{ scale: 0.85 }}
        transition={spring}
        onClick={toggle}
        className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center"
      >
        <span
          className={`hanko flex h-8 w-8 items-center justify-center text-lg ${item.done ? "text-tape-red" : "text-paper-edge"}`}
          style={{ transform: "rotate(-6deg)" }}
        >
          {item.done ? "済" : ""}
        </span>
      </motion.button>
      <button
        type="button"
        onClick={onEdit}
        className="min-w-0 flex-1 py-1.5 text-left"
      >
        <p
          className={`text-[15px] font-medium leading-snug ${item.done ? "text-ink-soft line-through" : ""}`}
        >
          {item.title}
        </p>
        {item.notes && !item.done && (
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {item.notes}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {item.done ? (
            item.done_by && (
              <span className="text-xs text-ink-soft">
                Done by {TRAVELLERS[item.done_by].name}
              </span>
            )
          ) : (
            <DueTag due={item.due_by} today={today} />
          )}
          {item.owner !== "both" && (
            <span
              className="rounded-full px-2 text-xs font-bold leading-5 text-[#2a2522]"
              style={{ background: TRAVELLERS[item.owner].color }}
            >
              {TRAVELLERS[item.owner].name}
            </span>
          )}
        </div>
      </button>
    </motion.li>
  );
}

function DueTag({ due, today }: { due: string | null; today: string }) {
  if (!due) return null;
  const left = diffDays(today, due);
  const tone =
    left < 0
      ? "bg-tape-red text-washi"
      : left <= 14
        ? "bg-sakura text-[#2a2522]"
        : "border border-paper-edge text-ink-soft";
  const label =
    left < 0 ? "Overdue" : left === 0 ? "Today" : left <= 14 ? `${left}d` : "";
  return (
    <span className={`vhs-text rounded px-1.5 text-sm uppercase ${tone}`}>
      {label && `${label} · `}by {shortDate(due)}
    </span>
  );
}

function CheckForm({
  initial,
  onDone,
}: {
  initial: ChecklistDraft;
  onDone: () => void;
}) {
  const { saveCheck, deleteCheck } = useTrip();
  const [draft, setDraft] = useState<ChecklistDraft>(() => ({
    owner: "both",
    ...initial,
  }));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ChecklistDraft>(k: K, v: ChecklistDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  async function save() {
    const title = draft.title?.trim();
    if (!title) return;
    setSaving(true);
    const { id, section, notes, due_by, owner } = draft;
    const saved = await saveCheck({
      id,
      title,
      section,
      owner,
      notes: notes?.trim() || null,
      due_by: due_by || null,
    });
    setSaving(false);
    if (saved) onDone();
  }

  return (
    <div className="space-y-5">
      <Field label="What needs doing">
        <input
          className={inputClass}
          placeholder="e.g. Book the Kyoto ryokan"
          value={draft.title ?? ""}
          onChange={(e) => set("title", e.target.value)}
        />
      </Field>

      <Field label="Section" group>
        <div className="flex flex-wrap gap-2">
          {CHECKLIST_SECTION_KEYS.map((k) => (
            <Chip
              key={k}
              active={draft.section === k}
              color={CHECKLIST_SECTIONS[k].color}
              onClick={() => set("section", k)}
            >
              <span className="font-display">
                {CHECKLIST_SECTIONS[k].kanji}
              </span>{" "}
              {CHECKLIST_SECTIONS[k].label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Do it by">
        <input
          type="date"
          className={inputClass}
          max={TRIP_START}
          value={draft.due_by ?? ""}
          onChange={(e) => set("due_by", e.target.value || null)}
        />
      </Field>

      <Field label="Whose job" group>
        <div className="flex flex-wrap gap-2">
          {(["both", "josh", "sam"] as Who[]).map((w) => (
            <Chip
              key={w}
              active={draft.owner === w}
              color={w === "both" ? undefined : TRAVELLERS[w].color}
              onClick={() => set("owner", w)}
            >
              {w === "both" ? "Both of us" : TRAVELLERS[w].name}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Notes">
        <textarea
          rows={3}
          className={inputClass}
          value={draft.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
        />
      </Field>

      <div className="flex gap-3">
        {draft.id && (
          <Button
            variant="ghost"
            onClick={async () => {
              await deleteCheck(draft.id!);
              onDone();
            }}
          >
            Delete
          </Button>
        )}
        <Button
          variant="ink"
          className="flex-1"
          disabled={saving || !draft.title?.trim()}
          onClick={save}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
