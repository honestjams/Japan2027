"use client";

import { motion } from "framer-motion";
import { useTrip } from "./TripProvider";
import { Hanko, Tape, spring } from "./ui";
import {
  CATEGORIES,
  SLOTS,
  STATUSES,
  TRAVELLERS,
  type PlanItem,
} from "@/lib/types";
import { formatTime } from "@/lib/dates";
import { tilt } from "@/lib/places";
import { hasPrice, priceLabel } from "@/lib/money";
import { useAudRate } from "@/lib/useAudRate";

const NEXT_STATUS = {
  idea: "planned",
  planned: "booked",
  booked: "done",
  done: "idea",
} as const;

/** A plan item as a paper ticket stub, taped down by category colour. */
export function TicketCard({
  item,
  compact = false,
}: {
  item: PlanItem;
  compact?: boolean;
}) {
  const { openItem, updateItem } = useTrip();
  const rate = useAudRate().jpyPerAud;
  const cat = CATEGORIES[item.category];
  const slot = SLOTS.find((s) => s.key === item.slot);
  const time = formatTime(item.start_time) ?? slot?.vhs ?? "ANY";
  const done = item.status === "done";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: tilt(item.id) }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -3, rotate: 0 }}
      whileTap={{ scale: 0.97, y: 1 }}
      transition={spring}
      className="paper-shadow relative"
    >
      <Tape
        color={cat.color}
        width={compact ? 40 : 58}
        className="-top-1.5 left-6 z-10 -rotate-3"
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => openItem(item)}
        onKeyDown={(e) => e.key === "Enter" && openItem(item)}
        className={`ticket flex w-full cursor-pointer text-left ${done ? "opacity-60" : ""}`}
      >
        <div
          className={`flex shrink-0 flex-col items-center justify-center gap-1 ${compact ? "w-12 py-2.5" : "w-16 py-4"} pl-2`}
        >
          <span
            className={`vhs-text leading-none ${compact ? "text-base" : "text-xl"}`}
          >
            {time}
          </span>
          {!compact && <Hanko category={item.category} size={26} />}
        </div>
        <div className="perforation w-[2px] shrink-0" />
        <div
          className={`min-w-0 flex-1 ${compact ? "py-2.5 pl-3 pr-4" : "py-3.5 pl-4 pr-5"}`}
        >
          <p
            className={`font-display font-bold leading-snug ${compact ? "text-[15px]" : "text-lg"} ${done ? "line-through decoration-tape-red decoration-2" : ""}`}
          >
            {item.title}
          </p>
          {!compact && (
            <p className="mt-0.5 truncate text-sm text-ink-soft">
              {[item.area, item.city].filter(Boolean).join(" · ") || cat.label}
              {hasPrice(item) && ` · ${priceLabel(item, rate)}`}
            </p>
          )}
          {!compact && (
            <div className="mt-2 flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  e.stopPropagation();
                  updateItem(item.id, { status: NEXT_STATUS[item.status] });
                }}
                className="vhs-text rounded-sm border border-paper-edge px-1.5 text-base uppercase leading-tight"
                title="Tap to change status"
              >
                {STATUSES.find((s) => s.key === item.status)?.label}
              </motion.button>
              <WishStamp wish={item.wish_of} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function WishStamp({ wish }: { wish: PlanItem["wish_of"] }) {
  if (wish === "both") return null;
  return (
    <span
      className="rounded-full px-2 text-xs font-bold leading-5 text-[#2a2522]"
      style={{ background: TRAVELLERS[wish].color }}
    >
      {TRAVELLERS[wish].name}&apos;s wish
    </span>
  );
}
