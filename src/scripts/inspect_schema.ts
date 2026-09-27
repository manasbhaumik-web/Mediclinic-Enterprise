import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wdzkmvyiexpwjkcqwevq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkemttdnlpZXhwd2prY3F3ZXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NDcwMjAsImV4cCI6MjEwMDUyMzAyMH0.GRZd0xJRr0J5L938wpvA37wg6UJCr7ZNGWMf9XxGI3s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspect() {
  const staffRes = await supabase.from('staff').select('*').limit(1);
  console.log('Staff Sample Row / Keys:', staffRes.data ? Object.keys(staffRes.data[0] || {}) : staffRes.error);

  const eqRes = await supabase.from('equipment').select('*').limit(1);
  console.log('Equipment Sample Row / Keys:', eqRes.data ? Object.keys(eqRes.data[0] || {}) : eqRes.error);

  const invRes = await supabase.from('inventory').select('*').limit(1);
  console.log('Inventory Sample Row / Keys:', invRes.data ? Object.keys(invRes.data[0] || {}) : invRes.error);
}

inspect();
