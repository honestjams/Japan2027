/**
 * Turning what people paste (hotel names, Airbnb addresses, Google Maps
 * links) into a map pin. OpenStreetMap barely knows Japanese block numbers
 * ("3-chōme-3-18"), so Japanese addresses go through the government's GSI
 * address search instead, which is accurate to the block.
 */

export type Precision = "exact" | "block" | "area";

export interface GeoHit {
  lat: number;
  lng: number;
  label: string;
  precision: Precision;
}

const CJK = /[぀-ヿ㐀-鿿]/;

/** "35.64, 139.72", or a Google Maps link containing coordinates. */
export function parseCoords(text: string): { lat: number; lng: number } | null {
  const patterns = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // place pages
    /@(-?\d+\.\d+),\s*(-?\d+\.\d+)/, // map view
    /[?&](?:q|query|ll|destination)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i,
    /^\s*\(?\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{2,3}\.\d+)\s*\)?\s*$/, // bare pair
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  return null;
}

/** "108-0072" or "〒1080072" → "1080072". */
export function parsePostcode(text: string) {
  const m = text.match(/(?:〒\s*)?\b(\d{3})-?(\d{4})\b/);
  return m ? m[1] + m[2] : null;
}

/**
 * The chōme-ban-gō numbers from a romanised address:
 * "3-chōme-3-18", "3 Chome-3-18", "3-3-18" → "3-3-18". Postcodes are ignored.
 */
export function parseBlock(text: string) {
  const plain = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // ō → o
    .replace(/(?:〒\s*)?\b\d{3}-\d{4}\b/g, " ");
  const chome = plain.match(
    /\b(\d+)\s*-?\s*cho(?:u|o)?me\b\s*-?\s*(\d+)(?:\s*-\s*(\d+))?/i,
  );
  if (chome) return [chome[1], chome[2], chome[3]].filter(Boolean).join("-");
  const dashed = plain.match(/\b(\d+)-(\d+)(?:-(\d+))?\b/);
  return dashed ? dashed[0] : null;
}

/** Comma parts without numbers: "Shirokane, Minato City, Tokyo". */
export function areaOnly(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(",")
    .map((p) =>
      p
        .replace(/\b\d{3}-\d{4}\b/g, "")
        // Drop block numbers but keep the neighbourhood in the same part.
        .replace(/\b\d+\s*-?\s*cho(?:u|o)?me\b(?:\s*-?\s*\d+)*(?:-\d+)*/gi, "")
        .replace(/\b\d+(?:-\d+)+\b/g, "")
        .replace(/\b(Prefecture|Japan)\b/gi, "")
        .trim(),
    )
    .filter((p) => p && !/\d/.test(p))
    .join(", ");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function gsi(query: string): Promise<GeoHit | null> {
  const res = await fetch(
    `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) return null;
  const [hit] = (await res.json()) as {
    geometry: { coordinates: [number, number] };
    properties: { title: string };
  }[];
  if (!hit) return null;
  const [lng, lat] = hit.geometry.coordinates;
  // GSI resolves to the block (番) when it can; otherwise it's the area.
  const precision: Precision = /[0-9０-９]+番/.test(hit.properties.title)
    ? "block"
    : "area";
  return { lat, lng, label: hit.properties.title, precision };
}

/** Postcode → Japanese place name, e.g. 1080072 → 東京都港区白金. */
async function postcodeToJapanese(code: string) {
  const res = await fetch(
    `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${code}`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    results: { address1: string; address2: string; address3: string }[] | null;
  };
  const r = data.results?.[0];
  return r ? `${r.address1}${r.address2}${r.address3}` : null;
}

let lastNominatim = 0;

async function nominatim(query: string): Promise<GeoHit | null> {
  // OpenStreetMap asks for at most one request per second.
  const wait = lastNominatim + 1100 - Date.now();
  if (wait > 0) await sleep(wait);
  lastNominatim = Date.now();
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp&q=${encodeURIComponent(query)}`,
    { headers: { "Accept-Language": "en" } },
  );
  if (!res.ok) return null;
  const [hit] = (await res.json()) as {
    lat: string;
    lon: string;
    display_name: string;
    addresstype?: string;
  }[];
  if (!hit) return null;
  const broad = ["quarter", "suburb", "neighbourhood", "city", "postcode"];
  return {
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    label: hit.display_name,
    precision: broad.includes(hit.addresstype ?? "") ? "area" : "exact",
  };
}

/**
 * Best-effort pin for anything pasted: coordinates and map links first,
 * then Japanese addresses via GSI, then names via OpenStreetMap, and
 * finally the neighbourhood or postcode as an approximate fallback.
 */
export async function geocode(query: string): Promise<GeoHit | null> {
  const text = query.trim();
  if (!text) return null;

  const coords = parseCoords(text);
  if (coords) return { ...coords, label: "Coordinates", precision: "exact" };

  if (CJK.test(text)) {
    const hit = await gsi(text);
    if (hit) return hit;
  }

  const postcode = parsePostcode(text);
  const block = parseBlock(text);
  let japaneseArea: string | null = null;
  if (postcode) {
    japaneseArea = await postcodeToJapanese(postcode).catch(() => null);
    if (japaneseArea && block) {
      const hit = await gsi(japaneseArea + block);
      if (hit?.precision === "block") return hit;
    }
  }

  const named = await nominatim(text);
  if (named) return named;

  const area = areaOnly(text);
  if (area && area !== text) {
    const hit = await nominatim(area);
    if (hit) return { ...hit, precision: "area" };
  }
  if (japaneseArea) {
    const hit = await gsi(japaneseArea);
    if (hit) return { ...hit, precision: "area" };
  }
  return null;
}
