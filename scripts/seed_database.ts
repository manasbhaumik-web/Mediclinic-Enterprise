import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wdzkmvyiexpwjkcqwevq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkemttdnlpZXhwd2prY3F3ZXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NDcwMjAsImV4cCI6MjEwMDUyMzAyMH0.GRZd0xJRr0J5L938wpvA37wg6UJCr7ZNGWMf9XxGI3s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const staffRecords = [
  { name: 'Dr. Sarah Tan', department: 'General Practice', role: 'Senior GP Physician', email: 'sarah.tan@mediclinic.my', salary_base: 14500, status: 'Active' },
  { name: 'Dr. Marcus Wong', department: 'Pediatrics', role: 'Consultant Pediatrician', email: 'marcus.wong@mediclinic.my', salary_base: 16800, status: 'Active' },
  { name: 'Dr. Aisha Rahman', department: 'Cardiology', role: 'Cardiovascular Specialist', email: 'aisha.rahman@mediclinic.my', salary_base: 18500, status: 'Active' },
  { name: 'Dr. Kenneth Lee', department: 'Dermatology', role: 'Dermatology Consultant', email: 'kenneth.lee@mediclinic.my', salary_base: 15500, status: 'Active' },
  { name: 'Dr. Priya Nair', department: 'Obstetrics & Gynaecology', role: 'O&G Specialist', email: 'priya.nair@mediclinic.my', salary_base: 17200, status: 'Active' },
  { name: 'Nurse Siti Aminah', department: 'Clinical Operations', role: 'Triage Nurse Supervisor', email: 'siti.aminah@mediclinic.my', salary_base: 5800, status: 'Active' },
  { name: 'Nurse Jessica Lim', department: 'Clinical Operations', role: 'Senior Clinical Nurse', email: 'jessica.lim@mediclinic.my', salary_base: 4900, status: 'Active' },
  { name: 'Nurse Azman Kassim', department: 'Emergency & Triage', role: 'Staff Nurse (Emergency)', email: 'azman.kassim@mediclinic.my', salary_base: 4500, status: 'Active' },
  { name: 'Nurse Chloe Tay', department: 'General Practice', role: 'Staff Nurse (Shift A)', email: 'chloe.tay@mediclinic.my', salary_base: 4300, status: 'Active' },
  { name: 'Pharm. Ahmad Razak', department: 'Pharmacy', role: 'Chief Pharmacist', email: 'ahmad.razak@mediclinic.my', salary_base: 9200, status: 'Active' },
  { name: 'Pharm. Nurul Huda', department: 'Pharmacy', role: 'Assistant Pharmacist', email: 'nurul.huda@mediclinic.my', salary_base: 4800, status: 'Active' },
  { name: 'Tech. Rajan Pillai', department: 'Diagnostics & Lab', role: 'Senior Lab Technician', email: 'rajan.pillai@mediclinic.my', salary_base: 5200, status: 'Active' },
  { name: 'Admin Mei Ling', department: 'Front Desk & Reception', role: 'Senior Patient Registrar', email: 'meiling@mediclinic.my', salary_base: 3800, status: 'Active' },
  { name: 'HR Officer Farida Yusof', department: 'Human Resources', role: 'HR & Payroll Specialist', email: 'farida.yusof@mediclinic.my', salary_base: 6500, status: 'Active' },
  { name: 'Admin Manager David Chen', department: 'Administration', role: 'Healthcare Operations Manager', email: 'david.chen@mediclinic.my', salary_base: 11500, status: 'Active' }
];

