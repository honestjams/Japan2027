"use client";

import { useState } from "react";
import { useTrip } from "./TripProvider";
import { PinField } from "./PinField";
import { PriceField } from "./PriceField";
import { Sheet } from "./Sheet";
import { Button, Chip, Field, inputClass } from "./ui";
import type { StayDraft } from "@/lib/types";
import {
  TRIP_DATES,
  TRIP_END,
  addDays,
  dayNumber,
  shortDate,
  weekday,
} from "@/lib/dates";
import { nights } from "@/lib/stays";

export function StaySheet() {
  const { editingStay, closeStay } = useTrip();
  return (
    <Sheet
      open={!!editingStay}
      onClose={closeStay}
      title={editingStay?.id ? "Edit stay" : "Where we're sleeping"}
    >
      {editingStay && (
        <StayForm key={editingStay.id ?? "new"} initial={editingStay} />
      )}
    </Sheet>
  );
}

const dateLabel = (d: string) =>
  `Day ${dayNumber(d)} · ${weekday(d)} ${shortDate(d)}`;

function StayForm({ initial }: { initial: StayDraft }) {
  const { closeStay, saveStay, deleteStay, stays, days } = useTrip();
  const [draft, setDraft] = useState<StayDraft>(() => {
    const check_in = initial.check_in ?? TRIP_DATES[0];
    return {
      status: "idea",
      check_out: addDays(check_in, 1),
      city: days.find((d) => d.date === check_in)?.city ?? null,
      ...initial,
      check_in,
    };
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof StayDraft>(k: K, v: StayDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const checkIn = draft.check_in!;
  const checkOut = draft.check_out!;
  // Any other stay sharing one of these nights.
  const clash = stays.find(
    (s) => s.id !== draft.id && s.check_in < checkOut && checkIn < s.check_out,
  );

  async function save() {
    if (!draft.name?.trim()) return;
    setSaving(true);
    const saved = await saveStay({ ...draft, name: draft.name.trim() });
    setSaving(false);
    if (saved) closeStay();
  }

  return (
    <div className="space-y-5">
      <Field label="Hotel / ryokan">
        <input
          autoFocus={!initial.id}
          className={`${inputClass} font-display text-lg`}
          placeholder="e.g. Hotel Gracery Shinjuku"
          value={draft.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Check in">
          <select
            className={inputClass}
            value={checkIn}
            onChange={(e) => {
              const ci = e.target.value;
              setDraft((d) => ({
                ...d,
                check_in: ci,
                // Keep at least one night.
                check_out:
                  d.check_out && d.check_out > ci
                    ? d.check_out
                    : addDays(ci, 1),
              }));
            }}
          >
            {TRIP_DATES.slice(0, -1).map((d) => (
              <option key={d} value={d}>
                {dateLabel(d)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Check out">
          <select
            className={inputClass}
            value={checkOut}
            onChange={(e) => set("check_out", e.target.value)}
          >
            {TRIP_DATES.filter((d) => d > checkIn && d <= TRIP_END).map((d) => (
              <option key={d} value={d}>
                {dateLabel(d)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="vhs-text -mt-3 text-base uppercase text-ink-soft">
        {nights({ check_in: checkIn, check_out: checkOut })} night
        {nights({ check_in: checkIn, check_out: checkOut }) === 1 ? "" : "s"}
        {clash && (
          <span className="text-tape-red"> · overlaps {clash.name}</span>
        )}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Check-in time">
          <input
            type="time"
            className={inputClass}
            value={draft.check_in_time?.slice(0, 5) ?? ""}
            onChange={(e) => set("check_in_time", e.target.value || null)}
          />
        </Field>
        <Field label="Check-out time">
          <input
            type="time"
            className={inputClass}
            value={draft.check_out_time?.slice(0, 5) ?? ""}
            onChange={(e) => set("check_out_time", e.target.value || null)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Area">
          <input
            className={inputClass}
            placeholder="Shinjuku"
            value={draft.area ?? ""}
            onChange={(e) => set("area", e.target.value || null)}
          />
        </Field>
        <Field label="City">
          <input
            className={inputClass}
            placeholder="Tokyo"
            value={draft.city ?? ""}
            onChange={(e) => set("city", e.target.value || null)}
          />
        </Field>
      </div>

      <Field label="Address">
        <input
          className={inputClass}
          placeholder="Paste the address, or a Google Maps link"
          value={draft.address ?? ""}
          onChange={(e) => set("address", e.target.value || null)}
        />
      </Field>

      <PinField
        lat={draft.lat}
        lng={draft.lng}
        query={
          draft.address?.trim() ||
          [draft.name, draft.area, draft.city].filter(Boolean).join(", ")
        }
        city={draft.city}
        kanji="宿"
        onChange={(lat, lng) => setDraft((d) => ({ ...d, lat, lng }))}
      />

      <Field label="Status" group>
        <div className="flex gap-2">
          <Chip
            active={draft.status === "idea"}
            onClick={() => set("status", "idea")}
          >
            Considering
          </Chip>
          <Chip
            active={draft.status === "booked"}
            color="var(--cat-cars)"
            onClick={() => set("status", "booked")}
          >
            Booked
          </Chip>
        </div>
      </Field>

      <PriceField
        label="Total for the stay"
        placeholderJpy="60000"
        value={{
          cost_jpy: draft.cost_jpy ?? null,
          cost_aud: draft.cost_aud ?? null,
        }}
        onChange={(p) => setDraft((d) => ({ ...d, ...p }))}
      />

      <Field label="Booking ref">
        <input
          className={inputClass}
          value={draft.booking_ref ?? ""}
          onChange={(e) => set("booking_ref", e.target.value || null)}
        />
      </Field>

      <Field label="Link">
        <input
          type="url"
          className={inputClass}
          placeholder="https://"
          value={draft.url ?? ""}
          onChange={(e) => set("url", e.target.value || null)}
        />
      </Field>

      <Field label="Notes">
        <textarea
          rows={3}
          className={inputClass}
          placeholder="Onsen hours, dinner included, luggage forwarding…"
          value={draft.notes ?? ""}
          onChange={(e) => set("notes", e.target.value || null)}
        />
      </Field>

      <Button
        variant="ink"
        className="w-full"
        onClick={save}
        disabled={saving || !draft.name?.trim()}
      >
        {saving ? "Saving…" : initial.id ? "Save stay" : "Add stay"}
      </Button>
      {initial.id && (
        <Button
          variant="ghost"
          className="w-full text-tape-red"
          onClick={async () => {
            if (confirm("Remove this stay?")) {
              await deleteStay(initial.id!);
              closeStay();
            }
          }}
        >
          Delete
        </Button>
      )}
    </div>
  );
}
