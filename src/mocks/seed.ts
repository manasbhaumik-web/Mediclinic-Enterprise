import { Patient, Visit } from '../types';
import { INITIAL_PATIENTS, MOCK_VISITS_QUEUE } from './clinicMocks';

/**
 * Demo records are merged into query results only when VITE_USE_MOCK_DATA=true.
 * The flag is a build-time constant, so production bundles drop the mock arrays.
 */
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const SEED_PATIENTS: Patient[] = USE_MOCK_DATA ? INITIAL_PATIENTS : [];
export const SEED_VISITS: Visit[] = USE_MOCK_DATA ? MOCK_VISITS_QUEUE : [];
