-- Things that must be booked before the trip, with an optional deadline
-- (when tickets go on sale or sell out). Booked = status 'booked' or 'done'.
alter table public.plan_items
  add column book_ahead boolean not null default false,
  add column book_by date;

create index plan_items_book_ahead_idx on public.plan_items(book_by) where book_ahead;
