-- 003 · Clientul își vede starea cererii; locurile scad singure la rezervare.
-- Se rulează o singură dată, în Supabase → SQL Editor. Poate fi rulat din nou fără efect.


-- ── Trimiterea cererii ──────────────────────────────────────────────────────
-- Aplicația trimite cererea prin această funcție și primește înapoi numărul ei.
-- Cu numărul, și doar cu el, își poate afla mai târziu starea. Cererile altora rămân ascunse.

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
  new_id uuid;
begin
  insert into public.requests (name, phone, resort_id, departure_id, party, lang)
  values (trim(p_name), trim(p_phone), p_resort_id, p_departure_id, p_party, p_lang)
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.submit_request(text, text, text, uuid, text, text)
  to anon, authenticated;


-- ── Starea cererilor proprii ────────────────────────────────────────────────
-- Întoarce starea doar pentru numerele primite. Un număr (UUID) nu poate fi ghicit,
-- deci fiecare om își vede doar cererile lui. Nu întoarce nume sau telefoane.

create or replace function public.request_statuses(p_ids uuid[])
returns table (id uuid, status text)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.status
  from public.requests r
  where r.id = any (p_ids[1:50]);
$$;

grant execute on function public.request_statuses(uuid[]) to anon, authenticated;


-- ── Locurile scad singure la rezervare ─────────────────────────────────────
-- „Rezervată" scade locurile plecării alese cu numărul de persoane; dacă rezervarea
-- se anulează, se șterge sau se mută pe altă dată, locurile se întorc.
-- „3+" contează ca 3: numărul exact se ajustează de mână, din Plecări.

create or replace function public.party_size(p text)
returns integer
language sql
immutable
as $$
  select case p when '1' then 1 when '2' then 2 else 3 end;
$$;

create or replace function public.sync_seats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.status = 'booked' and old.departure_id is not null then
    update public.departures
    set seats_left = least(seats_total, seats_left + public.party_size(old.party))
    where id = old.departure_id;
  end if;

  if tg_op = 'UPDATE' and new.status = 'booked' and new.departure_id is not null then
    update public.departures
    set seats_left = greatest(0, seats_left - public.party_size(new.party))
    where id = new.departure_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists requests_sync_seats on public.requests;
-- Doar când se schimbă starea, data sau numărul de persoane — nu și la o notiță.
create trigger requests_sync_seats
  after update of status, departure_id, party or delete on public.requests
  for each row execute function public.sync_seats();
