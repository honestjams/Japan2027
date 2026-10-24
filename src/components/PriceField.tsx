"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Field, inputClass, spring } from "./ui";
import {
  aud,
  audAmount,
  currencyOf,
  hasPrice,
  yenAmount,
  type Currency,
  type Priced,
} from "@/lib/money";
import { useAudRate } from "@/lib/useAudRate";

const LAST = "japan27:last-currency";

function lastUsed(): Currency {
  try {
    return localStorage.getItem(LAST) === "AUD" ? "AUD" : "JPY";
  } catch {
    return "JPY";
  }
}

/**
 * A price in ¥ or A$. Whichever currency it's entered in is stored exactly;
 * the other is shown below at today's rate.
 */
export function PriceField({
  label,
  value,
  onChange,
  placeholderJpy = "3000",
}: {
  label: string;
  value: Priced;
  onChange: (next: Priced) => void;
  placeholderJpy?: string;
}) {
  const rate = useAudRate().jpyPerAud;
  // Existing prices keep their currency; new ones start in the last one used.
  const [currency, setCurrency] = useState<Currency>(() =>
    hasPrice(value) ? currencyOf(value) : lastUsed(),
  );
  const amount = currency === "AUD" ? value.cost_aud : value.cost_jpy;
  const [text, setText] = useState(amount != null ? String(amount) : "");

  const emit = (raw: string, cur: Currency) => {
    const n = Number(raw.replace(/[^\d.]/g, ""));
    const ok = raw.trim() !== "" && Number.isFinite(n);
    onChange(
      cur === "AUD"
        ? { cost_aud: ok ? Math.round(n * 100) / 100 : null, cost_jpy: null }
        : { cost_jpy: ok ? Math.round(n) : null, cost_aud: null },
    );
  };

  // Switching currency converts what's typed, so nothing is lost.
  const switchTo = (cur: Currency) => {
    if (cur === currency) return;
    try {
      localStorage.setItem(LAST, cur);
    } catch {}
    let next = text;
    const n = Number(text.replace(/[^\d.]/g, ""));
    if (text.trim() && Number.isFinite(n))
      next =
        cur === "AUD"
          ? String(Math.round((n / rate) * 100) / 100)
          : String(Math.round(n * rate));
    setCurrency(cur);
    setText(next);
    emit(next, cur);
  };

  const n = Number(text.replace(/[^\d.]/g, ""));
  const hint =
    text.trim() && Number.isFinite(n) && n > 0
      ? currency === "AUD"
        ? `≈ ${yenAmount(n * rate)} at today's rate`
        : `≈ ${aud(n, rate)} at today's rate`
      : null;

  return (
    <Field label={label} group>
      <div className="flex gap-2">
        <div className="paper-card flex shrink-0 p-0.5">
          {(["JPY", "AUD"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => switchTo(c)}
              aria-pressed={currency === c}
              aria-label={
                c === "JPY" ? "Price in yen" : "Price in Australian dollars"
              }
              className="relative h-10 w-11 text-base font-bold"
            >
              {currency === c && (
                <motion.span
                  layoutId={`cur-${label}`}
                  transition={spring}
                  className="absolute inset-0 rounded bg-ink"
                />
              )}
              <span
                className={`relative ${currency === c ? "text-washi" : "text-ink-soft"}`}
              >
                {c === "JPY" ? "¥" : "A$"}
              </span>
            </button>
          ))}
        </div>
        <input
          inputMode={currency === "AUD" ? "decimal" : "numeric"}
          aria-label={`${label} in ${currency === "JPY" ? "yen" : "Australian dollars"}`}
          className={inputClass}
          placeholder={
            currency === "AUD"
              ? String(Math.round(Number(placeholderJpy) / rate))
              : placeholderJpy
          }
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            emit(e.target.value, currency);
          }}
        />
      </div>
      <p className="mt-1 min-h-5 text-sm text-ink-soft">
        {hint ??
          (currency === "AUD"
            ? `Enter in A$; ${audAmount(1)} ≈ ${yenAmount(rate)}`
            : "")}
      </p>
    </Field>
  );
}
