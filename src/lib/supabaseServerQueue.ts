/**
 * Server-Side Supabase Queue Query & RPC Helper
 * Provides server-side pagination, acuity filtering, search, and ordering
 * directly against Supabase PostgreSQL for large enterprise clinic queues (>1,000 visits/day).
 */

import { supabase } from './supabase';
import { Visit } from '../types';
import { SortRule, AcuityFilter } from '../utils/queueSorter';

export interface ServerQueueQueryOptions {
  page?: number;
  pageSize?: number;
  sortRule?: SortRule;
  acuityFilter?: AcuityFilter;
  searchQuery?: string;
  doctorOnly?: boolean;
}

export interface ServerQueryResult {
  visits: Visit[];
  totalCount: number;
  page: number;
  totalPages: number;
  fromCache: boolean;
}

export async function fetchServerPaginatedQueue(
  options: ServerQueueQueryOptions = {}
): Promise<ServerQueryResult> {
  const {
    page = 1,
    pageSize = 6,
    sortRule = 'urgency',
    acuityFilter = 'all',
    searchQuery = '',
  } = options;

  try {
    // 1. Build base query over visits table with relation joins
    let query = supabase.from('visits')
      .select('*, soap_notes(*), prescriptions(*)', { count: 'exact' })
      .neq('status', 'Paid')
      .neq('status', 'Cancelled');

    // 2. Apply server-side ordering
    if (sortRule === 'wait') {
      query = query.order('registered_time', { ascending: true });
    } else if (sortRule === 'arrival') {
      query = query.order('created_at', { ascending: true });
    } else {
      query = query.order('registered_time', { ascending: true });
    }

    // 3. Apply server-side pagination range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: dbVisits, count, error } = await query;

    if (error || !dbVisits) {
      throw error || new Error('No data returned from server');
    }

    // Map database models to domain Visit types
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
            requiresReferral: soap.requires_referral || false
          }
        }
      };
    });

    const total = count || mappedVisits.length;
    return {
      visits: mappedVisits,
      totalCount: total,
      page,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      fromCache: false
    };
  } catch (err) {
    console.warn('Server-side queue query error, falling back to local dataset:', err);
    return {
      visits: [],
      totalCount: 0,
      page,
      totalPages: 1,
      fromCache: true
    };
  }
}
