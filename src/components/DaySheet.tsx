"use client";

import { useState } from "react";
import { useTrip } from "./TripProvider";
import { Sheet } from "./Sheet";
import { Button, Chip, Field, inputClass } from "./ui";
import { CITY_PRESETS, type TripDay } from "@/lib/types";
import { dayNumber, longDate } from "@/lib/dates";

export function DaySheet() {
  const { editingDay, closeDay, days } = useTrip();
  const day = days.find((d) => d.date === editingDay);
  return (
    <Sheet
      open={!!editingDay}
      onClose={closeDay}
      title={
        editingDay
          ? `Day ${dayNumber(editingDay)} · ${longDate(editingDay)}`
          : ""
      }
    >
      {day && <DayForm key={day.date} day={day} />}
    </Sheet>
  );
}

function DayForm({ day }: { day: TripDay }) {
  const { closeDay, updateDay } = useTrip();
  const editingDay = day.date;
  const [draft, setDraft] = useState<Partial<TripDay>>(day);

  const set = <K extends keyof TripDay>(k: K, v: TripDay[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  async function save() {
    const { city, stay, is_drive_day, car, notes } = draft;
    await updateDay(editingDay, {
      city: city?.trim() || "TBC",
      stay: stay || null,
      is_drive_day: !!is_drive_day,
      car: is_drive_day ? car || null : null,
      notes: notes || null,
    });
    closeDay();
  }

  return (
    <div className="space-y-5">
      <Field label="Base city">
        <input
          className={inputClass}
          value={draft.city ?? ""}
          onChange={(e) => set("city", e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {CITY_PRESETS.map((c) => (
            <Chip
              key={c}
              active={draft.city === c}
              onClick={() => set("city", c)}
            >
              {c}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Sleeping at">
        <input
          className={inputClass}
          placeholder="Hotel / ryokan name"
          value={draft.stay ?? ""}
          onChange={(e) => set("stay", e.target.value)}
        />
      </Field>

      <div className="paper-card flex items-center justify-between p-4">
        <div>
          <p className="font-display text-lg font-bold">道 Drive day</p>
          <p className="text-sm text-ink-soft">Rental car for this day</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!!draft.is_drive_day}
          onClick={() => set("is_drive_day", !draft.is_drive_day)}
          className={`relative h-8 w-14 rounded-full transition-colors ${draft.is_drive_day ? "bg-[var(--cat-drive)]" : "bg-paper-edge"}`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-paper shadow transition-all ${draft.is_drive_day ? "left-7" : "left-1"}`}
          />
        </button>
      </div>

      {draft.is_drive_day && (
        <Field label="Car">
          <input
            className={inputClass}
            placeholder="e.g. R34 GT-R from Omoshiro, pick up 9am"
            value={draft.car ?? ""}
            onChange={(e) => set("car", e.target.value)}
          />
        </Field>
      )}

      <Field label="Notes">
        <textarea
          rows={3}
          className={inputClass}
          value={draft.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
        />
      </Field>

      <Button variant="ink" className="w-full" onClick={save}>
        Save day
      </Button>
    </div>
  );
}
