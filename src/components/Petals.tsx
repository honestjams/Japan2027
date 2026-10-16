"use client";

import { useState } from "react";

/** A few cherry blossom petals drifting down. Quiet, not a snowstorm. */
export function Petals({ count = 9 }: { count?: number }) {
  // Only rendered after data loads (client-side), so randomness can't cause
  // a hydration mismatch.
  const [petals] = useState(() =>
    Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 14,
      dur: 11 + Math.random() * 9,
      drift: (Math.random() - 0.3) * 160,
      size: 8 + Math.random() * 7,
    })),
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
    >
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal absolute -top-6"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.8,
              background: "var(--sakura)",
              borderRadius: "80% 0 80% 0",
              opacity: 0,
              animation: `petal-fall ${p.dur}s linear ${p.delay}s infinite`,
              "--drift": `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
