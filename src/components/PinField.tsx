"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button, Field } from "./ui";
import { geocode, type GeoHit } from "@/lib/geocode";

// Leaflet touches `window`, so the picker only renders in the browser.
const PinPicker = dynamic(() => import("./PinPicker"), {
  ssr: false,
  loading: () => (
    <div className="paper-card vhs-text mt-2 flex h-56 items-center justify-center text-lg text-ink-soft">
      LOADING MAP…
    </div>
  ),
});

// Where "place it myself" drops the pin to start with.
const CITY_CENTRES: Record<string, [number, number]> = {
  tokyo: [35.6812, 139.7671],
  yokohama: [35.4437, 139.638],
  hakone: [35.2324, 139.1069],
  fuji: [35.4983, 138.7656],
  nagoya: [35.1709, 136.8815],
  suzuka: [34.8431, 136.541],
  kyoto: [35.0116, 135.7681],
  nara: [34.6851, 135.8048],
  osaka: [34.6937, 135.5023],
  kobe: [34.6901, 135.1955],
};

const centreFor = (city?: string | null): [number, number] => {
  const c = (city ?? "").toLowerCase();
  const key = Object.keys(CITY_CENTRES).find((k) => c.includes(k));
  return CITY_CENTRES[key ?? "tokyo"];
};

const describe = (hit: GeoHit) =>
  hit.precision === "area"
    ? `Only found the neighbourhood (${hit.label.split(",")[0]}). Drag the pin to the exact spot.`
    : hit.precision === "block"
      ? `Found the block: ${hit.label}. Drag to fine-tune if needed.`
      : `${hit.label.slice(0, 80)}. Drag to fine-tune if needed.`;

/**
 * "Find on map" plus a draggable mini map. Looks up `query` (address, name,
 * coordinates or a Google Maps link) and lets you correct the result by hand.
 */
export function PinField({
  lat,
  lng,
  query,
  city,
  kanji,
  onChange,
}: {
  lat: number | null | undefined;
  lng: number | null | undefined;
  query: string;
  city?: string | null;
  kanji?: string;
  onChange: (lat: number | null, lng: number | null) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hasPin = lat != null && lng != null;

  async function locate() {
    if (!query.trim()) {
      setMessage("Add an address or a name first.");
      return;
    }
    setBusy(true);
    setMessage("Searching…");
    const hit = await geocode(query).catch(() => null);
    setBusy(false);
    if (hit) {
      onChange(hit.lat, hit.lng);
      setMessage(describe(hit));
    } else
      setMessage(
        "Couldn't find that. Paste a Google Maps link or coordinates, or place the pin yourself.",
      );
  }

  return (
    <Field label="Map pin" group>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={locate} disabled={busy}>
          📍 Find on map
        </Button>
        {hasPin ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onChange(null, null);
              setMessage(null);
            }}
          >
            Clear
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              const [la, ln] = centreFor(city);
              onChange(la, ln);
              setMessage("Drag the pin, or tap the map where it should go.");
            }}
          >
            Place it myself
          </Button>
        )}
      </div>
      {message && (
        <p className="mt-1.5 line-clamp-3 text-sm text-ink-soft">{message}</p>
      )}
      {hasPin && (
        <PinPicker
          lat={lat}
          lng={lng}
          kanji={kanji}
          onMove={(la, ln) => onChange(la, ln)}
        />
      )}
    </Field>
  );
}
