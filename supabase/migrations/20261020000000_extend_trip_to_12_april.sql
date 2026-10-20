-- Trip extended one day for the F1 Japanese Grand Prix at Suzuka on 11 April.
insert into public.trip_days (date, city, notes)
values ('2027-04-12', 'Osaka', 'Fly home from Osaka')
on conflict (date) do nothing;
