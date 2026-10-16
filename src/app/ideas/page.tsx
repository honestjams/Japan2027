"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTrip } from "@/components/TripProvider";
import { Loading } from "@/components/Loading";
import { MapView, toPoints } from "@/components/MapView";
import { TicketCard } from "@/components/TicketCard";
import { Button, Chip, Hanko, Tape, spring } from "@/components/ui";
import { CATEGORIES, type Category, type Suggestion } from "@/lib/types";
import { dayNumber } from "@/lib/dates";
import { mapsLink, tilt } from "@/lib/places";

type Tab = "suggested" | "ours";

export default function IdeasPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Ideas />
    </Suspense>
  );
}

function Ideas() {
  const params = useSearchParams();
  const router = useRouter();
  const tab: Tab = params.get("tab") === "ours" ? "ours" : "suggested";
  const { suggestions, items, loading, openItem, me } = useTrip();
  const [cat, setCat] = useState<Category | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  if (loading) return <Loading />;

  const ours = items.filter((i) => !i.date);
  const cities = [...new Set(suggestions.map((s) => s.city))];
  const cats = [...new Set(suggestions.map((s) => s.category))];
  const shown = suggestions.filter(
    (s) => (!cat || s.category === cat) && (!city || s.city === city),
  );

  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-extrabold">Ideas</h1>
        <Button
          variant="ink"
          onClick={() => openItem({ wish_of: me ?? "both", status: "idea" })}
        >
          + Our own
        </Button>
      </div>

      <div className="paper-card mt-5 grid grid-cols-2 p-1">
        {(
          [
            ["suggested", `Suggested · ${suggestions.length}`],
            ["ours", `Our wishlist · ${ours.length}`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() =>
              router.replace(key === "ours" ? "/ideas?tab=ours" : "/ideas")
            }
            className="relative h-11 text-sm font-medium"
          >
            {tab === key && (
              <motion.span
                layoutId="ideas-tab"
                transition={spring}
                className="absolute inset-0 rounded bg-ink"
              />
            )}
            <span
              className={`relative ${tab === key ? "text-washi" : "text-ink-soft"}`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {tab === "ours" ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {ours.map((i) => (
              <TicketCard key={i.id} item={i} />
            ))}
          </AnimatePresence>
          {ours.length === 0 && (
            <p className="py-10 text-center text-ink-soft md:col-span-2">
              No loose ideas. Add your own, or stick a suggestion in.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4">
            <Chip active={!cat} onClick={() => setCat(null)}>
              All
            </Chip>
            {cats.map((c) => (
              <Chip
                key={c}
                active={cat === c}
                color={CATEGORIES[c].color}
                onClick={() => setCat(cat === c ? null : c)}
              >
                <span className="font-display">{CATEGORIES[c].kanji}</span>{" "}
                {CATEGORIES[c].label}
              </Chip>
            ))}
          </div>
          <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
            <Chip active={!city} onClick={() => setCity(null)}>
              Everywhere
            </Chip>
            {cities.map((c) => (
              <Chip
                key={c}
                active={city === c}
                onClick={() => setCity(city === c ? null : c)}
              >
                {c}
              </Chip>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-ink-soft">
              Hand-picked starting points. Check opening hours before going.
            </p>
            <Button variant="ghost" onClick={() => setShowMap((v) => !v)}>
              {showMap ? "Hide map" : "Map"}
            </Button>
          </div>
          {showMap && (
            <div className="mt-2">
              <MapView points={toPoints(shown)} className="h-96" />
            </div>
          )}

          <motion.div
            layout
            className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            <AnimatePresence initial={false}>
              {shown.map((s) => (
                <SuggestionCard key={s.id} s={s} />
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </>
  );
}

function SuggestionCard({ s }: { s: Suggestion }) {
  const { items, openItem, me } = useTrip();
  const inPlan = items.find((i) => i.suggestion_id === s.id);
  const cat = CATEGORIES[s.category];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, rotate: tilt(s.id, 0.6) }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, rotate: 0 }}
      transition={spring}
      className="paper-card relative flex flex-col p-5"
    >
      <Tape color={cat.color} className="-top-2 right-6 rotate-3" />
      <div className="flex items-start gap-3">
        <Hanko category={s.category} size={34} />
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold leading-snug">
            {s.title}
          </h3>
          <p className="vhs-text text-base uppercase text-ink-soft">
            {[s.area, s.city].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed">{s.description}</p>
      {s.cost_hint && (
        <p className="mt-2 text-sm text-ink-soft">💴 {s.cost_hint}</p>
      )}
      <div className="mt-auto flex items-center gap-2 pt-4">
        {inPlan ? (
          <Button
            variant="sakura"
            className="flex-1"
            onClick={() => openItem(inPlan)}
          >
            ✓ {inPlan.date ? `Day ${dayNumber(inPlan.date)}` : "On wishlist"}
          </Button>
        ) : (
          <Button
            variant="ink"
            className="flex-1"
            onClick={() =>
              openItem({
                title: s.title,
                category: s.category,
                city: s.city,
                area: s.area,
                lat: s.lat,
                lng: s.lng,
                url: s.url,
                notes: s.description,
                suggestion_id: s.id,
                wish_of: me ?? "both",
                status: "idea",
              })
            }
          >
            + Add to plan
          </Button>
        )}
        <a
          href={mapsLink(s)}
          target="_blank"
          rel="noreferrer"
          className="paper-card flex h-11 items-center px-3 text-sm"
        >
          Maps ↗
        </a>
      </div>
    </motion.article>
  );
}
