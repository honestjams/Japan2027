-- How a price splits: 'each' = per person (tickets), 'shared' = one cost
-- for the group (stays, car hire). pays_* = who's in on it.
alter table public.plan_items
  add column cost_mode text not null default 'each' check (cost_mode in ('each','shared')),
  add column pays_josh boolean not null default true,
  add column pays_sam boolean not null default true,
  add constraint plan_items_someone_pays check (pays_josh or pays_sam);

-- Existing prices were entered as a total for both of us; keep their meaning.
update public.plan_items set cost_mode = 'shared';

alter table public.stays
  add column cost_mode text not null default 'shared' check (cost_mode in ('each','shared')),
  add column pays_josh boolean not null default true,
  add column pays_sam boolean not null default true,
  add constraint stays_someone_pays check (pays_josh or pays_sam);
