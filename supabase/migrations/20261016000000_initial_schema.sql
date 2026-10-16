-- Applied to Supabase project zavjcxobclomrmxxhxfh (japan-2027, Tokyo region).
-- Suggestions were seeded separately; see supabase/seed/suggestions.json.

create table public.travellers (
  id text primary key,
  name text not null,
  color text not null
);

create table public.trip_days (
  date date primary key,
  city text not null default 'TBC',
  stay text,
  is_drive_day boolean not null default false,
  car text,
  notes text,
  updated_at timestamptz not null default now()
);

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('food','coffee','drinks','retro','cars','sights','drive','shopping','tip')),
  city text not null,
  area text,
  description text not null,
  cost_hint text,
  tags text[] not null default '{}',
  lat double precision,
  lng double precision,
  url text,
  created_at timestamptz not null default now()
);

create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('food','coffee','drinks','retro','cars','sights','drive','shopping','transport','stay','tip')),
  city text,
  area text,
  date date references public.trip_days(date) on delete set null,
  slot text check (slot in ('morning','afternoon','evening','night')),
  start_time time,
  status text not null default 'idea' check (status in ('idea','planned','booked','done')),
  wish_of text not null default 'both' check (wish_of in ('josh','sam','both')),
  added_by text references public.travellers(id),
  cost_jpy integer,
  url text,
  lat double precision,
  lng double precision,
  notes text,
  suggestion_id uuid references public.suggestions(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plan_items_date_idx on public.plan_items(date);
create index plan_items_suggestion_idx on public.plan_items(suggestion_id);
create index plan_items_added_by_idx on public.plan_items(added_by);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger plan_items_touch before update on public.plan_items
  for each row execute function public.touch_updated_at();
create trigger trip_days_touch before update on public.trip_days
  for each row execute function public.touch_updated_at();

-- No login: the app is a shared notebook for two people. RLS is on so access
-- is explicit; the anon role may read everything and write plans/days only.
alter table public.travellers enable row level security;
alter table public.trip_days enable row level security;
alter table public.suggestions enable row level security;
alter table public.plan_items enable row level security;

create policy "anyone can read travellers" on public.travellers for select to anon using (true);
create policy "anyone can read suggestions" on public.suggestions for select to anon using (true);
create policy "anyone can read days" on public.trip_days for select to anon using (true);
create policy "anyone can update days" on public.trip_days for update to anon using (true) with check (true);
create policy "anyone can read items" on public.plan_items for select to anon using (true);
create policy "anyone can add items" on public.plan_items for insert to anon with check (true);
create policy "anyone can edit items" on public.plan_items for update to anon using (true) with check (true);
create policy "anyone can remove items" on public.plan_items for delete to anon using (true);

alter publication supabase_realtime add table public.plan_items, public.trip_days;

insert into public.travellers (id, name, color) values
  ('josh', 'Josh', '#4F7F7C'),
  ('sam', 'Sam', '#E7B3B6');

-- Draft route; editable in the app.
insert into public.trip_days (date, city, is_drive_day, notes)
select d::date,
  case
    when d::date <= '2027-04-03' then 'Tokyo'
    when d::date <= '2027-04-05' then 'Hakone / Fuji'
    when d::date = '2027-04-06' then 'Nagoya'
    when d::date <= '2027-04-08' then 'Kyoto'
    else 'Osaka'
  end,
  d::date in ('2027-04-04','2027-04-05','2027-04-06'),
  case when d::date = '2027-03-29' then 'Land in Tokyo'
       when d::date = '2027-04-11' then 'Fly home from Osaka' end
from generate_series('2027-03-29'::date, '2027-04-11'::date, interval '1 day') d;
