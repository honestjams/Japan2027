-- Our own travel details for a leg of a day, overriding the estimate.
-- Keyed by the stop we're travelling TO: a plan item's id, or 'home' for
-- the last leg back to tonight's stay.
create table public.travel_legs (
  date date not null references public.trip_days(date) on delete cascade,
  to_key text not null,
  mode text check (mode in ('walk','train','bus','taxi','drive','ferry')),
  minutes integer check (minutes is null or minutes between 0 and 1440),
  note text,
  updated_at timestamptz not null default now(),
  primary key (date, to_key)
);

create trigger travel_legs_touch before update on public.travel_legs
  for each row execute function public.touch_updated_at();

alter table public.travel_legs enable row level security;
create policy "anyone can read legs" on public.travel_legs for select to anon using (true);
create policy "anyone can add legs" on public.travel_legs for insert to anon with check (true);
create policy "anyone can edit legs" on public.travel_legs for update to anon using (true) with check (true);
create policy "anyone can remove legs" on public.travel_legs for delete to anon using (true);

alter publication supabase_realtime add table public.travel_legs;
