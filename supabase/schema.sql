-- ============================================================================
-- Fabrica Tur — baza de date
--
-- Cum se folosește: Supabase → SQL Editor → New query → lipești tot fișierul → Run.
-- Se poate rula de mai multe ori fără să strice nimic.
--
-- Regula de securitate: cheia publică ajunge în aplicația fiecărui client, deci oricine
-- o poate extrage. Cu ea se poate doar CITI oferta și TRIMITE o cerere. Tot restul —
-- prețuri, notificări, citirea cererilor cu telefoanele clienților — cere un cont de
-- operator. Înscrierea publică e pornită în Supabase, deci „utilizator logat" NU
-- înseamnă operator: operatorii sunt într-o listă separată, tabelul `operators`.
-- ============================================================================


-- ── Tabele ──────────────────────────────────────────────────────────────────

create table if not exists public.resorts (
  id          text primary key,
  name        text not null,
  city_ro     text not null,
  city_ru     text not null,
  price       integer not null check (price > 0),
  -- Reducerea afișată în aplicație se calculează din diferență; nu se stochează separat.
  old_price   integer check (old_price is null or old_price > 0),
  rating      text not null default '',
  water_temp  text not null default '',
  nights      integer not null default 7 check (nights > 0),
  updated_at  timestamptz not null default now()
);

create table if not exists public.departures (
  id          uuid primary key default gen_random_uuid(),
  resort_id   text not null references public.resorts (id) on delete cascade,
  start_date  date not null,
  nights      integer not null check (nights > 0),
  seats_total integer not null check (seats_total > 0),
  seats_left  integer not null check (seats_left >= 0 and seats_left <= seats_total)
);

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  sent_at     timestamptz not null default now(),
  audience    text not null check (audience in ('promo', 'lastSeats', 'newDepartures', 'news')),
  target      text not null,
  title_ro    text not null check (char_length(title_ro) between 1 and 120),
  title_ru    text not null check (char_length(title_ru) between 1 and 120),
  body_ro     text not null check (char_length(body_ro) between 1 and 400),
  body_ru     text not null check (char_length(body_ru) between 1 and 400)
);

create table if not exists public.requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null check (char_length(name) between 2 and 120),
  phone        text not null check (char_length(phone) between 6 and 30),
  resort_id    text not null references public.resorts (id),
  departure_id uuid references public.departures (id) on delete set null,
  party        text not null check (party in ('1', '2', '3+')),
  lang         text not null check (lang in ('ro', 'ru')),
  status       text not null default 'new'
               check (status in ('new', 'called', 'booked', 'cancelled')),
  -- Notița operatorului; aplicația nu o poate completa.
  note         text not null default '' check (char_length(note) <= 1000)
);

-- Lista operatorilor. Se completează doar din acest editor SQL, nu din aplicație.
create table if not exists public.operators (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.operators where user_id = auth.uid());
$$;


-- ── Reguli de acces ─────────────────────────────────────────────────────────

alter table public.resorts       enable row level security;
alter table public.departures    enable row level security;
alter table public.notifications enable row level security;
alter table public.requests      enable row level security;
alter table public.operators     enable row level security;

-- Oferta e publică: aplicația o citește fără cont.
drop policy if exists "oricine citeste hotelurile"   on public.resorts;
drop policy if exists "oricine citeste plecarile"    on public.departures;
drop policy if exists "oricine citeste notificarile" on public.notifications;
create policy "oricine citeste hotelurile"   on public.resorts       for select using (true);
create policy "oricine citeste plecarile"    on public.departures    for select using (true);
create policy "oricine citeste notificarile" on public.notifications for select using (true);

-- Aplicația poate trimite o cerere, doar ca „nouă" — dar nu poate citi cererile nimănui.
drop policy if exists "oricine trimite o cerere" on public.requests;
create policy "oricine trimite o cerere" on public.requests
  for insert with check (status = 'new' and note = '');

-- Operatorii pot face orice.
drop policy if exists "operatorii gestioneaza hotelurile"   on public.resorts;
drop policy if exists "operatorii gestioneaza plecarile"    on public.departures;
drop policy if exists "operatorii gestioneaza notificarile" on public.notifications;
drop policy if exists "operatorii gestioneaza cererile"     on public.requests;
create policy "operatorii gestioneaza hotelurile"   on public.resorts
  for all using (public.is_operator()) with check (public.is_operator());
create policy "operatorii gestioneaza plecarile"    on public.departures
  for all using (public.is_operator()) with check (public.is_operator());
create policy "operatorii gestioneaza notificarile" on public.notifications
  for all using (public.is_operator()) with check (public.is_operator());
create policy "operatorii gestioneaza cererile"     on public.requests
  for all using (public.is_operator()) with check (public.is_operator());

-- Un operator își poate vedea doar propriul rând, ca panoul să știe că e operator.
drop policy if exists "operatorul se vede pe sine" on public.operators;
create policy "operatorul se vede pe sine" on public.operators
  for select using (user_id = auth.uid());


-- ── Actualizare în timp real ────────────────────────────────────────────────
-- Notificarea trimisă din panou apare în aplicație pe loc; cererea nouă apare în panou pe loc.

do $$
declare
  t text;
begin
  foreach t in array array['resorts', 'departures', 'notifications', 'requests'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;


-- ── Datele de pornire ───────────────────────────────────────────────────────
-- Aceleași ca în aplicație. Nu suprascriu ce ai schimbat deja, dacă rulezi din nou.

insert into public.resorts (id, name, city_ro, city_ru, price, old_price, rating, water_temp, nights)
values
  ('kumania',    'Hotel Kumánia',    'Kisújszállás',   'Кишуйсаллаш',  542, 610,  '8,9', '47–61 °C', 7),
  ('hungarospa', 'Hotel Hungarospa', 'Hajdúszoboszló', 'Хайдусобосло', 575, null, '9,1', '38–40 °C', 7)
on conflict (id) do nothing;

insert into public.departures (resort_id, start_date, nights, seats_total, seats_left)
select * from (values
  ('kumania',    date '2026-10-12', 7,  30, 4),
  ('kumania',    date '2026-10-26', 7,  30, 11),
  ('kumania',    date '2026-11-09', 7,  30, 16),
  ('kumania',    date '2026-11-23', 10, 30, 20),
  ('kumania',    date '2026-12-07', 7,  30, 22),
  ('hungarospa', date '2026-10-19', 7,  24, 4),
  ('hungarospa', date '2026-11-16', 7,  24, 18)
) as v(resort_id, start_date, nights, seats_total, seats_left)
where not exists (select 1 from public.departures);


-- ── După acest fișier ────────────────────────────────────────────────────────
-- Rulează și 003-stari-si-locuri.sql: starea cererilor pentru client și locurile
-- care scad singure la rezervare. (002-notite.sql e deja inclus mai sus.)
