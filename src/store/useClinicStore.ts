/**
 * Zustand Global Clinic State Store
 * Phase P2 Performance Optimization: Decouples global reactive state
 * from monolithic React Context re-renders.
 */

import { create } from 'zustand';
import { Patient, Visit, Appointment, UserRole } from '../types';
import { INITIAL_PATIENTS, MOCK_VISITS_QUEUE } from '../data';

export interface ClinicState {
  // Core Domain State
  patientsMap: Record<string, Patient>;
  visitsQueue: Visit[];
  completedVisits: Visit[];
  appointments: Appointment[];
  
  // UI & Active Context State
  activeVisitId: string | null;
  activePatientId: string | null;
  activeRole: UserRole | null;
  isSidebarOpen: boolean;
  searchGlobalQuery: string;

  // Actions
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

export const useClinicStore = create<ClinicState>((set) => ({
  patientsMap: INITIAL_PATIENTS.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<string, Patient>),
  
  visitsQueue: MOCK_VISITS_QUEUE,
  completedVisits: [],
  appointments: [],
  
  activeVisitId: null,
  activePatientId: null,
  activeRole: 'doctor',
  isSidebarOpen: true,
  searchGlobalQuery: '',

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
