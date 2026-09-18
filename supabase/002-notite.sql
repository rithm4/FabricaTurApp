-- Notița operatorului pe fiecare cerere („a zis să sun luni", „vrea cameră la parter").
-- Se rulează o singură dată, în Supabase → SQL Editor. Poate fi rulat din nou fără efect.

alter table public.requests
  add column if not exists note text not null default ''
  check (char_length(note) <= 1000);

-- Aplicația trimite cererea fără notiță: notița o scrie doar operatorul.
drop policy if exists "oricine trimite o cerere" on public.requests;
create policy "oricine trimite o cerere" on public.requests
  for insert with check (status = 'new' and note = '');
