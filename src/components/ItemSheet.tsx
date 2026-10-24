"use client";

import { useState } from "react";
import { useTrip } from "./TripProvider";
import { PinField } from "./PinField";
import { PriceField } from "./PriceField";
import { parseCoords } from "@/lib/geocode";
import { Sheet } from "./Sheet";
import { Button, Chip, Field, Hanko, inputClass } from "./ui";
import {
  CATEGORIES,
  CATEGORY_KEYS,
  SLOTS,
  STATUSES,
  TRAVELLERS,
  type PlanItemDraft,
  type Who,
} from "@/lib/types";
import { TRIP_DATES, dayNumber, shortDate, weekday } from "@/lib/dates";

export function ItemSheet() {
  const { editing, closeItem } = useTrip();
  return (
    <Sheet
      open={!!editing}
      onClose={closeItem}
      title={editing?.id ? "Edit ticket" : "New ticket"}
    >
      {/* Remounts per opened ticket so the form starts fresh each time. */}
      {editing && <ItemForm key={editing.id ?? "new"} initial={editing} />}
    </Sheet>
  );
}

function ItemForm({ initial }: { initial: PlanItemDraft }) {
  const { closeItem, saveItem, deleteItem, days, me } = useTrip();
  const [draft, setDraft] = useState<PlanItemDraft>(() => ({
    category: "sights",
    status: initial.date ? "planned" : "idea",
    wish_of: me ?? "both",
    ...initial,
  }));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof PlanItemDraft>(k: K, v: PlanItemDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const cityFor = (date: string | null | undefined) =>
    days.find((d) => d.date === date)?.city;

  async function save() {
    if (!draft.title?.trim()) return;
    setSaving(true);
    const saved = await saveItem({
      ...draft,
      title: draft.title.trim(),
      city: draft.city || cityFor(draft.date) || null,
    });
    setSaving(false);
    if (saved) closeItem();
  }

  const isNew = !initial.id;

  return (
    <div className="space-y-5">
      <Field label="What">
        <input
          autoFocus={isNew}
          className={`${inputClass} font-display text-lg`}
          placeholder="e.g. Daikoku PA night meet"
          value={draft.title ?? ""}
          onChange={(e) => set("title", e.target.value)}
        />
      </Field>

      <Field label="Type" group>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {CATEGORY_KEYS.map((c) => (
            <Chip
              key={c}
              active={draft.category === c}
              color={CATEGORIES[c].color}
              onClick={() => set("category", c)}
            >
              <span className="font-display">{CATEGORIES[c].kanji}</span>{" "}
              {CATEGORIES[c].label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="When">
        <select
          className={inputClass}
          value={draft.date ?? ""}
          onChange={(e) => {
            const date = e.target.value || null;
            setDraft((d) => ({
              ...d,
              date,
              status:
                date && d.status === "idea"
                  ? "planned"
                  : !date && d.status === "planned"
                    ? "idea"
                    : d.status,
            }));
          }}
        >
          <option value="">Not scheduled yet (keep as an idea)</option>
          {TRIP_DATES.map((d) => (
            <option key={d} value={d}>
              Day {dayNumber(d)} · {weekday(d)} {shortDate(d)} ·{" "}
              {cityFor(d) ?? ""}
            </option>
          ))}
        </select>
      </Field>

      {draft.date && (
        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <Field label="Part of day" group>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map((s) => (
                <Chip
                  key={s.key}
                  active={draft.slot === s.key}
                  onClick={() =>
                    set("slot", draft.slot === s.key ? null : s.key)
                  }
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Time">
            <input
              type="time"
              className={`${inputClass} w-28`}
              value={draft.start_time?.slice(0, 5) ?? ""}
              onChange={(e) => set("start_time", e.target.value || null)}
            />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Area">
          <input
            className={inputClass}
            placeholder="Shimokitazawa"
            value={draft.area ?? ""}
            onChange={(e) => set("area", e.target.value || null)}
          />
        </Field>
        <Field label="City">
          <input
            className={inputClass}
            placeholder={cityFor(draft.date) ?? "Tokyo"}
            value={draft.city ?? ""}
            onChange={(e) => set("city", e.target.value || null)}
          />
        </Field>
      </div>

      <Field label="Status" group>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Chip
              key={s.key}
              active={draft.status === s.key}
              onClick={() => set("status", s.key)}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Whose wish" group>
        <div className="flex flex-wrap gap-2">
          {(["josh", "sam", "both"] as Who[]).map((w) => (
            <Chip
              key={w}
              active={draft.wish_of === w}
              color={w === "both" ? "var(--cat-drinks)" : TRAVELLERS[w].color}
              onClick={() => set("wish_of", w)}
            >
              {w === "both" ? "Both of us" : TRAVELLERS[w].name}
            </Chip>
          ))}
        </div>
      </Field>

      <PriceField
        label="Cost (approx)"
        value={{
          cost_jpy: draft.cost_jpy ?? null,
          cost_aud: draft.cost_aud ?? null,
        }}
        onChange={(p) => setDraft((d) => ({ ...d, ...p }))}
      />

      <Field label="Link">
        <input
          type="url"
          className={inputClass}
          placeholder="https://"
          value={draft.url ?? ""}
          onChange={(e) => set("url", e.target.value || null)}
        />
      </Field>

      <PinField
        lat={draft.lat}
        lng={draft.lng}
        query={
          // A pasted Google Maps link is the most exact thing we can get.
          draft.url && parseCoords(draft.url)
            ? draft.url
            : [draft.title, draft.area, draft.city || cityFor(draft.date)]
                .filter(Boolean)
                .join(", ")
        }
        city={draft.city || cityFor(draft.date)}
        kanji={draft.category ? CATEGORIES[draft.category].kanji : "景"}
        onChange={(lat, lng) => setDraft((d) => ({ ...d, lat, lng }))}
      />

      <Field label="Notes">
        <textarea
          rows={3}
          className={inputClass}
          placeholder="Book ahead? Opening hours? What to order?"
          value={draft.notes ?? ""}
          onChange={(e) => set("notes", e.target.value || null)}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        {draft.category && <Hanko category={draft.category} size={40} />}
        <Button
          variant="ink"
          className="flex-1"
          onClick={save}
          disabled={saving || !draft.title?.trim()}
        >
          {saving ? "Saving…" : isNew ? "Stick it in the plan" : "Save"}
        </Button>
      </div>
      {initial.id && (
        <Button
          variant="ghost"
          className="w-full text-tape-red"
          onClick={async () => {
            if (confirm("Tear up this ticket?")) {
              await deleteItem(initial.id!);
              closeItem();
            }
          }}
        >
          Delete
        </Button>
      )}
    </div>
  );
}
