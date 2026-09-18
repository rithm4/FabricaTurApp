-- 006 · Starea cererii ajunge în aplicație pe loc, nu doar la reîncărcare.
--
-- Clientul nu poate asculta tabelul cererilor (acolo sunt numele și telefoanele tuturor).
-- În schimb, la fiecare schimbare de stare serverul trimite un semnal pe canalul
-- „cerere:<numărul cererii>". Numărul îl știe doar telefonul care a trimis cererea,
-- iar semnalul conține doar starea — nimic altceva.
-- Se rulează în Supabase → SQL Editor. Poate fi rulat din nou fără efect.

create or replace function public.announce_request_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    -- Semnalul e un bonus: dacă serviciul de timp real are o problemă, schimbarea stării
    -- din panou se salvează oricum, iar aplicația o află la următoarea verificare.
    begin
      perform realtime.send(
        jsonb_build_object('status', new.status),
        'status',
        'cerere:' || new.id::text,
        false
      );
    exception when others then
      null;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists requests_announce_status on public.requests;
create trigger requests_announce_status
  after update of status on public.requests
  for each row execute function public.announce_request_status();
