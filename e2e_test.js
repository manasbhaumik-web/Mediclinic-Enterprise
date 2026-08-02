import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runE2ETest() {
  console.log("=== STARTING END-TO-END WORKFLOW TEST ===");

  try {
    // STEP 1: Registration
    console.log("\n[1] Registering New Patient...");
    const patientId = crypto.randomUUID();
    const { error: patientErr } = await supabase.from('patients').insert([{
      id: patientId,
      full_name: 'Workflow Test Patient',
      ic_number: `T-${Date.now()}`,
      gender: 'Male',
      dob: '1990-01-01',
      address: 'Test Address',
      phone: '011-9999999',
      panel_employer: 'None (Self-Pay)',
      drug_allergies: []
    }]);
    
    if (patientErr) throw new Error(`Registration failed: ${patientErr.message}`);
    console.log("✅ Patient registered successfully.");

    // STEP 2: Create Visit (Awaiting Consult)
    console.log("\n[2] Creating Visit (Awaiting Consult)...");
    const visitId = crypto.randomUUID();
    const { error: visitErr } = await supabase.from('visits').insert([{
      id: visitId,
      patient_id: patientId,
      status: 'Awaiting Consult',
      visit_date: new Date().toISOString().split('T')[0]
    }]);

    if (visitErr) throw new Error(`Visit creation failed: ${visitErr.message}`);
    console.log("✅ Visit created and added to Doctor Queue.");

    // STEP 3: Doctor Consultation & Prescription (Awaiting Dispensation)
    console.log("\n[3] Simulating Doctor Consultation...");
    const { error: soapErr } = await supabase.from('soap_notes').insert([{
      visit_id: visitId,
      subjective: 'Test symptom',
      clinical_notes: 'Test note'
    }]);
    if (soapErr) throw new Error(`SOAP notes failed: ${soapErr.message}`);
    
    const { error: rxErr } = await supabase.from('prescriptions').insert([{
      visit_id: visitId,
      drug_name: 'Paracetamol 500mg',
      quantity: 10,
      price_per_unit: 1.50
    }]);
    if (rxErr) throw new Error(`Prescription failed: ${rxErr.message}`);

    const { error: docUpdateErr } = await supabase.from('visits')
      .update({ status: 'Awaiting Dispensation', total_bill: 15.00 })
      .eq('id', visitId);
    if (docUpdateErr) throw new Error(`Status update failed: ${docUpdateErr.message}`);
    
    console.log("✅ Consultation completed. Patient routed to Pharmacy Queue.");

    // STEP 4: Pharmacist Dispensation (Awaiting Billing)
    console.log("\n[4] Simulating Pharmacy Dispensation...");
    const { error: pharmUpdateErr } = await supabase.from('visits')
      .update({ status: 'Awaiting Billing' })
      .eq('id', visitId);
    if (pharmUpdateErr) throw new Error(`Pharmacy update failed: ${pharmUpdateErr.message}`);
    
    console.log("✅ Medications dispensed. Patient routed to Billing Queue.");

    // STEP 5: Cashier Billing (Paid)
    console.log("\n[5] Simulating Payment Processing...");
    const { error: billUpdateErr } = await supabase.from('visits')
      .update({ status: 'Paid', paid_amount: 15.00, payment_method: 'Cash' })
      .eq('id', visitId);
    if (billUpdateErr) throw new Error(`Billing update failed: ${billUpdateErr.message}`);
    
    console.log("✅ Payment processed. Workflow complete!");
    console.log("\n🎉 END-TO-END TEST PASSED 🎉");

  } catch (err) {
    console.error(`\n❌ TEST FAILED:`, err.message);
  }
}

runE2ETest();
