"use client";

import { useSyncExternalStore } from "react";
import { FALLBACK_JPY_PER_AUD } from "./money";

const KEY = "japan27:jpy-per-aud";
const MAX_AGE = 12 * 60 * 60 * 1000;

export interface Rate {
  jpyPerAud: number;
  /** ECB reference date, e.g. "2026-10-21"; null for the fallback. */
  date: string | null;
  fetchedAt: number;
}

const FALLBACK: Rate = {
  jpyPerAud: FALLBACK_JPY_PER_AUD,
  date: null,
  fetchedAt: 0,
};

// One shared rate for the whole app, so dozens of price labels on screen
// don't each fetch it.
let current: Rate | null = null;
let inflight = false;
const listeners = new Set<() => void>();

function read(): Rate {
  if (current) return current;
  try {
    const r = JSON.parse(localStorage.getItem(KEY) ?? "null") as Rate | null;
    current = r && r.jpyPerAud > 0 ? r : FALLBACK;
  } catch {
    current = FALLBACK;
  }
  return current;
}

function refresh() {
  if (inflight || Date.now() - read().fetchedAt < MAX_AGE) return;
  inflight = true;
  fetch("https://api.frankfurter.dev/v1/latest?from=AUD&to=JPY")
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { date: string; rates: { JPY: number } } | null) => {
      if (!d?.rates?.JPY) return;
      current = { jpyPerAud: d.rates.JPY, date: d.date, fetchedAt: Date.now() };
      try {
        localStorage.setItem(KEY, JSON.stringify(current));
      } catch {}
      listeners.forEach((l) => l());
    })
    .catch(() => {})
    .finally(() => {
      inflight = false;
    });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  refresh();
  return () => {
    listeners.delete(cb);
  };
}

/**
 * Yen per Australian dollar from the ECB daily reference rate (Frankfurter,
 * free, no key). Cached on the phone so it still works offline in Japan.
 */
export function useAudRate(): Rate {
  return useSyncExternalStore(subscribe, read, () => FALLBACK);
}
