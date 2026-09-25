const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://wdzkmvyiexpwjkcqwevq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkemttdnlpZXhwd2prY3F3ZXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NDcwMjAsImV4cCI6MjEwMDUyMzAyMH0.GRZd0xJRr0J5L938wpvA37wg6UJCr7ZNGWMf9XxGI3s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const patientsData = [
  {
    id: crypto.randomUUID(),
    full_name: 'Ahmad Zikrullah bin Mustaffa',
    ic_number: '940315-10-5123',
    gender: 'Male',
    dob: '1994-03-15',
    address: 'No 42, Jalan Subang Permai 3, Subang Jaya, 47500 Selangor',
    phone: '012-9841234',
    panel_employer: 'Petronas Panel',
    drug_allergies: ['Penicillin'],
    registered_date: new Date().toISOString(),
    vitals: { bp_systolic: 138, bp_diastolic: 88, heart_rate: 84, temperature: 38.2, respiratory_rate: 18 },
    subjective: 'Fever, chills, and sore throat for 2 days. Generalized body aches.'
  },
  {
    id: crypto.randomUUID(),
    full_name: 'Nur Farhana binti Kamaruddin',
    ic_number: '891120-14-6092',
    gender: 'Female',
    dob: '1989-11-20',
    address: 'Unit 12-A, Residency V, Jalan Klang Lama, 58200 Kuala Lumpur',
    phone: '017-3312984',
    panel_employer: 'Maybank Panel',
    drug_allergies: ['NSAID', 'Aspirin'],
    registered_date: new Date().toISOString(),
    vitals: { bp_systolic: 118, bp_diastolic: 76, heart_rate: 76, temperature: 36.7, respiratory_rate: 16 },
    subjective: 'Severe epigastric burning pain and acid reflux post meal.'
  },
  {
    id: crypto.randomUUID(),
    full_name: 'Chong Kah Seng',
    ic_number: '780614-08-5541',
    gender: 'Male',
    dob: '1978-06-14',
    address: '88, Lorong Bayu 4, Taman Connaught, 56000 Cheras, KL',
    phone: '016-4428901',
    panel_employer: 'AIA TPA',
    drug_allergies: [],
    registered_date: new Date().toISOString(),
    vitals: { bp_systolic: 145, bp_diastolic: 92, heart_rate: 92, temperature: 37.0, respiratory_rate: 18 },
    subjective: 'Occipital throbbing headache, blood pressure review request.'
  },
  {
    id: crypto.randomUUID(),
    full_name: 'Kavitha a/p Subramaniam',
    ic_number: '910802-05-5238',
    gender: 'Female',
    dob: '1991-08-02',
    address: 'No 15, Jalan Bukit Mewah 7, 43000 Kajang, Selangor',
    phone: '013-7721094',
    panel_employer: 'PMCare',
    drug_allergies: ['Sulfa'],
    registered_date: new Date().toISOString(),
    vitals: { bp_systolic: 110, bp_diastolic: 72, heart_rate: 74, temperature: 36.6, respiratory_rate: 15 },
    subjective: 'Productive cough with clear phlegm and chest tightness.'
  },
  {
    id: crypto.randomUUID(),
    full_name: 'Muhammad Hariz bin Azman',
    ic_number: '010425-10-6119',
    gender: 'Male',
    dob: '2001-04-25',
    address: 'B-08-04, Apartment Sri Meranti, Bandar Sri Damansara, 52200 KL',
    phone: '018-9123847',
    panel_employer: 'Self-Pay (Cash/Card)',
    drug_allergies: [],
    registered_date: new Date().toISOString(),
    vitals: { bp_systolic: 124, bp_diastolic: 80, heart_rate: 78, temperature: 37.4, respiratory_rate: 17 },
    subjective: 'Right ankle strain after futsal match, localized swelling.'
  },
  {
    id: crypto.randomUUID(),
    full_name: 'Tan Mei Ling',
    ic_number: '850912-07-5310',
    gender: 'Female',
    dob: '1985-09-12',
    address: '33, Jalan Green Lane, 11600 Georgetown, Pulau Pinang',
    phone: '012-4491023',
    panel_employer: 'Medkad',
    drug_allergies: ['Paracetamol'],
    registered_date: new Date().toISOString(),
    vitals: { bp_systolic: 122, bp_diastolic: 78, heart_rate: 72, temperature: 36.8, respiratory_rate: 16 },
    subjective: 'Allergic skin rash and intense itching on arms and neck.'
  },
  {
    id: crypto.randomUUID(),
    full_name: 'Venkatesh a/l Ramasamy',
    ic_number: '671205-10-5827',
    gender: 'Male',
    dob: '1967-12-05',
    address: '102, Jalan Tebrau Heights 2, 80250 Johor Bahru, Johor',
    phone: '019-7123984',
    panel_employer: 'HealthConnect TPA',
    drug_allergies: [],
    registered_date: new Date().toISOString(),
    vitals: { bp_systolic: 152, bp_diastolic: 96, heart_rate: 88, temperature: 36.9, respiratory_rate: 19 },
    subjective: 'Routine 3-month Type 2 Diabetes and Hypertension prescription refill.'
  },
  {
    id: crypto.randomUUID(),
    full_name: 'Nursyazwani binti Zainal',
    ic_number: '970130-14-5812',
    gender: 'Female',
    dob: '1997-01-30',
    address: 'No 7, Jalan Setiawangsa 11, Taman Setiawangsa, 54200 KL',
    phone: '011-28391024',
    panel_employer: 'Petronas Panel',
    drug_allergies: ['Penicillin'],
    registered_date: new Date().toISOString(),
    vitals: { bp_systolic: 114, bp_diastolic: 74, heart_rate: 80, temperature: 37.8, respiratory_rate: 16 },
    subjective: 'Dysuria and burning sensation during urination for 2 days.'
  },
  {
    id: crypto.randomUUID(),
    full_name: 'Lee Chee Keong',
    ic_number: '820518-10-6435',
    gender: 'Male',
    dob: '1982-05-18',
    address: '55, Jalan USJ 11/3D, UEP Subang Jaya, 47620 Selangor',
    phone: '016-2281930',
    panel_employer: 'Self-Pay (Cash/Card)',
    drug_allergies: [],
    registered_date: new Date().toISOString(),
    vitals: { bp_systolic: 126, bp_diastolic: 82, heart_rate: 76, temperature: 36.5, respiratory_rate: 16 },
    subjective: 'Pre-employment health check-up and blood screening request.'
  },
  {
    id: crypto.randomUUID(),
    full_name: 'Aisyah Humaira binti Razak',
    ic_number: '181010-10-8842',
    gender: 'Female',
    dob: '2018-10-10',
    address: 'No 18, Jalan Putra Heights 4/1, 47650 Subang Jaya, Selangor',
    phone: '019-3382910',
    panel_employer: 'AIA TPA',
    drug_allergies: [],
    registered_date: new Date().toISOString(),
    vitals: { bp_systolic: 102, bp_diastolic: 68, heart_rate: 105, temperature: 38.6, respiratory_rate: 22 },
    subjective: 'Pediatric high fever 38.6°C, runny nose, and loss of appetite for 24h.'
  }
];

