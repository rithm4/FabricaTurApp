-- 008 · „Oferta e valabilă până la …" se alege din panou, nu mai e scrisă în aplicație.
-- După data aleasă, rândul dispare singur din aplicație. Gol = fără termen afișat.
-- Se rulează în Supabase → SQL Editor. Poate fi rulat din nou fără efect.

alter table public.resorts
  add column if not exists offer_until date;

-- Verificare: trebuie să apară coloana offer_until.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'resorts' and column_name = 'offer_until';
