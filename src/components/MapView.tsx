"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./TripMap";
import type { PlanItem, Stay, Suggestion } from "@/lib/types";
import { shortDate } from "@/lib/dates";

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

export function stayPoints(stays: Stay[]): MapPoint[] {
  return stays
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => ({
      id: `stay-${s.id}`,
      lat: s.lat!,
      lng: s.lng!,
      title: s.name,
      category: "stay",
      kind: "stay",
      subtitle: `${shortDate(s.check_in)} → ${shortDate(s.check_out)}${s.area ? ` · ${s.area}` : ""}`,
    }));
}
