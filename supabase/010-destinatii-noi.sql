-- 010 · Destinații noi din panou: ordinea lor în aplicație și ascunderea fără ștergere.
-- Se rulează în Supabase → SQL Editor. Poate fi rulat din nou fără efect.

alter table public.resorts
  add column if not exists active   boolean not null default true,
  add column if not exists position integer not null default 0;

-- Ordinea de acum: Kumánia, apoi Hungarospa. Doar dacă ordinea n-a fost încă aleasă.
update public.resorts set position = 1 where id = 'kumania' and position = 0;
update public.resorts set position = 2 where id = 'hungarospa' and position = 0;

-- Identificatorul unei destinații noi e scurt și simplu (ex. „zalakaros"): îl vede doar
-- sistemul, dar trebuie să fie curat, fiindcă apare în adresele fotografiilor.
alter table public.resorts drop constraint if exists resorts_id_format;
alter table public.resorts
  add constraint resorts_id_format check (id ~ '^[a-z0-9-]{2,40}$');

-- Oferta săptămânii nu poate fi o destinație ascunsă.
alter table public.resorts drop constraint if exists resorts_featured_visible;
alter table public.resorts
  add constraint resorts_featured_visible check (not featured or active);

-- Verificare: destinațiile, în ordinea din aplicație.
select id, name, active, position, featured from public.resorts order by position;
