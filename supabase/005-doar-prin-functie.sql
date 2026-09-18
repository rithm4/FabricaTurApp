-- 005 · Cererile intră doar prin funcția submit_request (vezi 003).
-- Funcția pune singură starea „nouă" și notița goală, deci nimeni din afară nu mai poate
-- scrie direct în tabel o cerere cu notiță, stare sau alte câmpuri alese de el.
-- Se rulează după ce aplicația publicată folosește submit_request. Poate fi rulat din nou.

drop policy if exists "oricine trimite o cerere" on public.requests;

-- Verificare: nu trebuie să mai apară nicio regulă de tip INSERT pentru cereri.
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'requests';
