-- Where we sleep: one row per booking, spanning check-in to check-out.
-- A stay covers the nights check_in <= date < check_out.

create table public.stays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  area text,
  address text,
  check_in date not null,
  check_out date not null,
  check_in_time time,
  check_out_time time,
  status text not null default 'idea' check (status in ('idea','booked')),
  booking_ref text,
  url text,
  cost_jpy integer,
  lat double precision,
  lng double precision,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stays_dates_check check (check_out > check_in)
);

create index stays_check_in_idx on public.stays(check_in);

create trigger stays_touch before update on public.stays
  for each row execute function public.touch_updated_at();

-- Same shared-notebook access as plan_items.
alter table public.stays enable row level security;
create policy "anyone can read stays" on public.stays for select to anon using (true);
create policy "anyone can add stays" on public.stays for insert to anon with check (true);
create policy "anyone can edit stays" on public.stays for update to anon using (true) with check (true);
create policy "anyone can remove stays" on public.stays for delete to anon using (true);

alter publication supabase_realtime add table public.stays;
