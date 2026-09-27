/**
 * Zustand Global Clinic State Store
 * Phase P2 Performance Optimization: Decouples global reactive state
 * from monolithic React Context re-renders.
 */

import { create } from 'zustand';
import { Patient, Visit, Appointment, UserRole } from '../types';
import { INITIAL_PATIENTS, MOCK_VISITS_QUEUE } from '../data';
import { multiTenantManager, ClinicBranchTenant, SUPPORTED_BRANCH_TENANTS } from '../lib/multiTenantManager';

export interface ClinicState {
  // Core Domain State
  patientsMap: Record<string, Patient>;
  visitsQueue: Visit[];
  completedVisits: Visit[];
  appointments: Appointment[];
  
  // UI & Multi-Branch Context State
  activeBranchId: string;
  activeBranch: ClinicBranchTenant;
  activeVisitId: string | null;
  activePatientId: string | null;
  activeRole: UserRole | null;
  isSidebarOpen: boolean;
  searchGlobalQuery: string;

  // Actions
  setActiveBranchId: (tenantId: string) => void;
  setPatients: (patients: Patient[]) => void;
  upsertPatient: (patient: Patient) => void;
  setVisitsQueue: (visits: Visit[]) => void;
  upsertVisit: (visit: Visit) => void;
  setActiveVisitId: (id: string | null) => void;
  setActivePatientId: (id: string | null) => void;
  setActiveRole: (role: UserRole | null) => void;
  setSearchGlobalQuery: (query: string) => void;
  toggleSidebar: () => void;
}

const getInitialBranchId = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('mediclinic_active_branch_v1');
    if (saved && SUPPORTED_BRANCH_TENANTS.some(b => b.tenantId === saved)) {
      multiTenantManager.setActiveTenantId(saved);
      return saved;
    }
  }
  return 'HQ_KL_MAIN';
};

const initialBranchId = getInitialBranchId();

export const useClinicStore = create<ClinicState>((set) => ({
  patientsMap: INITIAL_PATIENTS.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<string, Patient>),
  
  visitsQueue: MOCK_VISITS_QUEUE,
  completedVisits: [],
  appointments: [],
  
  activeBranchId: initialBranchId,
  activeBranch: SUPPORTED_BRANCH_TENANTS.find(b => b.tenantId === initialBranchId) || SUPPORTED_BRANCH_TENANTS[0],
  activeVisitId: null,
  activePatientId: null,
  activeRole: 'doctor',
  isSidebarOpen: true,
  searchGlobalQuery: '',

  setActiveBranchId: (tenantId: string) => {
    try {
      multiTenantManager.setActiveTenantId(tenantId);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('mediclinic_active_branch_v1', tenantId);
      }
    } catch (e) {
      console.warn('Failed to switch tenant ID in manager:', e);
    }

    const branch = SUPPORTED_BRANCH_TENANTS.find(b => b.tenantId === tenantId) || SUPPORTED_BRANCH_TENANTS[0];
    set({ activeBranchId: tenantId, activeBranch: branch });
  },

  setPatients: (patients) => set((state) => {
    const newMap = { ...state.patientsMap };
    patients.forEach(p => { newMap[p.id] = p; });
    return { patientsMap: newMap };
  }),

  upsertPatient: (patient) => set((state) => ({
    patientsMap: { ...state.patientsMap, [patient.id]: patient }
  })),

  setVisitsQueue: (visits) => set({ visitsQueue: visits }),

  upsertVisit: (visit) => set((state) => {
    const exists = state.visitsQueue.some(v => v.id === visit.id);
    let updatedQueue: Visit[];
    
    if (exists) {
      updatedQueue = state.visitsQueue.map(v => v.id === visit.id ? visit : v);
    } else {
      updatedQueue = [visit, ...state.visitsQueue];
    }

    const isCompleted = visit.status === 'Paid' || visit.status === 'Cancelled';
    const activeQueue = updatedQueue.filter(v => v.status !== 'Paid' && v.status !== 'Cancelled');
    const completedList = isCompleted 
      ? [visit, ...state.completedVisits.filter(v => v.id !== visit.id)]
      : state.completedVisits;

    return {
      visitsQueue: activeQueue,
      completedVisits: completedList
    };
  }),

  setActiveVisitId: (id) => set({ activeVisitId: id }),
  setActivePatientId: (id) => set({ activePatientId: id }),
  setActiveRole: (role) => set({ activeRole: role }),
  setSearchGlobalQuery: (query) => set({ searchGlobalQuery: query }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
}));
