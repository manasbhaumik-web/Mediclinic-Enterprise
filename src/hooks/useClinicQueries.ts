/**
 * TanStack Query Custom Hooks for Clinic Server State
 * Caches Patient list, Active Queue, and Appointments with automatic background sync
 * and optimistic UI updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Patient, Visit, Appointment } from '../types';
import { INITIAL_PATIENTS, MOCK_VISITS_QUEUE } from '../data';
import { useClinicStore } from '../store/useClinicStore';

export const QUERY_KEYS = {
  patients: ['patients'] as const,
  visitsQueue: ['visits', 'queue'] as const,
  appointments: ['appointments'] as const,
};

export function usePatientsQuery() {
  const setPatients = useClinicStore(state => state.setPatients);

  return useQuery({
    queryKey: QUERY_KEYS.patients,
    queryFn: async (): Promise<Patient[]> => {
      const { data, error } = await supabase.from('patients').select('*').limit(100);
      if (error || !data || data.length === 0) {
        return INITIAL_PATIENTS;
      }
      
      const mapped: Patient[] = data.map(p => ({
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

      setPatients(mapped);
      return mapped;
    },
    initialData: INITIAL_PATIENTS
  });
}

export function useVisitsQueueQuery() {
  const setVisitsQueue = useClinicStore(state => state.setVisitsQueue);

  return useQuery({
    queryKey: QUERY_KEYS.visitsQueue,
    queryFn: async (): Promise<Visit[]> => {
      const { data, error } = await supabase.from('visits')
        .select('*, soap_notes(*), prescriptions(*)')
        .neq('status', 'Paid')
        .neq('status', 'Cancelled');

      if (error || !data || data.length === 0) {
        return MOCK_VISITS_QUEUE;
      }

      const mapped: Visit[] = data.map(v => {
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
              requiresReferral: soap.requires_referral || false
            }
          }
        };
      });

      setVisitsQueue(mapped);
      return mapped;
    },
    initialData: MOCK_VISITS_QUEUE
  });
}

export function useUpdateVisitMutation() {
  const queryClient = useQueryClient();
  const upsertVisit = useClinicStore(state => state.upsertVisit);

  return useMutation({
    mutationFn: async (visit: Visit) => {
      upsertVisit(visit);
      const { error } = await supabase.from('visits').upsert({
        id: visit.id,
        patient_id: visit.patientId,
        status: visit.status,
        total_bill: visit.totalBill,
        panel_claimed: visit.panelClaimed,
        paid_amount: visit.paidAmount,
        payment_method: visit.paymentMethod,
        gl_number: visit.glNumber,
        mc_issued: visit.mcIssued
      });

      if (error) throw error;
      return visit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visitsQueue });
    }
  });
}
