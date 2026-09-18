-- 011 · Articole informative: sfaturi de drum, despre băile termale, despre hoteluri.
-- Se scriu în panou (Articole), apar în aplicație pe Acasă și în lista de articole.
-- Se rulează în Supabase → SQL Editor. Poate fi rulat din nou fără efect.

create table if not exists public.articles (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Ciorna nu se vede în aplicație; doar operatorul o vede, în panou și în previzualizare.
  published   boolean not null default false,
  position    integer not null default 0,
  -- Opțional: articolul ține de un hotel, iar la final apare butonul spre pagina lui.
  resort_id   text references public.resorts (id) on delete set null,
  cover       text not null default '',
  title_ro    text not null default '' check (char_length(title_ro) <= 140),
  title_ru    text not null default '' check (char_length(title_ru) <= 140),
  summary_ro  text not null default '' check (char_length(summary_ro) <= 300),
  summary_ru  text not null default '' check (char_length(summary_ru) <= 300),
  body_ro     text not null default '' check (char_length(body_ro) <= 20000),
  body_ru     text not null default '' check (char_length(body_ru) <= 20000)
);

alter table public.articles enable row level security;

-- Aplicația vede doar articolele publicate.
drop policy if exists "oricine citeste articolele publicate" on public.articles;
create policy "oricine citeste articolele publicate" on public.articles
  for select using (published);

drop policy if exists "operatorii gestioneaza articolele" on public.articles;
create policy "operatorii gestioneaza articolele" on public.articles
  for all using (public.is_operator()) with check (public.is_operator());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'articles'
  ) then
    alter publication supabase_realtime add table public.articles;
  end if;
end $$;

-- Previzualizarea din panou: un articol după numărul lui, chiar ciornă. Numărul (UUID)
-- nu poate fi ghicit, iar textul unui articol nu e secret.
create or replace function public.article_preview(p_id uuid)
returns setof public.articles
language sql
stable
security definer
set search_path = public
as $$
  select * from public.articles where id = p_id;
$$;

grant execute on function public.article_preview(uuid) to anon, authenticated;

-- Două ciorne de pornire, nepublicate: le citești, le corectezi și le publici din panou.
insert into public.articles (position, title_ro, title_ru, summary_ro, summary_ru, body_ro, body_ru)
select * from (values
  (1,
   'Ce iei cu tine la băile termale',
   'Что взять с собой на термальные купальни',
   'O listă scurtă, ca să nu uiți nimic important acasă.',
   'Короткий список, чтобы ничего важного не забыть дома.',
   E'Apa termală e caldă, dar în jurul bazinelor e răcoare. Câteva lucruri fac sejurul mult mai comod.\n\n- Două costume de baie: unul se usucă, cu celălalt intri în apă.\n- Papuci de plajă, cu talpă care nu alunecă.\n- Un halat sau un prosop mare.\n- O cască de baie, dacă o cer bazinele.\n- Medicamentele tale obișnuite, pentru toate zilele.\n- Copia biletului de trimitere, dacă faci proceduri.\n\nDacă ai întrebări despre ce e inclus la hotelul tău, sună-ne: îți spunem exact.',
   E'Термальная вода тёплая, но вокруг бассейнов прохладно. Несколько вещей сделают отдых гораздо удобнее.\n\n- Два купальника: один сохнет, в другом купаетесь.\n- Пляжные тапочки с нескользящей подошвой.\n- Халат или большое полотенце.\n- Шапочка для плавания, если её требуют бассейны.\n- Ваши обычные лекарства на все дни.\n- Копия направления, если будете делать процедуры.\n\nЕсли есть вопросы о том, что входит в ваш отель, позвоните нам — всё расскажем.'),
  (2,
   'Cum te bucuri de apa termală în siguranță',
   'Как безопасно наслаждаться термальной водой',
   'Câteva reguli simple pentru un sejur liniștit.',
   'Несколько простых правил для спокойного отдыха.',
   E'Apa termală odihnește și relaxează, dar e bine s-o folosești cu măsură.\n\n- Începe cu 15–20 de minute în apă și crește treptat.\n- Fă pauze și bea apă între băi.\n- Ieși din apă dacă simți amețeală sau bătăi de inimă puternice.\n- Nu intra în bazin imediat după masă.\n\nDacă ai o boală de inimă, tensiune mare sau urmezi un tratament, întreabă medicul înainte de plecare.',
   E'Термальная вода успокаивает и расслабляет, но пользоваться ею стоит в меру.\n\n- Начинайте с 15–20 минут в воде и увеличивайте постепенно.\n- Делайте перерывы и пейте воду между купаниями.\n- Выходите из воды, если почувствуете головокружение или сильное сердцебиение.\n- Не заходите в бассейн сразу после еды.\n\nЕсли у вас болезни сердца, высокое давление или вы проходите лечение, посоветуйтесь с врачом до поездки.')
) as v(position, title_ro, title_ru, summary_ro, summary_ru, body_ro, body_ru)
where not exists (select 1 from public.articles);

-- Verificare: articolele de pornire (nepublicate).
select position, title_ro, published from public.articles order by position;
