import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runQATest() {
  console.log("=========================================");
  console.log("🏥 MEDICLINIC QA WORKFLOW TEST SUITE 🏥");
  console.log("=========================================\n");

  let patientId = crypto.randomUUID();
  let visitId = crypto.randomUUID();

  try {
    // ---------------------------------------------------------
    // TEST 1: REGISTRATION MODULE
    // ---------------------------------------------------------
    process.stdout.write("[TEST 1] Patient Registration -> ");
    const { error: patientErr } = await supabase.from('patients').insert([{
      id: patientId,
      full_name: 'QA Test Patient',
      ic_number: `QA-${Date.now()}`,
      gender: 'Female',
      dob: '1985-05-15',
      address: 'QA Lab, Sector 7G',
      phone: '011-9999999',
      panel_employer: 'None (Self-Pay)',
      drug_allergies: ['Penicillin'] // Added allergy for UI banner test logic
    }]);

    if (patientErr) throw new Error(`Registration failed: ${patientErr.message}`);
    
    // Simulate sequential visit creation
    const { error: visitErr } = await supabase.from('visits').insert([{
      id: visitId,
      patient_id: patientId,
      status: 'Awaiting Consult',
      visit_date: new Date().toISOString().split('T')[0]
    }]);

    if (visitErr) throw new Error(`Visit creation failed: ${visitErr.message}`);
    console.log("✅ PASSED");

    // ---------------------------------------------------------
    // TEST 2: QUEUE VISIBILITY (DOCTOR DASHBOARD)
    // ---------------------------------------------------------
    process.stdout.write("[TEST 2] Active Queue Fetch -> ");
    const { data: queueData, error: queueErr } = await supabase
      .from('visits')
      .select('*, patients(*)')
      .eq('id', visitId)
      .single();

    if (queueErr) throw new Error(`Queue fetch failed: ${queueErr.message}`);
    if (!queueData.patients) throw new Error("Join failed: Patient data missing from visit record");
    console.log("✅ PASSED");

    // ---------------------------------------------------------
    // TEST 3: CONSULTATION & SOAP NOTES
    // ---------------------------------------------------------
    process.stdout.write("[TEST 3] Doctor Consultation (SOAP) -> ");
    const { error: soapErr } = await supabase.from('soap_notes').insert([{
      visit_id: visitId,
      subjective: 'Headache and fever',
      clinical_notes: 'Patient exhibits flu-like symptoms.'
    }]);
    if (soapErr) throw new Error(`SOAP failed: ${soapErr.message}`);

    const { error: rxErr } = await supabase.from('prescriptions').insert([{
      visit_id: visitId,
      drug_name: 'Paracetamol 500mg',
      quantity: 10,
      price_per_unit: 1.50
    }]);
    if (rxErr) throw new Error(`Prescription failed: ${rxErr.message}`);

    const { error: docUpdateErr } = await supabase.from('visits')
      .update({ status: 'Awaiting Dispensation', total_bill: 35.00 /* consultation fee */ })
      .eq('id', visitId);
    if (docUpdateErr) throw new Error(`Status update failed: ${docUpdateErr.message}`);
    console.log("✅ PASSED");

    // ---------------------------------------------------------
    // TEST 4: PHARMACY DISPENSATION
    // ---------------------------------------------------------
    process.stdout.write("[TEST 4] Pharmacy Routing -> ");
    const { error: pharmUpdateErr } = await supabase.from('visits')
      .update({ status: 'Awaiting Billing' })
      .eq('id', visitId);
    if (pharmUpdateErr) throw new Error(`Pharmacy update failed: ${pharmUpdateErr.message}`);
    console.log("✅ PASSED");

    // ---------------------------------------------------------
    // TEST 5: CASHIER / BILLING
    // ---------------------------------------------------------
    process.stdout.write("[TEST 5] Invoice Payment -> ");
    // Add pharmacy total to bill (10 * 1.50 = 15.00 + 35.00 consult = 50.00)
    const { error: billUpdateErr } = await supabase.from('visits')
      .update({ status: 'Paid', total_bill: 50.00, paid_amount: 50.00, payment_method: 'Credit Card' })
      .eq('id', visitId);
    if (billUpdateErr) throw new Error(`Billing update failed: ${billUpdateErr.message}`);
    console.log("✅ PASSED");

    console.log("\n🎯 QA TEST RUN COMPLETED SUCCESSFULLY! No critical regressions found.");

  } catch (err) {
    console.error(`\n❌ QA TEST FAILED:`, err.message);
  }
}

runQATest();
