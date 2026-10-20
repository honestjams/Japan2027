-- Josh and Sam fly from Brisbane on Australian passports. Brisbane is on
-- AEST all year (no daylight saving), one hour ahead of Japan.

update public.checklist_items set notes = 'Sales open 10am JST (11am Brisbane) on the 1st, two months ahead: 1 Jan for 29–31 Mar, 1 Feb for April.'
  where title = 'Yayoi Kusama Museum tickets';
update public.checklist_items set notes = 'Overseas sales open on the 10th, two months ahead, at 2pm JST (3pm Brisbane).'
  where title = 'Ghibli Park day passes';
update public.checklist_items set notes = 'Australians can visit visa-free for up to 90 days. The JESTA pre-travel authorisation is planned for 2028, so it shouldn''t apply yet, but check Smartraveller nearer the time.'
  where title = 'Check Japan entry rules';
update public.checklist_items set notes = 'Both drivers. Get it from RACQ (in branch or online) and bring your Queensland licence too; rental companies turn you away without both.'
  where title = 'International Driving Permit (1949 Convention)';
update public.checklist_items set notes = 'Buy it when the flights are booked so cancellations are covered. Medicare doesn''t cover you in Japan, so make sure medical is included, and check it covers the hire-car excess.'
  where title = 'Travel insurance';
update public.checklist_items set notes = 'Japan uses two flat pins (Type A) at 100V, so Aussie plugs need an adapter. Most phone and laptop chargers say 100–240V and are fine.'
  where title = 'Plug adapters';
update public.checklist_items set notes = 'Book Brisbane Airport parking, a lift or the Airtrain.'
  where title = 'Getting to and from the airport';
update public.checklist_items set notes = 'Early April is roughly 8–18°C, much cooler than Brisbane and colder again in Hakone. Bring a proper jumper.'
  where title = 'Layers and a light waterproof';
