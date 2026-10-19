# 旅 Japan '27

Josh & Sam's planner for Japan, **29 Mar – 11 Apr 2027** (into Tokyo, out of Osaka).
Sakura on VHS: washi paper, film grain, ticket stubs.

## What it does

- **Today**: countdown before the trip, then that day's plan and map once you're there.
- **Trip**: the whole 14 days at a glance: route ribbon, every day, everything on one map.
- **Days**: 3, 5 or 7 days side by side; ◀◀ ▶▶ to move through the trip.
- **Ideas**: a curated starter list (cars, drives, retro games, kissaten, craft beer, sakura spots) plus your own wishlist. Tap **+ Add to plan** to drop one into a day.
- **Prep**: the pre-trip checklist (bookings with their on-sale dates, papers, money, phones, packing). Tick things off and both phones see it; anything with a deadline shows how long is left.
- Tap a ticket to edit it; tap its status stamp to cycle Idea → Planned → Booked → Done.
- Tap **Edit** on a day to set the city, hotel and whether it's a 道 drive day.
- Changes sync live between both phones.

There's no login, just "who's watching?" (Josh/Sam), remembered per device.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Framer Motion · Supabase (Postgres + Realtime) · Leaflet/OpenStreetMap · Vercel.

## Run locally

```bash
cp .env.example .env.local   # values are the public Supabase URL + publishable key
npm install
npm run dev
```

## Deploy (Vercel)

1. vercel.com → **Add New → Project** → import `japan-2027`.
2. Add the two env vars from `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) for all environments.
3. Deploy. Every push to `main` goes to production; other branches get preview URLs.

## Database

Supabase project `japan-2027` (Tokyo region). Schema is in `supabase/migrations/`, the suggestion seed data in `supabase/seed/suggestions.json`.

Tables: `trip_days` (one row per date), `plan_items` (the tickets), `suggestions` (curated catalogue), `checklist_items` (the Prep list), `travellers`.

> **Privacy note:** with no passwords, anyone who has the site URL can view and edit the plan. The site is marked `noindex`, so keep the link between the two of you.
