/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL);
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env.local file.');
}

// VITE_* values are inlined into the public JS bundle, so a privileged key here would be
// readable by anyone who loads the site. Refuse to start instead of shipping it.
function assertNotServiceRoleKey(key: string | undefined) {
  if (!key) return;
  try {
    const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.role === "service_role") {
      throw new Error("VITE_SUPABASE_ANON_KEY contains a service_role key. Use the anon key and rotate the exposed service_role key.");
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("VITE_SUPABASE_ANON_KEY")) throw err;
    // Not a decodable JWT (e.g. new-style publishable key): nothing to check.
  }
}
assertNotServiceRoleKey(supabaseAnonKey || undefined);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

