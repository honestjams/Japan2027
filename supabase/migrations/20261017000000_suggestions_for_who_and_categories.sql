-- Who a suggestion is aimed at, plus art / tea / nature categories for Sam's interests.

alter table public.suggestions
  add column for_who text not null default 'both'
  check (for_who in ('josh','sam','both'));

alter table public.suggestions drop constraint suggestions_category_check;
alter table public.suggestions add constraint suggestions_category_check
  check (category in ('food','coffee','drinks','retro','cars','sights','drive','shopping','tip','art','tea','nature'));

alter table public.plan_items drop constraint plan_items_category_check;
alter table public.plan_items add constraint plan_items_category_check
  check (category in ('food','coffee','drinks','retro','cars','sights','drive','shopping','transport','stay','tip','art','tea','nature'));

-- Existing catalogue: motoring is Josh's, Ghibli is Sam's, the rest is shared.
update public.suggestions set for_who = 'josh' where category in ('cars','drive');
update public.suggestions set for_who = 'sam' where title = 'Ghibli Museum, Mitaka';
update public.suggestions set category = 'nature' where title = 'Inokashira Park';
