"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { CATEGORIES, type Category } from "@/lib/types";

export const spring = { type: "spring", stiffness: 420, damping: 28 } as const;

type ButtonProps = HTMLMotionProps<"button"> & {
  variant?: "ink" | "paper" | "ghost" | "sakura";
};

const variants = {
  ink: "bg-ink text-washi",
  paper: "paper-card text-ink",
  ghost: "text-ink-soft hover:text-ink",
  sakura: "bg-sakura text-[#2a2522]",
};

/** Every button dips like pressing a sticker. */
export function Button({
  variant = "paper",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95, y: 1 }}
      transition={spring}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-[15px] font-medium disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  color?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      transition={spring}
      onClick={onClick}
      className={`relative shrink-0 rounded-full border px-3.5 py-2 text-sm transition-colors ${
        active
          ? "border-transparent text-[#2a2522]"
          : "border-paper-edge text-ink-soft"
      }`}
      style={active ? { background: color ?? "var(--sakura)" } : undefined}
    >
      {children}
    </motion.button>
  );
}

export function Hanko({
  category,
  size = 30,
}: {
  category: Category;
  size?: number;
}) {
  const c = CATEGORIES[category];
  return (
    <span
      aria-label={c.label}
      title={c.label}
      className="hanko inline-flex shrink-0 items-center justify-center"
      style={{
        color: c.color,
        width: size,
        height: size,
        fontSize: size * 0.58,
        transform: "rotate(-4deg)",
      }}
    >
      {c.kanji}
    </span>
  );
}

export function Tape({
  color,
  className = "",
  width = 64,
}: {
  color: string;
  className?: string;
  width?: number;
}) {
  return (
    <span
      aria-hidden
      className={`tape ${className}`}
      style={{ background: color, width }}
    />
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="vhs-text mb-3 mt-8 text-lg uppercase text-ink-soft">
      {children}
    </h2>
  );
}

/** Labels a single input; with `group`, labels a set of chips instead
 * (a <label> around several buttons would make taps hit the first one). */
export function Field({
  label,
  group = false,
  children,
}: {
  label: string;
  group?: boolean;
  children: ReactNode;
}) {
  const caption = (
    <span className="vhs-text mb-1.5 block text-base uppercase text-ink-soft">
      {label}
    </span>
  );
  return group ? (
    <div role="group" aria-label={label}>
      {caption}
      {children}
    </div>
  ) : (
    <label className="block">
      {caption}
      {children}
    </label>
  );
}

// 16px+ so iOS doesn't zoom on focus.
export const inputClass =
  "w-full rounded-md border border-paper-edge bg-washi px-3 py-2.5 text-base text-ink placeholder:text-ink-soft/60 focus:border-sakura-deep focus:outline-none";
