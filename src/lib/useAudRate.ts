"use client";

import { useEffect, useState } from "react";
import { FALLBACK_JPY_PER_AUD } from "./money";

const KEY = "japan27:jpy-per-aud";
const MAX_AGE = 12 * 60 * 60 * 1000;

interface Rate {
  jpyPerAud: number;
  /** ECB reference date, e.g. "2026-10-21"; null for the fallback. */
  date: string | null;
  fetchedAt: number;
}

function cached(): Rate | null {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) ?? "null") as Rate | null;
    return r && r.jpyPerAud > 0 ? r : null;
  } catch {
    return null;
  }
}

/**
 * Yen per Australian dollar from the ECB daily reference rate (Frankfurter,
 * free, no key). Cached on the phone so it still works offline in Japan.
 */
export function useAudRate() {
  const [rate, setRate] = useState<Rate>(
    () =>
      (typeof window !== "undefined" && cached()) || {
        jpyPerAud: FALLBACK_JPY_PER_AUD,
        date: null,
        fetchedAt: 0,
      },
  );

  useEffect(() => {
    if (Date.now() - rate.fetchedAt < MAX_AGE) return;
    let cancelled = false;
    fetch("https://api.frankfurter.dev/v1/latest?from=AUD&to=JPY")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { date: string; rates: { JPY: number } } | null) => {
        if (cancelled || !d?.rates?.JPY) return;
        const next = {
          jpyPerAud: d.rates.JPY,
          date: d.date,
          fetchedAt: Date.now(),
        };
        setRate(next);
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {}
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Only on mount: the cache decides whether a refresh is due.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return rate;
}
