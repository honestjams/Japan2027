"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { CATEGORIES, type Category } from "@/lib/types";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  category: Category;
  subtitle?: string;
}

const JAPAN: [number, number] = [35.4, 137.5];

function pin(category: Category) {
  const c = CATEGORIES[category];
  return L.divIcon({
    className: "map-pin",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:6px;transform:rotate(-6deg);background:var(--paper);border:2px solid ${c.color};color:${c.color};font-family:var(--font-shippori),serif;font-weight:700;font-size:16px;box-shadow:0 3px 6px rgb(0 0 0 / .25)">${c.kanji}</span>`,
  });
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const key = points.map((p) => p.id).join();
  useEffect(() => {
    if (points.length === 0) map.setView(JAPAN, 6);
    else if (points.length === 1)
      map.setView([points[0].lat, points[0].lng], 14);
    else
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), {
        padding: [36, 36],
        maxZoom: 15,
      });
    // Re-fit only when the set of points changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

export default function TripMap({
  points,
  className = "h-72",
}: {
  points: MapPoint[];
  className?: string;
}) {
  const icons = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(CATEGORIES) as Category[]).map((c) => [c, pin(c)]),
      ) as Record<Category, L.DivIcon>,
    [],
  );

  return (
    <div
      className={`paper-card relative isolate z-0 overflow-hidden p-1.5 ${className}`}
    >
      <MapContainer
        center={JAPAN}
        zoom={6}
        scrollWheelZoom={false}
        className="h-full w-full rounded"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={icons[p.category]}>
            <Popup>
              <strong>{p.title}</strong>
              {p.subtitle && <br />}
              {p.subtitle}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
