"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, type ReactNode } from "react";
import { TripProvider, useTrip } from "./TripProvider";
import { ItemSheet } from "./ItemSheet";
import { DaySheet } from "./DaySheet";
import { Loading } from "./Loading";
import { spring } from "./ui";
import { TRAVELLERS, type Traveller } from "@/lib/types";

const TABS = [
  { href: "/today", match: "/today", label: "Today", kanji: "今" },
  { href: "/trip", match: "/trip", label: "Trip", kanji: "旅" },
  { href: "/view/3", match: "/view", label: "Days", kanji: "日" },
  { href: "/ideas", match: "/ideas", label: "Ideas", kanji: "案" },
];

export function Shell({ children }: { children: ReactNode }) {
  return (
    <TripProvider>
      <div className="grain" aria-hidden />
      <div className="vignette" aria-hidden />
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-4">
        {/* Pages read URL params, so they stream in after the static shell. */}
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </main>
      <Suspense fallback={<BottomNav path="" />}>
        <CurrentNav />
      </Suspense>
      <ItemSheet />
      <DaySheet />
      <WhoGate />
      <ErrorToast />
    </TripProvider>
  );
}

function Header() {
  const { me, setMe } = useTrip();
  return (
    <header className="scanlines sticky top-0 z-30 border-b border-paper-edge bg-washi/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/today" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-extrabold">旅</span>
          <span className="font-display text-lg font-bold tracking-tight">
            Japan &apos;27
          </span>
        </Link>
        {me && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setMe(me === "josh" ? "sam" : "josh")}
            className="vhs-text flex min-h-11 items-center gap-1.5 text-lg uppercase"
            title="Switch who's using the app"
          >
            <span className="animate-pulse text-tape-red">●</span>
            REC · {TRAVELLERS[me].name}
          </motion.button>
        )}
      </div>
    </header>
  );
}

function CurrentNav() {
  return <BottomNav path={usePathname()} />;
}

function BottomNav({ path }: { path: string }) {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-paper-edge bg-paper/95 backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map((t) => {
          const active = path.startsWith(t.match);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className="relative flex h-16 flex-col items-center justify-center gap-0.5"
              >
                {active && (
                  <motion.span
                    layoutId="tab-tape"
                    transition={spring}
                    className="tape top-1.5"
                    style={{ background: "var(--sakura)", width: 46 }}
                  />
                )}
                <motion.span
                  whileTap={{ scale: 0.85 }}
                  className={`relative font-display text-xl ${active ? "text-ink" : "text-ink-soft"}`}
                >
                  {t.kanji}
                </motion.span>
                <span
                  className={`text-[11px] tracking-wide ${active ? "text-ink" : "text-ink-soft"}`}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** No passwords — just pick who you are, remembered on this device. */
function WhoGate() {
  const { me, meReady, setMe } = useTrip();
  const open = meReady && !me;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="scanlines fixed inset-0 z-50 flex flex-col items-center justify-center bg-washi px-6"
        >
          <p className="vhs-text text-xl text-tape-red">▶ PLAY</p>
          <h1 className="mt-2 text-center font-display text-4xl font-extrabold">
            Who&apos;s watching?
          </h1>
          <p className="mt-2 text-center text-ink-soft">
            So we know whose ideas are whose.
          </p>
          <div className="mt-10 grid w-full max-w-sm grid-cols-2 gap-5">
            {(Object.keys(TRAVELLERS) as Traveller[]).map((who, i) => (
              <motion.button
                key={who}
                initial={{ y: 20, opacity: 0, rotate: i ? 2 : -2 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...spring, delay: 0.1 + i * 0.08 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setMe(who)}
                className="paper-card relative flex aspect-[3/4] flex-col items-center justify-center gap-3"
              >
                <span
                  className="tape -top-2 left-1/2 -translate-x-1/2"
                  style={{ background: TRAVELLERS[who].color, width: 70 }}
                />
                <span className="font-display text-5xl font-extrabold">
                  {TRAVELLERS[who].name[0]}
                </span>
                <span className="vhs-text text-2xl uppercase">
                  {TRAVELLERS[who].name}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ErrorToast() {
  const { error } = useTrip();
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
          exit={{ y: 40, opacity: 0 }}
          className="vhs-text fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md rounded-md bg-ink px-4 py-3 text-lg text-washi"
        >
          ⚠ TRACKING ERROR — {error}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