async function seed() {
  console.log('Seeding 10 registered & triaged patients into Supabase...');

  for (const item of patientsData) {
    const patientObj = {
      id: item.id,
      full_name: item.full_name,
      ic_number: item.ic_number,
      gender: item.gender,
      dob: item.dob,
      address: item.address,
      phone: item.phone,
      panel_employer: item.panel_employer,
      drug_allergies: item.drug_allergies,
      registered_date: item.registered_date
    };

    const { error: pErr } = await supabase.from('patients').insert([patientObj]);
    if (pErr) {
      console.error('Patient insert error:', item.full_name, pErr.message);
      continue;
    }
    console.log(`✓ Inserted patient: ${item.full_name} (${item.id})`);

    // Insert Visit
    const visitId = crypto.randomUUID();
    const visitObj = {
      id: visitId,
      patient_id: item.id,
      status: 'Awaiting Consult',
      visit_date: new Date().toISOString().split('T')[0],
      total_bill: 0,
      panel_claimed: 0,
      paid_amount: 0
    };

    const { error: vErr } = await supabase.from('visits').insert([visitObj]);
    if (vErr) {
      console.error('Visit insert error:', vErr.message);
      continue;
    }
    console.log(`  └─ ✓ Triaged visit created: ${visitId}`);

    // Insert SOAP Note with Vitals
    const soapObj = {
      visit_id: visitId,
      subjective: item.subjective,
      bp_systolic: item.vitals.bp_systolic,
      bp_diastolic: item.vitals.bp_diastolic,
      heart_rate: item.vitals.heart_rate,
      temperature: item.vitals.temperature,
      respiratory_rate: item.vitals.respiratory_rate
    };
    const { error: sErr } = await supabase.from('soap_notes').insert([soapObj]);
    if (sErr) console.warn('  └─ SOAP note insert warning:', sErr.message);
    else console.log('  └─ ✓ Triaged vitals captured cleanly.');
  }

  console.log('\n🎉 Successfully seeded 10 registered & triaged patients into Supabase!');
}

seed().catch(err => console.error(err));
