-- 007 · Cererile intră doar prin funcție, iar funcția verifică ce primește.
-- Include și pasul din 005 (oprirea trimiterii directe în tabel).
-- Se rulează în Supabase → SQL Editor. Poate fi rulat din nou fără efect.

-- 1. Nicio cerere scrisă direct în tabel: doar prin submit_request.
drop policy if exists "oricine trimite o cerere" on public.requests;

-- 2. Funcția verifică datele înainte să le primească.
create or replace function public.submit_request(
  p_name         text,
  p_phone        text,
  p_resort_id    text,
  p_departure_id uuid,
  p_party        text,
  p_lang         text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id    uuid;
  dep_id    uuid := p_departure_id;
  digits    text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  -- Plecarea trebuie să fie a aceluiași hotel și încă în viitor; altfel cererea
  -- pleacă fără dată, iar operatorul o stabilește la telefon.
  if dep_id is not null and not exists (
    select 1 from public.departures d
    where d.id = dep_id and d.resort_id = p_resort_id and d.start_date >= current_date
  ) then
    dep_id := null;
  end if;

  -- Împotriva cererilor trimise în serie: cel mult 5 pe oră de la același număr.
  if (
    select count(*) from public.requests r
    where regexp_replace(r.phone, '\D', '', 'g') = digits
      and r.created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'Prea multe cereri de la acest număr. Încearcă mai târziu.'
      using errcode = 'P0001';
  end if;

  insert into public.requests (name, phone, resort_id, departure_id, party, lang)
  values (trim(p_name), trim(p_phone), p_resort_id, dep_id, p_party, p_lang)
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.submit_request(text, text, text, uuid, text, text)
  to anon, authenticated;

-- Verificare: trebuie să rămână doar regula operatorilor (ALL), fără INSERT.
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'requests';
