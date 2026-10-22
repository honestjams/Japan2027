-- Budget: tick things off as paid, and remember who paid so we can settle up.
alter table public.plan_items
  add column paid boolean not null default false,
  add column paid_by text check (paid_by in ('josh','sam'));

alter table public.stays
  add column paid boolean not null default false,
  add column paid_by text check (paid_by in ('josh','sam'));
