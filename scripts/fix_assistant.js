import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-side only: never prefix with VITE_

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraint() {
  const { data, error } = await supabase.rpc('get_roles');
  console.log('rpc check:', data, error);
}

checkConstraint();
