/**
 * Row <-> domain mappers for Supabase tables (snake_case rows, camelCase domain types).
 */
import { Appointment, Patient, Visit } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function patientFromRow(p: any): Patient {
  return {
    id: p.id,
    fullName: p.full_name,
    icNumber: p.ic_number,
    gender: p.gender,
    dob: p.dob,
    address: p.address || '',
    phone: p.phone,
    panelEmployer: p.panel_employer,
    drugAllergies: p.drug_allergies || [],
    registeredDate: p.registered_date,
  };
}

export function patientToRow(patient: Patient) {
  return {
    id: patient.id,
    full_name: patient.fullName,
    ic_number: patient.icNumber,
    gender: patient.gender,
    dob: patient.dob,
    phone: patient.phone,
    address: patient.address,
    panel_employer: patient.panelEmployer,
    drug_allergies: patient.drugAllergies,
  };
}

/** Maps a `visits` row joined with `soap_notes(*)` and `prescriptions(*)`. */
export function visitFromRow(v: any): Visit {
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
        respiratoryRate: soap.respiratory_rate || 0,
      },
      assessment: {
        icdCode: soap.icd_code || '',
        description: soap.description || '',
        clinicalNotes: soap.clinical_notes || '',
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
          capsuleStyle: r.capsule_style,
        })),
        followUpWeeks: soap.follow_up_weeks || 0,
        mcDays: soap.mc_days || 0,
        requiresReferral: soap.requires_referral || false,
        pharmacyMemo: soap.pharmacy_memo,
      },
    },
  } as Visit;
}

export function soapToRow(visit: Visit) {
  const soap = visit.soap!;
  return {
    visit_id: visit.id,
    subjective: soap.subjective,
    bp_systolic: soap.objective.bpSystolic,
    bp_diastolic: soap.objective.bpDiastolic,
    heart_rate: soap.objective.heartRate,
    temperature: soap.objective.temperature,
    respiratory_rate: soap.objective.respiratoryRate,
    icd_code: soap.assessment.icdCode,
    description: soap.assessment.description,
    clinical_notes: soap.assessment.clinicalNotes,
    follow_up_weeks: soap.plan.followUpWeeks,
    mc_days: soap.plan.mcDays,
    requires_referral: soap.plan.requiresReferral,
    pharmacy_memo: soap.plan.pharmacyMemo,
  };
}

export function prescriptionsToRows(visit: Visit) {
  return visit.soap!.plan.prescription.map((rx) => ({
    visit_id: visit.id,
    drug_name: rx.drugName,
    dosage: rx.dosage,
    dosage_bm: rx.dosageBM,
    frequency: rx.frequency,
    quantity: rx.quantity,
    price_per_unit: rx.pricePerUnit,
    expiry_date: rx.expiryDate,
    pill_color: rx.pillColor,
    capsule_style: rx.capsuleStyle,
  }));
}

export function appointmentFromRow(a: any): Appointment {
  return {
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
    createdAt: a.created_at,
  };
}

export function appointmentToRow(app: Appointment) {
  return {
    id: app.id,
    patient_id: app.patientId,
    patient_name: app.patientName,
    patient_phone: app.patientPhone,
    appointment_time: app.appointmentTime,
    duration_minutes: app.durationMinutes,
    purpose: app.purpose,
    status: app.status,
    doctor_id: app.doctorId,
    notes: app.notes,
  };
}
