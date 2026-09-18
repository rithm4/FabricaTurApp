-- 009 · Tot conținutul ofertei se scrie din panou: texte, liste, fotografii, oferta săptămânii,
-- plus datele agenției (WhatsApp, slogan). Aplicația nu mai are nimic de ofertă scris în cod.
-- Se rulează în Supabase → SQL Editor. Poate fi rulat din nou fără efect.


-- ── Hotelurile: textele și fotografiile ─────────────────────────────────────

alter table public.resorts
  add column if not exists featured    boolean not null default false,
  add column if not exists short_ro    text    not null default '',
  add column if not exists short_ru    text    not null default '',
  add column if not exists badge_ro    text    not null default '',
  add column if not exists badge_ru    text    not null default '',
  add column if not exists includes_ro text[]  not null default '{}',
  add column if not exists includes_ru text[]  not null default '{}',
  add column if not exists features_ro text[]  not null default '{}',
  add column if not exists features_ru text[]  not null default '{}',
  add column if not exists tags_ro     text[]  not null default '{}',
  add column if not exists tags_ru     text[]  not null default '{}',
  add column if not exists photos      text[]  not null default '{}';

-- O singură ofertă a săptămânii.
create unique index if not exists resorts_one_featured on public.resorts ((true)) where featured;

-- Textele de până acum, ca aplicația să arate la fel după mutare. Doar unde e gol,
-- deci rularea din nou nu șterge ce ai scris între timp în panou.
update public.resorts set featured = true
where id = 'kumania' and not exists (select 1 from public.resorts where featured);

update public.resorts set short_ro = 'Transport și mic dejun', short_ru = 'Транспорт и завтрак'
where short_ro = '';

update public.resorts set badge_ro = 'Ofertă limitată', badge_ru = 'Ограниченное предложение'
where id = 'kumania' and badge_ro = '';

update public.resorts set
  includes_ro = array['Transport tur-retur din Chișinău', 'Cazare cu mic dejun', 'Acces la băile termale și wellness'],
  includes_ru = array['Транспорт туда-обратно из Кишинёва', 'Проживание с завтраком', 'Доступ к термальным баням и wellness']
where includes_ro = '{}';

update public.resorts set
  features_ro = array['Acces direct din hotel la băi', 'Bazine interioare și exterioare', 'Proceduri și fizioterapie', 'Mic dejun și cină incluse'],
  features_ru = array['Прямой переход из отеля в бани', 'Внутренние и наружные бассейны', 'Процедуры и физиотерапия', 'Завтрак и ужин включены']
where id = 'kumania' and features_ro = '{}';

update public.resorts set
  features_ro = array['Unul dintre cele mai mari complexe termale din Europa', 'Bazine interioare și exterioare', 'Zonă wellness', 'Mic dejun inclus'],
  features_ru = array['Один из крупнейших термальных комплексов Европы', 'Внутренние и наружные бассейны', 'Зона wellness', 'Завтрак включён']
where id = 'hungarospa' and features_ro = '{}';

update public.resorts set tags_ro = array['Acces direct', 'Proceduri'], tags_ru = array['Прямой переход', 'Процедуры']
where id = 'kumania' and tags_ro = '{}';

update public.resorts set tags_ro = array['Cel mai mare complex', 'Wellness'], tags_ru = array['Крупнейший комплекс', 'Wellness']
where id = 'hungarospa' and tags_ro = '{}';


-- ── Datele agenției ─────────────────────────────────────────────────────────

create table if not exists public.settings (
  id          integer primary key default 1 check (id = 1),
  whatsapp    text not null default '' check (whatsapp ~ '^[0-9]*$'),
  tagline_ro  text not null default '',
  tagline_ru  text not null default ''
);

insert into public.settings (id, tagline_ro, tagline_ru)
values (1, 'Sejururi termale în Ungaria, cu plecare din Chișinău',
           'Термальные курорты Венгрии, выезд из Кишинёва')
on conflict (id) do nothing;

alter table public.settings enable row level security;
drop policy if exists "oricine citeste setarile" on public.settings;
create policy "oricine citeste setarile" on public.settings for select using (true);
drop policy if exists "operatorii gestioneaza setarile" on public.settings;
create policy "operatorii gestioneaza setarile" on public.settings
  for all using (public.is_operator()) with check (public.is_operator());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'settings'
  ) then
    alter publication supabase_realtime add table public.settings;
  end if;
end $$;


-- ── Fotografiile ────────────────────────────────────────────────────────────
-- Un dosar public: oricine le poate vedea (aplicația), doar operatorii le pot încărca.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

drop policy if exists "operatorii incarca fotografii" on storage.objects;
create policy "operatorii incarca fotografii" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos' and public.is_operator());
drop policy if exists "operatorii schimba fotografii" on storage.objects;
create policy "operatorii schimba fotografii" on storage.objects
  for update to authenticated using (bucket_id = 'photos' and public.is_operator());
drop policy if exists "operatorii sterg fotografii" on storage.objects;
create policy "operatorii sterg fotografii" on storage.objects
  for delete to authenticated using (bucket_id = 'photos' and public.is_operator());


-- Verificare: oferta săptămânii și textele mutate.
select id, featured, short_ro, badge_ro, array_length(includes_ro, 1) as include,
       array_length(features_ro, 1) as avantaje, array_length(photos, 1) as fotografii
from public.resorts order by id;
