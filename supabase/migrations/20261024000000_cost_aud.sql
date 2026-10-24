-- Prices can be entered in A$ or ¥. Whichever was entered is kept exactly;
-- the other is derived at today's rate when shown.
alter table public.plan_items
  add column cost_aud numeric(12,2),
  add constraint plan_items_one_currency check (cost_jpy is null or cost_aud is null);

alter table public.stays
  add column cost_aud numeric(12,2),
  add constraint stays_one_currency check (cost_jpy is null or cost_aud is null);