const equipmentRecords = [
  { name: 'Digital 12-Lead ECG Machine', type: 'Diagnostic', serial_number: 'SN-ECG-90812', status: 'Operational', next_maintenance: '2026-10-15' },
  { name: 'Ultrasound Diagnostic System', type: 'Imaging', serial_number: 'SN-US-77401', status: 'Operational', next_maintenance: '2026-11-20' },
  { name: 'Automated External Defibrillator (AED)', type: 'Diagnostic', serial_number: 'SN-AED-44102', status: 'Operational', next_maintenance: '2026-09-30' },
  { name: 'Vital Signs Patient Monitor', type: 'Diagnostic', serial_number: 'SN-MON-33921', status: 'Operational', next_maintenance: '2026-12-05' },
  { name: 'Digital Chest X-Ray Unit', type: 'Imaging', serial_number: 'SN-XRAY-10293', status: 'Operational', next_maintenance: '2026-10-30' },
  { name: 'Benchtop Autoclave Sterilizer', type: 'Sanitization', serial_number: 'SN-STER-88392', status: 'Operational', next_maintenance: '2026-10-10' },
  { name: 'Automated Hematology Analyzer', type: 'Laboratory', serial_number: 'SN-HEM-55201', status: 'Operational', next_maintenance: '2026-11-15' },
  { name: 'Clinical Biochemistry Analyzer', type: 'Laboratory', serial_number: 'SN-BIO-99201', status: 'Operational', next_maintenance: '2026-12-01' },
  { name: 'ENT Examination Workstation', type: 'Diagnostic', serial_number: 'SN-ENT-33102', status: 'Operational', next_maintenance: '2027-01-15' },
  { name: 'Slit Lamp Ophthalmoscope', type: 'Diagnostic', serial_number: 'SN-OPHTH-66491', status: 'Operational', next_maintenance: '2026-10-25' },
  { name: 'Dental Delivery Chair Unit', type: 'Surgical', serial_number: 'SN-DEN-88392', status: 'Operational', next_maintenance: '2026-11-05' },
  { name: 'Electric ICU Patient Bed System', type: 'Furniture', serial_number: 'SN-BED-11029', status: 'Operational', next_maintenance: '2027-04-05' },
  { name: 'Micro-Syringe Infusion Pump', type: 'Diagnostic', serial_number: 'SN-PUMP-44392', status: 'Operational', next_maintenance: '2026-10-10' },
  { name: 'Medical High-Suction Unit', type: 'Surgical', serial_number: 'SN-SUC-88219', status: 'Operational', next_maintenance: '2026-10-11' },
  { name: 'Heavy-Duty Nebulizer Compressor', type: 'Diagnostic', serial_number: 'SN-NEB-22910', status: 'Operational', next_maintenance: '2027-02-01' },
  { name: 'Vaccine Cold-Chain Refrigerator', type: 'Sanitization', serial_number: 'SN-FRIG-99302', status: 'Operational', next_maintenance: '2026-09-30' },
  { name: 'Medical Oxygen Concentrator 10L', type: 'Diagnostic', serial_number: 'SN-O2-33920', status: 'Operational', next_maintenance: '2026-11-14' },
  { name: 'Finger Pulse Oximeter Unit A', type: 'Diagnostic', serial_number: 'SN-OXY-88102', status: 'Operational', next_maintenance: '2027-03-01' },
  { name: 'Digital Blood Pressure Monitor B', type: 'Diagnostic', serial_number: 'SN-BPM-55392', status: 'Operational', next_maintenance: '2026-12-10' },
  { name: 'Refrigerated Laboratory Centrifuge', type: 'Laboratory', serial_number: 'SN-CENT-77291', status: 'Operational', next_maintenance: '2026-10-20' },
  { name: 'Binocular LED Microscope', type: 'Laboratory', serial_number: 'SN-MIC-11928', status: 'Operational', next_maintenance: '2027-03-22' },
  { name: 'Otoscope & Ophthalmoscope Wall Set', type: 'Diagnostic', serial_number: 'SN-OTO-99201', status: 'Operational', next_maintenance: '2027-01-10' },
  { name: 'Non-Contact Infrared Thermometer', type: 'Diagnostic', serial_number: 'SN-TEMP-44192', status: 'Operational', next_maintenance: '2026-11-05' },
  { name: 'Surgical LED Shadowless Light', type: 'Surgical', serial_number: 'SN-LIGHT-66392', status: 'Operational', next_maintenance: '2026-11-18' },
  { name: 'Emergency Crash Cart Trolley', type: 'Surgical', serial_number: 'SN-CART-22910', status: 'Operational', next_maintenance: '2026-10-01' },
  { name: 'MyKad Smart Card Optical Reader', type: 'IT/Office', serial_number: 'SN-MYKAD-99102', status: 'Operational', next_maintenance: '2027-04-01' },
  { name: 'Thermal Direct Receipt Printer', type: 'IT/Office', serial_number: 'SN-PRINT-44291', status: 'Operational', next_maintenance: '2027-03-15' },
  { name: 'Wireless Barcode Scanner Unit', type: 'IT/Office', serial_number: 'SN-BARCODE-88392', status: 'Operational', next_maintenance: '2027-06-20' },
  { name: 'Digital Uroflowmeter System', type: 'Diagnostic', serial_number: 'SN-URO-11209', status: 'Operational', next_maintenance: '2026-11-30' },
  { name: 'Hydraulic Patient Stretcher Trolley', type: 'Furniture', serial_number: 'SN-TROLLEY-77201', status: 'Operational', next_maintenance: '2027-01-25' }
];

