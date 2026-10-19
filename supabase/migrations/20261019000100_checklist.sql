-- Pre-trip checklist: shared to-dos with optional deadlines, ticked off live
-- on both phones like the plan.

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  section text not null default 'book' check (section in ('book','papers','money','tech','health','home','pack','final')),
  notes text,
  due_by date,
  owner text not null default 'both' check (owner in ('josh','sam','both')),
  done boolean not null default false,
  done_by text references public.travellers(id),
  done_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index checklist_items_done_by_idx on public.checklist_items(done_by);

create trigger checklist_items_touch before update on public.checklist_items
  for each row execute function public.touch_updated_at();

alter table public.checklist_items enable row level security;

create policy "anyone can read checklist" on public.checklist_items for select to anon using (true);
create policy "anyone can add checklist" on public.checklist_items for insert to anon with check (true);
create policy "anyone can edit checklist" on public.checklist_items for update to anon using (true) with check (true);
create policy "anyone can remove checklist" on public.checklist_items for delete to anon using (true);

alter publication supabase_realtime add table public.checklist_items;

-- Starter list. Deadlines match the booking notes in the Ideas catalogue.
insert into public.checklist_items (section, title, due_by, notes, sort_order) values
('book', 'Flights: into Tokyo 29 Mar, home from Osaka 11 Apr', '2026-11-30', 'Open-jaw saves backtracking to Tokyo.', 10),
('book', 'Travel insurance', '2026-11-30', 'Buy it when the flights are booked so cancellations are covered. Check it covers the hire-car excess.', 20),
('book', 'Hotels for all 13 nights', '2026-12-15', 'Sakura season fills up early, especially Kyoto.', 30),
('book', 'Nintendo Museum lottery', '2026-12-31', 'Tickets are by lottery months ahead. Check the site for the window covering your Kyoto days.', 40),
('book', 'Rental car for the drive days (4–6 Apr)', '2027-01-15', 'Ask about one-way drop fees, an ETC card and the Japan Expressway Pass. JDM rentals (Omoshiro, Fun2Drive) book up first.', 50),
('book', 'Yayoi Kusama Museum tickets', '2027-01-01', 'Sales open 10am JST (1am UK) on the 1st, two months ahead: 1 Jan for 29–31 Mar, 1 Feb for April.', 60),
('book', 'Toyota plant tour', '2027-01-05', 'Weekdays only, book 2 weeks to 3 months ahead on Toyota''s site.', 70),
('book', 'Nissan Heritage Collection tour', '2027-01-31', 'Free but must be booked online; slots go quickly.', 80),
('book', 'Ghibli Park day passes', '2027-02-10', 'Overseas sales open on the 10th, two months ahead, at 2pm JST.', 90),
('book', 'Ghibli Museum tickets', '2027-02-10', 'On sale the 10th of the month before: 10 Feb for 29–31 Mar, 10 Mar for April.', 100),
('book', 'Yamazaki Distillery tour', '2027-02-01', 'Slots vanish in minutes. Find out when your month opens and set an alarm.', 110),
('book', 'Restaurants that need a reservation', '2027-02-28', 'Kobe beef lunch, any omakase, tea experiences.', 120),
('book', 'Shinkansen seats', '2027-03-01', 'Seats open a month ahead. Big suitcases (over 160cm total) need an oversized-luggage seat on the Tokaido line, or forward them by takkyubin.', 130),
('papers', 'Passports valid for the whole trip', '2026-11-15', 'Check both expiry dates now; renewals can take weeks.', 10),
('papers', 'Check Japan entry rules', '2027-02-28', 'Short stays are visa-free for UK and most Western passports. The JESTA pre-travel authorisation is planned for 2028, so it shouldn''t apply yet, but check government travel advice nearer the time.', 20),
('papers', 'International Driving Permit (1949 Convention)', '2027-02-28', 'Both drivers. Rental companies turn you away without one, alongside your normal licence.', 30),
('papers', 'Visit Japan Web: immigration & customs QR codes', '2027-03-22', 'Fill it in a few days before flying to skip the paper forms on arrival.', 40),
('money', 'Fee-free travel card each', '2027-01-31', 'One that doesn''t charge for foreign spending or ATM withdrawals.', 10),
('money', 'Check cards and PINs work abroad', '2027-03-15', 'Tell the bank if needed, and carry a backup card in a different bag.', 20),
('money', 'Some yen before you fly', '2027-03-22', '¥20–30k each covers the cash-only places until you find a 7-Eleven ATM.', 30),
('tech', 'eSIM or pocket Wi-Fi', '2027-03-15', 'An eSIM each is easiest; check both phones are unlocked.', 10),
('tech', 'Plug adapters', '2027-03-01', 'Japan uses two flat pins (Type A) at 100V. Check chargers say 100–240V.', 20),
('tech', 'Suica/PASMO in Apple Wallet', '2027-03-22', 'Works on trains, buses, konbini and lockers.', 30),
('tech', 'Offline maps and translation', '2027-03-22', 'Download Google Maps areas and the Japanese pack in Google Translate (the camera mode reads menus).', 40),
('tech', 'Handy apps', '2027-03-22', 'GO (taxis), a transit app like Japan Transit Planner, Tabelog for food.', 50),
('health', 'Check medicines are allowed in Japan', '2027-02-28', 'Some cold and flu tablets (pseudoephedrine) are banned. More than a month''s supply of prescription meds needs an import certificate.', 10),
('health', 'Mini first-aid kit + hay-fever tablets', '2027-03-22', 'Cedar pollen season runs into April and catches out a lot of visitors.', 20),
('home', 'Time off approved', '2026-11-30', null, 10),
('home', 'Getting to and from the airport', '2027-03-01', 'Book parking, a lift or train tickets.', 20),
('home', 'House sorted', '2027-03-22', 'Out-of-office, bills, post, plants, bins.', 30),
('pack', 'Driving licences + IDPs', null, null, 10),
('pack', 'Slip-on walking shoes', null, 'You''ll take them off a lot: temples, ryokan, some restaurants.', 20),
('pack', 'Coin purse', null, '¥100 and ¥500 coins pile up fast.', 30),
('pack', 'Small towel and a bag for rubbish', null, 'Lots of toilets have no dryers, and there are hardly any public bins.', 40),
('pack', 'Layers and a light waterproof', null, 'Early April is roughly 8–18°C, colder in Hakone.', 50),
('pack', 'Space for merch', null, 'Leave room, or pack a fold-up duffel for the TORCH TORCH haul.', 60),
('final', 'Check the sakura forecast', '2027-03-20', 'Shuffle hanami days to match the bloom.', 10),
('final', 'Save bookings and addresses offline', '2027-03-26', 'Screenshot confirmations, and keep hotel addresses in Japanese to show taxi drivers.', 20),
('final', 'Online check-in', '2027-03-27', null, 30),
('final', 'Charge everything', '2027-03-28', 'Power bank, headphones, downloads for the flight.', 40);
