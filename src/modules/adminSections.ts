import {
  Users, Stethoscope, Pill, DollarSign, Activity, FileText, Settings, ShieldAlert, Server, Database, Globe2,
  TrendingUp, CalendarClock, FolderCheck,
} from 'lucide-react';
import type { AdminCategoryId, AdminSection, Bilingual, SettingsModuleKey } from './types';

/**
 * Every section of the admin console, in menu order. To add one: add it here and its screen to the
 * section map in `AdminModule.tsx`.
 */
export const ADMIN_SECTIONS = [
  // People
  { id: 'staff', label: { en: 'Staff Directory', bm: 'Direktori Staf' }, category: 'people', icon: Users, roleReq: 'all', settingsKey: 'staff' },
  { id: 'patients', label: { en: 'Patient Administration', bm: 'Pentadbiran Pesakit' }, category: 'people', icon: FolderCheck, roleReq: 'admin' },
  { id: 'leave', label: { en: 'Leave & Attendance', bm: 'Cuti & Kehadiran' }, category: 'people', icon: CalendarClock, roleReq: 'all' },

  // Clinical operations
  { id: 'medicine', label: { en: 'Inventory & Pharmacy', bm: 'Inventori & Farmasi' }, category: 'clinical', icon: Pill, roleReq: 'admin', settingsKey: 'medicine' },
  { id: 'equipment', label: { en: 'Equipment & Assets', bm: 'Peralatan & Aset' }, category: 'clinical', icon: Stethoscope, roleReq: 'admin', settingsKey: 'equipment' },
  { id: 'operations', label: { en: 'Operations Hub', bm: 'Hab Operasi' }, category: 'clinical', icon: Activity, roleReq: 'admin' },

  // Finance
  { id: 'billing', label: { en: 'Billing Desk', bm: 'Meja Pengebilan' }, category: 'finance', icon: DollarSign, roleReq: 'admin', settingsKey: 'billing' },
  { id: 'payroll', label: { en: 'Payroll', bm: 'Gaji & Imbuhan' }, category: 'finance', icon: DollarSign, roleReq: 'all' },
  { id: 'einvoice', label: { en: 'e-Invoice (LHDN)', bm: 'e-Invois (LHDN)' }, category: 'finance', icon: FileText, roleReq: 'admin' },
  { id: 'rcm', label: { en: 'Revenue', bm: 'Hasil & Kutipan' }, category: 'finance', icon: TrendingUp, roleReq: 'admin' },

  // Compliance and governance
  { id: 'moh', label: { en: 'MOH Compliance', bm: 'Kepatuhan KKM' }, category: 'compliance', icon: Globe2, roleReq: 'admin' },
  { id: 'reports', label: { en: 'Analytics Reports', bm: 'Laporan Analitik' }, category: 'compliance', icon: FileText, roleReq: 'admin', settingsKey: 'reports' },
  { id: 'security', label: { en: 'Security & Audit', bm: 'Keselamatan & Audit' }, category: 'compliance', icon: ShieldAlert, roleReq: 'admin' },

  // Platform
  { id: 'architecture', label: { en: 'System Status', bm: 'Status Sistem' }, category: 'platform', icon: Server, roleReq: 'admin' },
  { id: 'integrations', label: { en: 'Integrations', bm: 'Integrasi Sistem' }, category: 'platform', icon: Database, roleReq: 'admin' },
  { id: 'settings', label: { en: 'Console Settings', bm: 'Tetapan Konsol' }, category: 'platform', icon: Settings, roleReq: 'admin' },
] as const satisfies readonly AdminSection[];

export type AdminTab = (typeof ADMIN_SECTIONS)[number]['id'];

export const ADMIN_CATEGORIES: readonly { id: AdminCategoryId; label: Bilingual }[] = [
  { id: 'people', label: { en: 'People', bm: 'Kakitangan' } },
  { id: 'clinical', label: { en: 'Clinical Ops', bm: 'Operasi Klinikal' } },
  { id: 'finance', label: { en: 'Finance', bm: 'Kewangan' } },
  { id: 'compliance', label: { en: 'Compliance', bm: 'Pematuhan' } },
  { id: 'platform', label: { en: 'Platform', bm: 'Platform' } },
];

/** The sections this person may see: HR is kept out of admin-only ones, and a switched-off clinic module drops its section. */
export function visibleAdminSections(
  userRole: 'admin' | 'hr',
  clinicModules: Record<SettingsModuleKey, boolean>,
): readonly AdminSection[] {
  return ADMIN_SECTIONS.filter((s) => {
    if (s.roleReq === 'admin' && userRole !== 'admin') return false;
    if ('settingsKey' in s && !clinicModules[s.settingsKey]) return false;
    return true;
  });
}
