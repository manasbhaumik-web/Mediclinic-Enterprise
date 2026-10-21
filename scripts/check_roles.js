import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const patientId = crypto.randomUUID();
  const visitId = crypto.randomUUID();
  
  await supabase.from('patients').insert([{
    id: patientId, full_name: 'Test', ic_number: `T-${Date.now()}`
  }]);

  const { data: vData, error: vErr } = await supabase.from('visits').insert([{
    id: visitId, patient_id: patientId, status: 'Awaiting Consult', visit_date: new Date().toISOString()
  }]).select().single();
  
  console.log('Visit Insert Error:', vErr);
}

check();
