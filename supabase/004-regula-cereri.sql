-- 004 · Reface regula de trimitere a cererilor: din aplicație vine doar o cerere nouă,
-- fără notiță. Notița o scrie numai operatorul.
-- Se rulează în Supabase → SQL Editor. Poate fi rulat din nou fără efect.

drop policy if exists "oricine trimite o cerere" on public.requests;
create policy "oricine trimite o cerere" on public.requests
  for insert to anon, authenticated
  with check (status = 'new' and note = '');

-- Verificare: tabelul de jos trebuie să arate regula de mai sus (cu note = '')
-- și declanșatorul requests_sync_seats, care scade locurile la rezervare.
select 'regulă' as ce, policyname as nume, with_check as conditie
from pg_policies
where schemaname = 'public' and tablename = 'requests' and cmd = 'INSERT'
union all
select 'declanșator', tgname, null
from pg_trigger
where tgrelid = 'public.requests'::regclass and not tgisinternal;