const medicineRecords = [
  { drug_name: 'Paracetamol 500mg', category: 'Analgesics', stock_level: 1200, min_threshold: 300, price: 0.60 },
  { drug_name: 'Ibuprofen 400mg', category: 'Analgesics / NSAID', stock_level: 850, min_threshold: 200, price: 1.20 },
  { drug_name: 'Mefenamic Acid 500mg (Ponstan)', category: 'Analgesics / NSAID', stock_level: 600, min_threshold: 150, price: 1.80 },
  { drug_name: 'Tramadol HCl 50mg', category: 'Analgesics / Opioid', stock_level: 350, min_threshold: 100, price: 3.50 },
  { drug_name: 'Celecoxib 200mg (Celebrex)', category: 'Analgesics / COX-2', stock_level: 420, min_threshold: 100, price: 4.80 },
  { drug_name: 'Amoxicillin 500mg', category: 'Antibiotics', stock_level: 950, min_threshold: 250, price: 1.50 },
  { drug_name: 'Augmentin 625mg (Amox/Clav)', category: 'Antibiotics', stock_level: 540, min_threshold: 150, price: 5.50 },
  { drug_name: 'Azithromycin 250mg (Zithromax)', category: 'Antibiotics', stock_level: 380, min_threshold: 100, price: 6.20 },
  { drug_name: 'Ciprofloxacin 500mg', category: 'Antibiotics', stock_level: 490, min_threshold: 120, price: 2.90 },
  { drug_name: 'Doxycycline 100mg', category: 'Antibiotics', stock_level: 620, min_threshold: 150, price: 1.80 },
  { drug_name: 'Cephalexin 250mg', category: 'Antibiotics', stock_level: 700, min_threshold: 200, price: 1.40 },
  { drug_name: 'Metronidazole 400mg (Flagyl)', category: 'Antibiotics', stock_level: 450, min_threshold: 120, price: 1.60 },
  { drug_name: 'Cetirizine 10mg (Zyrtec)', category: 'Antihistamines', stock_level: 1100, min_threshold: 250, price: 0.80 },
  { drug_name: 'Loratadine 10mg (Claritin)', category: 'Antihistamines', stock_level: 980, min_threshold: 200, price: 0.90 },
  { drug_name: 'Chlorpheniramine 4mg (Piriton)', category: 'Antihistamines', stock_level: 1500, min_threshold: 400, price: 0.30 },
  { drug_name: 'Fexofenadine 180mg (Telfast)', category: 'Antihistamines', stock_level: 520, min_threshold: 100, price: 3.20 },
  { drug_name: 'Desloratadine 5mg (Aerius)', category: 'Antihistamines', stock_level: 460, min_threshold: 100, price: 2.90 },
  { drug_name: 'Amlodipine 5mg (Norvasc)', category: 'Antihypertensives', stock_level: 1300, min_threshold: 300, price: 1.10 },
  { drug_name: 'Losartan 50mg (Cozaar)', category: 'Antihypertensives', stock_level: 1150, min_threshold: 250, price: 1.40 },
  { drug_name: 'Perindopril Erbumine 4mg', category: 'Antihypertensives', stock_level: 890, min_threshold: 200, price: 2.20 },
  { drug_name: 'Metoprolol Tartrate 50mg', category: 'Antihypertensives', stock_level: 750, min_threshold: 150, price: 1.60 },
  { drug_name: 'Telmisartan 40mg (Micardis)', category: 'Antihypertensives', stock_level: 640, min_threshold: 120, price: 2.80 },
  { drug_name: 'Hydrochlorothiazide 25mg', category: 'Antihypertensives', stock_level: 810, min_threshold: 200, price: 0.70 },
  { drug_name: 'Metformin 500mg (Glucophage)', category: 'Antidiabetics', stock_level: 1600, min_threshold: 400, price: 0.50 },
  { drug_name: 'Gliclazide 80mg (Diamicron)', category: 'Antidiabetics', stock_level: 1050, min_threshold: 250, price: 1.10 },
  { drug_name: 'Sitagliptin 100mg (Januvia)', category: 'Antidiabetics', stock_level: 580, min_threshold: 100, price: 5.40 },
  { drug_name: 'Empagliflozin 10mg (Jardiance)', category: 'Antidiabetics', stock_level: 490, min_threshold: 100, price: 6.80 },
  { drug_name: 'Insulin Glargine 100 U/ml (Lantus)', category: 'Antidiabetics', stock_level: 210, min_threshold: 50, price: 48.00 },
  { drug_name: 'Omeprazole 20mg (Losec)', category: 'Gastrointestinal', stock_level: 1400, min_threshold: 300, price: 1.20 },
  { drug_name: 'Pantoprazole 40mg (Controloc)', category: 'Gastrointestinal', stock_level: 880, min_threshold: 200, price: 2.50 },
  { drug_name: 'Gaviscon Liquid 150ml', category: 'Gastrointestinal', stock_level: 320, min_threshold: 80, price: 22.50 },
  { drug_name: 'Metoclopramide 10mg (Maxolon)', category: 'Gastrointestinal', stock_level: 650, min_threshold: 150, price: 0.90 },
  { drug_name: 'Hyoscine Butylbromide 10mg', category: 'Gastrointestinal', stock_level: 790, min_threshold: 150, price: 1.40 },
  { drug_name: 'Salbutamol 100mcg (Ventolin)', category: 'Respiratory', stock_level: 450, min_threshold: 100, price: 18.50 },
  { drug_name: 'Budesonide 200mcg (Pulmicort)', category: 'Respiratory', stock_level: 280, min_threshold: 60, price: 42.00 },
  { drug_name: 'Bromhexine 8mg/5ml Elixir', category: 'Respiratory', stock_level: 390, min_threshold: 90, price: 12.80 },
  { drug_name: 'Acetylcysteine 600mg (Fluimucil)', category: 'Respiratory', stock_level: 680, min_threshold: 150, price: 3.20 },
  { drug_name: 'Montelukast 10mg (Singulair)', category: 'Respiratory', stock_level: 510, min_threshold: 100, price: 4.90 },
  { drug_name: 'Atorvastatin 20mg (Lipitor)', category: 'Cardiovascular', stock_level: 1500, min_threshold: 300, price: 2.10 },
  { drug_name: 'Simvastatin 20mg (Zocor)', category: 'Cardiovascular', stock_level: 1100, min_threshold: 250, price: 0.90 },
  { drug_name: 'Rosuvastatin 10mg (Crestor)', category: 'Cardiovascular', stock_level: 720, min_threshold: 150, price: 3.80 },
  { drug_name: 'Aspirin Low Dose 100mg', category: 'Cardiovascular', stock_level: 1800, min_threshold: 400, price: 0.40 },
  { drug_name: 'Clopidogrel 75mg (Plavix)', category: 'Cardiovascular', stock_level: 640, min_threshold: 120, price: 3.90 },
  { drug_name: 'Hydrocortisone 1% Cream 15g', category: 'Dermatological', stock_level: 420, min_threshold: 100, price: 8.50 },
  { drug_name: 'Mupirocin 2% Ointment (Bactroban)', category: 'Dermatological', stock_level: 310, min_threshold: 80, price: 16.20 },
  { drug_name: 'Clotrimazole 1% Cream (Canesten)', category: 'Dermatological', stock_level: 530, min_threshold: 120, price: 11.50 },
  { drug_name: 'Calamine Lotion 120ml', category: 'Dermatological', stock_level: 360, min_threshold: 90, price: 6.80 },
  { drug_name: 'Vitamin C 1000mg (Redoxon)', category: 'Vitamins & Minerals', stock_level: 890, min_threshold: 200, price: 1.50 },
  { drug_name: 'Vitamin D3 1000 IU', category: 'Vitamins & Minerals', stock_level: 740, min_threshold: 150, price: 1.20 },
  { drug_name: 'Neurobion Forte (Vit B1+B6+B12)', category: 'Vitamins & Minerals', stock_level: 1150, min_threshold: 250, price: 1.80 }
];

async function seedDatabase() {
  console.log('🚀 Seeding Database Records...');

  // 1. Staff
  console.log('1️⃣ Inserting 15 Staff Records...');
  for (const staff of staffRecords) {
    const { error } = await supabase.from('staff').insert([staff]);
    if (error && error.code !== '23505') console.error('Staff Insert Error:', error.message);
  }
  console.log('✅ Staff Seeding Finished.');

  // 2. Equipment
  console.log('2️⃣ Inserting 30 Equipment Records...');
  for (const eq of equipmentRecords) {
    const { error } = await supabase.from('equipment').insert([eq]);
    if (error && error.code !== '23505') console.error('Equipment Insert Error:', error.message);
  }
  console.log('✅ Equipment Seeding Finished.');

  // 3. Medicine
  console.log('3️⃣ Inserting 50 Types of Medicine Records...');
  for (const med of medicineRecords) {
    const { error } = await supabase.from('inventory').insert([med]);
    if (error && error.code !== '23505') console.error('Medicine Insert Error:', error.message);
  }
  console.log('✅ Medicine Seeding Finished.');

  console.log('🎉 Seed Execution Completed!');
}

seedDatabase().catch(console.error);
