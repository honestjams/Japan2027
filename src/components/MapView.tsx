"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./TripMap";
import type { PlanItem, Suggestion } from "@/lib/types";

// Leaflet touches `window`, so it only ever renders in the browser.
export const MapView = dynamic(() => import("./TripMap"), {
  ssr: false,
  loading: () => (
    <div className="paper-card vhs-text flex h-72 items-center justify-center text-xl text-ink-soft">
      LOADING MAP…
    </div>
  ),
});

export function toPoints(rows: (PlanItem | Suggestion)[]): MapPoint[] {
  return rows
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({
      id: r.id,
      lat: r.lat!,
      lng: r.lng!,
      title: r.title,
      category: r.category,
      subtitle: [r.area, r.city].filter(Boolean).join(" · "),
    }));
}
