"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

const pinIcon = (kanji: string) =>
  L.divIcon({
    className: "map-pin",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<span style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;background:var(--ink);color:var(--washi);border:2px solid var(--sakura);font-family:var(--font-shippori),serif;font-weight:700;font-size:19px;box-shadow:0 4px 10px rgb(0 0 0 / .35)">${kanji}</span>`,
  });

/** Keep the view on the pin when a lookup moves it somewhere new. */
function Follow({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map.getBounds().pad(-0.2).contains([lat, lng]))
      map.setView([lat, lng], Math.max(map.getZoom(), 15));
  }, [lat, lng, map]);
  return null;
}

function TapToMove({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onMove(e.latlng.lat, e.latlng.lng) });
  return null;
}

/** Small map for fine-tuning a pin: drag it, or tap where it should go. */
export default function PinPicker({
  lat,
  lng,
  kanji = "宿",
  onMove,
}: {
  lat: number;
  lng: number;
  kanji?: string;
  onMove: (lat: number, lng: number) => void;
}) {
  const icon = useMemo(() => pinIcon(kanji), [kanji]);
  return (
    <div className="paper-card relative isolate z-0 mt-2 h-56 overflow-hidden p-1">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom={false}
        className="h-full w-full rounded"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Follow lat={lat} lng={lng} />
        <TapToMove onMove={onMove} />
        <Marker
          position={[lat, lng]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng();
              onMove(p.lat, p.lng);
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
