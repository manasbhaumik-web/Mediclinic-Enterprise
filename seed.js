import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Actually a service role key

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase URL or KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seed() {
  const users = [
    { email: 'doctor@mediclinic.local', password: 'password123', name: 'Dr. Sarah Jenkins', role: 'doctor' },
    { email: 'pharmacist@mediclinic.local', password: 'password123', name: 'David Chen', role: 'pharmacist' },
    { email: 'assistant@mediclinic.local', password: 'password123', name: 'Nurul Amin', role: 'clinic-assistant' },
    { email: 'sysadmin@mediclinic.local', password: 'password123', name: 'System Admin', role: 'admin' }
  ];

  for (const u of users) {
    console.log(`Creating user: ${u.email}...`);
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true
    });

    if (error) {
      console.error(`Failed to create ${u.email}:`, error.message);
      continue;
    }

    const userId = data.user.id;
    console.log(`User created with ID: ${userId}. Inserting profile...`);
    
    // Insert into profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, full_name: u.name, role: u.role });
      
    if (profileError) {
      console.error(`Failed to insert profile for ${u.email}:`, profileError.message);
    } else {
      console.log(`Profile inserted successfully.`);
    }
  }
  
  console.log("Seeding complete.");
}

seed();
