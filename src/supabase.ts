import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

/**
 * Legătura aplicației cu baza de date.
 *
 * Cheia e cea PUBLICĂ (publishable): e făcută să stea în aplicație. Cu ea, regulile din
 * `supabase/schema.sql` permit doar citirea ofertei și trimiterea unei cereri — nimic altceva.
 * Aplicația nu are conturi Supabase, deci nu păstrăm nicio sesiune.
 */
const SUPABASE_URL = 'https://arbeztgmamvwsfybhpea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_iiLa49PzBEsnHecOV9EwtQ_z6lWiTHS';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
