"use client";

import { Field } from "./ui";
import {
  aud,
  hasPrice,
  payersOf,
  sharesOf,
  yenAmount,
  type Priced,
  type Split,
} from "@/lib/money";
import { TRAVELLERS, type Traveller } from "@/lib/types";
import { useAudRate } from "@/lib/useAudRate";

/**
 * Per person (tickets) or one shared cost (stays, car hire), and who's in on
 * it. Someone always has to be ticked.
 */
export function SplitField({
  value,
  price,
  onChange,
}: {
  value: Split;
  price: Priced;
  onChange: (next: Split) => void;
}) {
  const rate = useAudRate().jpyPerAud;
  const payers = payersOf(value);
  const shares = sharesOf({ ...price, ...value }, rate);
  const total = shares.josh + shares.sam;

  const toggle = (t: Traveller) => {
    const key = t === "josh" ? "pays_josh" : "pays_sam";
    // Keep at least one person paying.
    if (value[key] && payers.length === 1) return;
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <Field label="How it's paid" group>
      <div className="paper-card grid grid-cols-2 p-0.5">
        {(
          [
            ["each", "Per person"],
            ["shared", "One shared cost"],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            aria-pressed={value.cost_mode === mode}
            onClick={() => onChange({ ...value, cost_mode: mode })}
            className={`h-10 rounded text-sm font-bold transition-colors ${value.cost_mode === mode ? "bg-ink text-washi" : "text-ink-soft"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        {(Object.keys(TRAVELLERS) as Traveller[]).map((t) => {
          const on = t === "josh" ? value.pays_josh : value.pays_sam;
          return (
            <button
              key={t}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(t)}
              className="paper-card flex min-h-11 flex-1 items-center gap-2 px-3"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded border-2 text-sm font-bold ${on ? "border-transparent text-[#2a2522]" : "border-paper-edge text-transparent"}`}
                style={on ? { background: TRAVELLERS[t].color } : undefined}
              >
                ✓
              </span>
              <span className="text-sm font-medium">
                {TRAVELLERS[t].name} pays
              </span>
            </button>
          );
        })}
      </div>

      {hasPrice(price) && (
        <p className="mt-1.5 text-sm text-ink-soft">
          {value.cost_mode === "each"
            ? payers.length === 2
              ? `${yenAmount(shares.josh)} each × 2 = ${yenAmount(total)} (≈${aud(total, rate)})`
              : `One ticket: ${yenAmount(total)} for ${TRAVELLERS[payers[0]].name}`
            : payers.length === 2
              ? `Split: ${yenAmount(shares.josh)} each (≈${aud(shares.josh, rate)})`
              : `${TRAVELLERS[payers[0]].name} covers all ${yenAmount(total)}`}
        </p>
      )}
    </Field>
  );
}
