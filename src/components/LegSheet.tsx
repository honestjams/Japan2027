"use client";

import { useState } from "react";
import { useTrip } from "./TripProvider";
import { Sheet } from "./Sheet";
import { Button, Chip, Field, inputClass } from "./ui";
import {
  MODE,
  MODE_KEYS,
  directionsLink,
  formatKm,
  type Leg,
  type TravelMode,
} from "@/lib/travel";

export function LegSheet() {
  const { editingLeg, closeLeg } = useTrip();
  return (
    <Sheet
      open={!!editingLeg}
      onClose={closeLeg}
      title={editingLeg ? `To ${editingLeg.to.title}` : ""}
    >
      {editingLeg && (
        <LegForm
          key={`${editingLeg.date}-${editingLeg.toKey}`}
          leg={editingLeg}
        />
      )}
    </Sheet>
  );
}

function LegForm({ leg }: { leg: Leg & { date: string } }) {
  const { legs, saveLeg, clearLeg, closeLeg } = useTrip();
  const saved = legs.find((l) => l.date === leg.date && l.to_key === leg.toKey);
  const [mode, setMode] = useState<TravelMode | null>(leg.mode);
  const [minutes, setMinutes] = useState(
    leg.minutes != null ? String(leg.minutes) : "",
  );
  const [note, setNote] = useState(leg.note ?? "");

  async function save() {
    const n = parseInt(minutes.replace(/\D/g, ""), 10);
    const mins = Number.isNaN(n) ? null : n;
    // Untouched estimate values stay as estimates (so they keep following
    // the map pins); only what we actually changed is saved as ours.
    const keepEstimate = !leg.edited;
    await saveLeg({
      date: leg.date,
      to_key: leg.toKey,
      mode: keepEstimate && mode === leg.mode ? null : mode,
      minutes: keepEstimate && mins === leg.minutes ? null : mins,
      note: note.trim() || null,
    });
    closeLeg();
  }

  return (
    <div className="space-y-5">
      <p className="-mt-1 text-sm text-ink-soft">
        From {leg.from.title}
        {leg.km != null && ` · ${formatKm(leg.km)} as the crow flies`}
      </p>

      <Field label="How we're getting there" group>
        <div className="flex flex-wrap gap-2">
          {MODE_KEYS.map((k) => (
            <Chip
              key={k}
              active={mode === k}
              color="var(--cat-drive)"
              onClick={() => setMode(k)}
            >
              <span className="font-display">{MODE[k].kanji}</span>{" "}
              {MODE[k].label.replace("by ", "")}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Minutes">
        <input
          inputMode="numeric"
          className={inputClass}
          placeholder="25"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
      </Field>

      <Field label="Note">
        <input
          className={inputClass}
          placeholder="e.g. Marunouchi line → Ginza, exit B2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>

      <a
        href={directionsLink({ ...leg, mode })}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center text-sm underline"
      >
        Check the route in Google Maps ↗
      </a>

      <Button variant="ink" className="w-full" onClick={save}>
        Save travel
      </Button>
      {saved && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={async () => {
            await clearLeg(leg.date, leg.toKey);
            closeLeg();
          }}
        >
          Back to the estimate
        </Button>
      )}
    </div>
  );
}
