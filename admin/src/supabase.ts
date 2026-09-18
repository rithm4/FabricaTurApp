import { createClient } from '@supabase/supabase-js';

/**
 * Legătura cu baza de date.
 *
 * Cheia de mai jos e cea PUBLICĂ (publishable): e făcută să stea în cod și ajunge oricum
 * în aplicația clienților. Nu dă acces la nimic în afară de ce permit regulile din
 * `supabase/schema.sql`. Cheia secretă `service_role` nu trebuie pusă niciodată aici.
 */
const SUPABASE_URL = 'https://arbeztgmamvwsfybhpea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_iiLa49PzBEsnHecOV9EwtQ_z6lWiTHS';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
