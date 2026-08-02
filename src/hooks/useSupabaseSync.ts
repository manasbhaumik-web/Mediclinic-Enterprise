import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Patient, Visit, Appointment } from '../types';

export function useSupabaseSync() {
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [visitsQueue, setVisitsQueue] = useState<Visit[]>([]);
  const [completedVisits, setCompletedVisits] = useState<Visit[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const syncData = async () => {
      try {
        // Fetch Patients (LIMIT 100 to avoid O(N) memory blowup)
        const { data: dbPatients, error: pErr } = await supabase.from('patients')
          .select('*')
          .order('registered_date', { ascending: false })
          .limit(100);
        if (!pErr && dbPatients && dbPatients.length > 0) {
          const mappedPatients: Patient[] = dbPatients.map(p => ({
            id: p.id,
            fullName: p.full_name,
            icNumber: p.ic_number,
            gender: p.gender,
            dob: p.dob,
            address: p.address || '',
            phone: p.phone,
            panelEmployer: p.panel_employer,
            drugAllergies: p.drug_allergies || [],
            registeredDate: p.registered_date
          }));
          setPatientsList(mappedPatients);
        }

        // Fetch active Visits with related SOAP notes and Prescriptions (filtering out Paid/Cancelled server-side)
        const { data: dbVisits, error: vErr } = await supabase.from('visits')
          .select('*, soap_notes(*), prescriptions(*)')
          .neq('status', 'Paid')
          .neq('status', 'Cancelled');
        if (!vErr && dbVisits && dbVisits.length > 0) {
          const mappedVisits: Visit[] = dbVisits.map(v => {
            const soap = v.soap_notes?.[0] || {};
            const rx = v.prescriptions || [];
            
            return {
              id: v.id,
              patientId: v.patient_id,
              date: v.visit_date || v.date || new Date().toISOString().split('T')[0],
              status: v.status,
              totalBill: Number(v.total_bill),
              panelClaimed: Number(v.panel_claimed),
              paidAmount: Number(v.paid_amount),
              paymentMethod: v.payment_method,
              glNumber: v.gl_number,
              mcIssued: v.mc_issued,
              registeredTime: v.registered_time ? Number(v.registered_time) : new Date(v.created_at).getTime(),
              soap: {
                subjective: soap.subjective || '',
                objective: {
                  bpSystolic: soap.bp_systolic || 0,
                  bpDiastolic: soap.bp_diastolic || 0,
                  heartRate: soap.heart_rate || 0,
                  temperature: soap.temperature || 0,
                  respiratoryRate: soap.respiratory_rate || 0
                },
                assessment: {
                  icdCode: soap.icd_code || '',
                  description: soap.description || '',
                  clinicalNotes: soap.clinical_notes || ''
                },
                plan: {
                  prescription: rx.map((r: any) => ({
                    id: r.id,
                    drugName: r.drug_name,
                    dosage: r.dosage,
                    dosageBM: r.dosage_bm,
                    frequency: r.frequency,
                    quantity: r.quantity,
                    pricePerUnit: r.price_per_unit,
                    expiryDate: r.expiry_date,
                    pillColor: r.pill_color,
                    capsuleStyle: r.capsule_style
                  })),
                  followUpWeeks: soap.follow_up_weeks || 0,
                  mcDays: soap.mc_days || 0,
                  requiresReferral: soap.requires_referral || false,
                  pharmacyMemo: soap.pharmacy_memo
                }
              }
            };
          });
          
          setVisitsQueue(mappedVisits.filter(v => v.status !== 'Paid' && v.status !== 'Cancelled'));
          setCompletedVisits(mappedVisits.filter(v => v.status === 'Paid' || v.status === 'Cancelled'));
        }
      } catch (err) {
        console.error('Supabase sync error', err);
      } finally {
        setIsSyncing(false);
      }
    };

    const fetchAppointments = async () => {
      try {
        const { data: dbAppointments, error } = await supabase.from('appointments')
          .select('*')
          .gte('appointment_time', new Date(new Date().setHours(0,0,0,0)).toISOString()) // Today onwards
          .order('appointment_time', { ascending: true })
          .limit(200);

        if (!error && dbAppointments) {
          const mappedAppointments: Appointment[] = dbAppointments.map(a => ({
            id: a.id,
            patientId: a.patient_id,
            patientName: a.patient_name,
            patientPhone: a.patient_phone,
            appointmentTime: a.appointment_time,
            durationMinutes: a.duration_minutes,
            purpose: a.purpose,
            status: a.status,
            doctorId: a.doctor_id,
            notes: a.notes,
            createdAt: a.created_at
          }));
          setAppointments(mappedAppointments);
        }
      } catch (err) {
        console.error('Failed to fetch appointments', err);
      }
    };

    syncData();
    fetchAppointments();

    const channel = supabase.channel('clinic_sync_' + Math.random().toString(36).substring(2, 9))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
        syncData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, () => {
        syncData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addPatientToDb = async (patient: Patient) => {
    setPatientsList(prev => [...prev, patient]);
    try {
      await supabase.from('patients').insert([{
        id: patient.id,
        full_name: patient.fullName,
        ic_number: patient.icNumber,
        gender: patient.gender,
        dob: patient.dob,
        phone: patient.phone,
        address: patient.address,
        panel_employer: patient.panelEmployer,
        drug_allergies: patient.drugAllergies
      }]);
    } catch (err) {
      console.error('Failed to insert patient', err);
    }
  };

  const searchPatients = async (query: string): Promise<Patient[]> => {
    if (!query || query.trim().length < 2) return [];
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`full_name.ilike.%${query}%,ic_number.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(20);
      
      if (error || !data) return [];
      
      return data.map(p => ({
        id: p.id,
        fullName: p.full_name,
        icNumber: p.ic_number,
        gender: p.gender,
        dob: p.dob,
        address: p.address || '',
        phone: p.phone,
        panelEmployer: p.panel_employer,
        drugAllergies: p.drug_allergies || [],
        registeredDate: p.registered_date
      }));
    } catch (err) {
      console.error('Search error', err);
      return [];
    }
  };

  const addVisitToDb = async (visit: Visit) => {
    setVisitsQueue(prev => [...prev, visit]);
    try {
      const { data: vData, error: vErr } = await supabase.from('visits').insert([{
        id: visit.id,
        patient_id: visit.patientId,
        status: visit.status,
        visit_date: new Date().toISOString(),
        total_bill: visit.totalBill || 0,
        panel_claimed: visit.panelClaimed || 0,
        paid_amount: visit.paidAmount || 0
      }]).select().single();

      if (vErr) throw vErr;

      if (vData && visit.soap) {
         await supabase.from('soap_notes').insert([{
           visit_id: vData.id,
           subjective: visit.soap.subjective || ''
         }]);
      }
    } catch (err) {
      console.error('Failed to insert visit', err);
    }
  };

  const updateVisitInDb = async (visit: Visit) => {
    if (visit.status === 'Paid' || visit.status === 'Cancelled') {
      setVisitsQueue(prev => prev.filter(v => v.id !== visit.id));
      setCompletedVisits(prev => [...prev, visit]);
    } else {
      setVisitsQueue(prev => prev.map(v => v.id === visit.id ? visit : v));
    }
    
    // Attempt update in Supabase
    try {
      if (visit.status === 'Cancelled') {
        await supabase.from('visits').delete().eq('id', visit.id);
        return; // Skip soap note updates since visit is deleted
      }

      await supabase.from('visits').update({
        status: visit.status,
        total_bill: visit.totalBill,
        panel_claimed: visit.panelClaimed,
        paid_amount: visit.paidAmount,
        payment_method: visit.paymentMethod,
        mc_issued: visit.mcIssued
      }).eq('id', visit.id);
      
      if (visit.soap) {
        // Upsert soap notes
        const { data: existingSoap } = await supabase.from('soap_notes').select('id').eq('visit_id', visit.id).maybeSingle();
        
        const soapData = {
          visit_id: visit.id,
          subjective: visit.soap.subjective,
          bp_systolic: visit.soap.objective.bpSystolic,
          bp_diastolic: visit.soap.objective.bpDiastolic,
          heart_rate: visit.soap.objective.heartRate,
          temperature: visit.soap.objective.temperature,
          respiratory_rate: visit.soap.objective.respiratoryRate,
          icd_code: visit.soap.assessment.icdCode,
          description: visit.soap.assessment.description,
          clinical_notes: visit.soap.assessment.clinicalNotes,
          follow_up_weeks: visit.soap.plan.followUpWeeks,
          mc_days: visit.soap.plan.mcDays,
          requires_referral: visit.soap.plan.requiresReferral,
          pharmacy_memo: visit.soap.plan.pharmacyMemo
        };
        
        if (existingSoap) {
          await supabase.from('soap_notes').update(soapData).eq('id', existingSoap.id);
        } else {
          await supabase.from('soap_notes').insert([soapData]);
        }
        
        // Handle prescriptions (delete and re-insert for simplicity)
        if (visit.soap.plan.prescription.length > 0) {
          await supabase.from('prescriptions').delete().eq('visit_id', visit.id);
          const rxData = visit.soap.plan.prescription.map(rx => ({
            visit_id: visit.id,
            drug_name: rx.drugName,
            dosage: rx.dosage,
            dosage_bm: rx.dosageBM,
            frequency: rx.frequency,
            quantity: rx.quantity,
            price_per_unit: rx.pricePerUnit,
            expiry_date: rx.expiryDate,
            pill_color: rx.pillColor,
            capsule_style: rx.capsuleStyle
          }));
          await supabase.from('prescriptions').insert(rxData);
        }
      }
    } catch (err) {
      console.error('Failed to update visit', err);
    }
  };

  const addAppointmentToDb = async (appointment: Omit<Appointment, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase.from('appointments').insert([{
        patient_id: appointment.patientId || null,
        patient_name: appointment.patientName,
        patient_phone: appointment.patientPhone,
        appointment_time: appointment.appointmentTime,
        duration_minutes: appointment.durationMinutes,
        purpose: appointment.purpose,
        status: appointment.status,
        doctor_id: appointment.doctorId || null,
        notes: appointment.notes || ''
      }]).select().single();
      
      if (error) throw error;
      
      const newAppointment: Appointment = {
        id: data.id,
        patientId: data.patient_id,
        patientName: data.patient_name,
        patientPhone: data.patient_phone,
        appointmentTime: data.appointment_time,
        durationMinutes: data.duration_minutes,
        purpose: data.purpose,
        status: data.status,
        doctorId: data.doctor_id,
        notes: data.notes,
        createdAt: data.created_at
      };
      setAppointments(prev => [...prev, newAppointment].sort((a,b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime()));
    } catch (err) {
      console.error('Failed to insert appointment', err);
      throw err;
    }
  };

  const updateAppointmentInDb = async (id: string, updates: Partial<Appointment>) => {
    try {
      const dbUpdates: any = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.appointmentTime !== undefined) dbUpdates.appointment_time = updates.appointmentTime;
      if (updates.durationMinutes !== undefined) dbUpdates.duration_minutes = updates.durationMinutes;
      if (updates.purpose !== undefined) dbUpdates.purpose = updates.purpose;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { error } = await supabase.from('appointments').update(dbUpdates).eq('id', id);
      if (error) throw error;
      
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    } catch (err) {
      console.error('Failed to update appointment', err);
      throw err;
    }
  };

  return {
    patientsList,
    setPatientsList,
    visitsQueue,
    setVisitsQueue,
    completedVisits,
    setCompletedVisits,
    addPatientToDb,
    addVisitToDb,
    updateVisitInDb,
    searchPatients,
    appointments,
    addAppointmentToDb,
    updateAppointmentInDb,
    isSyncing
  };
}
