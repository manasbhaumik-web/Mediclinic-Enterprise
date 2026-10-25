import React, { useState, useMemo } from 'react';
import {
  Users, FolderCheck, Plus, Search, ShieldAlert, Clock, UserCheck,
  FileSpreadsheet, Edit3, Eye, FileText, ChevronRight, Activity,
  Filter, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { Patient, Visit, Language } from '../../types';
import { formatNric } from '../../utils/nric';
import { maskICNumber } from '../../utils/piiMasker';
import { calculatePatientAge } from '../../domain/patientAge';
import { useAuth } from '../../context/AuthContext';
import PatientDetailModal from './PatientDetailModal';
import PatientReportModal from './PatientReportModal';

interface PatientAdminViewProps {
  patientsList: Patient[];
  completedVisits: Visit[];
  activeVisits?: Visit[];
  onUpdatePatient: (p: Patient) => Promise<any> | void;
  onRegisterPatient?: () => void;
  activeLanguage?: Language;
}

type SortField = 'id' | 'name' | 'icNumber' | 'sponsor' | 'registeredDate' | 'visits' | 'spend';
type SortDir = 'asc' | 'desc';

export default function PatientAdminView({
  patientsList,
  completedVisits,
  activeVisits = [],
  onUpdatePatient,
  onRegisterPatient,
  activeLanguage = 'EN'
}: PatientAdminViewProps) {
  const isBM = activeLanguage === 'BM';
  const { showPII } = useAuth();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [panelFilter, setPanelFilter] = useState('ALL');
  const [allergyFilter, setAllergyFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('registeredDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Modals state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState<'profile' | 'visits' | 'medications' | 'billing' | 'dossier'>('profile');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportPreselectedPatientId, setReportPreselectedPatientId] = useState<string | null>(null);

  // Combine completed and active visits for patient metrics
  const allVisits = useMemo(() => {
    return [...completedVisits, ...activeVisits];
  }, [completedVisits, activeVisits]);

  // Aggregate metrics per patient
  const patientMetrics = useMemo(() => {
    const map: Record<string, { visitCount: number; lifetimeSpend: number; latestVisitDate: string | null }> = {};
    for (const p of patientsList) {
      map[p.id] = { visitCount: 0, lifetimeSpend: 0, latestVisitDate: null };
    }
    for (const v of allVisits) {
      if (map[v.patientId]) {
        map[v.patientId].visitCount += 1;
        map[v.patientId].lifetimeSpend += (v.totalBill || 0);
        if (!map[v.patientId].latestVisitDate || (v.date && v.date > map[v.patientId].latestVisitDate!)) {
          map[v.patientId].latestVisitDate = v.date;
        }
      }
    }
    return map;
  }, [patientsList, allVisits]);

  // Filter & sort patients
  const filteredPatients = useMemo(() => {
    return patientsList.filter((p) => {
      // Panel filter
      if (panelFilter !== 'ALL' && p.panelEmployer !== panelFilter) {
        return false;
      }

      // Allergy filter
      if (allergyFilter === 'ALLERGIC' && p.drugAllergies.length === 0) return false;
      if (allergyFilter === 'NKDA' && p.drugAllergies.length > 0) return false;

      // Text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const cleanIc = p.icNumber.replace(/-/g, '');
        const qClean = q.replace(/-/g, '');
        const matchName = p.fullName.toLowerCase().includes(q);
        const matchIc = p.icNumber.toLowerCase().includes(q) || cleanIc.includes(qClean);
        const matchId = p.id.toLowerCase().includes(q);
        const matchPhone = (p.phone || '').toLowerCase().includes(q);
        if (!matchName && !matchIc && !matchId && !matchPhone) return false;
      }

      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === 'id') {
        cmp = a.id.localeCompare(b.id);
      } else if (sortField === 'name') {
        cmp = a.fullName.localeCompare(b.fullName);
      } else if (sortField === 'icNumber') {
        cmp = a.icNumber.localeCompare(b.icNumber);
      } else if (sortField === 'sponsor') {
        cmp = a.panelEmployer.localeCompare(b.panelEmployer);
      } else if (sortField === 'registeredDate') {
        cmp = (a.registeredDate || '').localeCompare(b.registeredDate || '');
      } else if (sortField === 'visits') {
        cmp = (patientMetrics[a.id]?.visitCount || 0) - (patientMetrics[b.id]?.visitCount || 0);
      } else if (sortField === 'spend') {
        cmp = (patientMetrics[a.id]?.lifetimeSpend || 0) - (patientMetrics[b.id]?.lifetimeSpend || 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [patientsList, panelFilter, allergyFilter, searchTerm, sortField, sortDir, patientMetrics]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const openPatientModal = (patient: Patient, tab: 'profile' | 'visits' | 'medications' | 'billing' | 'dossier' = 'profile') => {
    setSelectedPatient(patient);
    setDetailInitialTab(tab);
    setDetailModalOpen(true);
  };

  const openReportModal = (patientId?: string) => {
    setReportPreselectedPatientId(patientId || 'ALL');
    setReportModalOpen(true);
  };

  return (
    <div className="bg-surface-muted border border-line rounded-none shadow-xs font-sans space-y-4 p-4">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 border border-brand/20 flex items-center justify-center text-accent">
            <FolderCheck className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="type-section-title text-ink font-bold">
              {isBM ? 'Pentadbiran & Rekod Pesakit' : 'Patient Administration & Records'}
            </h3>
            <p className="text-xs text-muted">
              {isBM
                ? 'Semak dan pinda profil pesakit, sejarah lawatan perubatan, ubat per lawatan, bayaran dan jana laporan.'
                : 'Review & manage patient dossiers, longitudinal clinical history, visit medications, billing ledger, and analytics.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="bg-primary/10 text-accent border border-brand/20 font-bold px-3 py-1.5 text-xs">
            {patientsList.length} {isBM ? 'Pesakit Terdaftar' : 'Registered Patients'}
          </span>

          <button
            type="button"
            onClick={() => openReportModal()}
            className="btn-outline-primary text-xs px-3.5 py-2 inline-flex items-center gap-2 font-bold uppercase tracking-wider"
          >
            <FileSpreadsheet className="w-4 h-4 text-accent" />
            <span>{isBM ? 'Jana Laporan' : 'Generate Reports'}</span>
          </button>

          {onRegisterPatient && (
            <button
              type="button"
              onClick={onRegisterPatient}
              className="btn-primary text-xs px-3.5 py-2 inline-flex items-center gap-2 font-bold uppercase tracking-wider shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isBM ? 'Daftar Pesakit' : 'Register Patient'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-accent absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search patients"
            placeholder={isBM ? 'Cari nama pesakit, No. IC (cth: 900101-14-5555), ID...' : 'Search by name, IC/Passport, ID or phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(/^[\d-]+$/.test(e.target.value) ? formatNric(e.target.value) : e.target.value)}
            className="w-full bg-surface border border-line pl-9 pr-3 py-2 text-xs text-ink placeholder-muted focus:border-brand outline-none"
          />
        </div>

        {/* Panel Filter */}
        <div>
          <select
            value={panelFilter}
            onChange={(e) => setPanelFilter(e.target.value)}
            className="w-full bg-surface border border-line px-3 py-2 text-xs text-ink focus:border-brand outline-none"
          >
            <option value="ALL">{isBM ? 'Semua Penaja / Majikan' : 'All Panel Sponsors'}</option>
            <option value="None (Self-Pay)">Self-Pay (None)</option>
            <option value="Petronas Panel">Petronas Panel</option>
            <option value="Maybank Panel">Maybank Panel</option>
            <option value="AIA TPA">AIA TPA</option>
            <option value="PMCare">PMCare</option>
            <option value="Medkad Sdn Bhd">Medkad Sdn Bhd</option>
          </select>
        </div>

        {/* Allergy Filter */}
        <div>
          <select
            value={allergyFilter}
            onChange={(e) => setAllergyFilter(e.target.value)}
            className="w-full bg-surface border border-line px-3 py-2 text-xs text-ink focus:border-brand outline-none"
          >
            <option value="ALL">{isBM ? 'Semua Status Alahan' : 'All Allergy Statuses'}</option>
            <option value="ALLERGIC">{isBM ? 'Mempunyai Alahan Ubat' : 'Has Drug Allergies'}</option>
            <option value="NKDA">{isBM ? 'Tiada Alahan (NKDA)' : 'No Known Allergies'}</option>
          </select>
        </div>
      </div>

      {/* PATIENTS TABLE */}
      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full text-xs text-left">
          <thead className="bg-surface-accent border-b border-line uppercase font-bold text-muted">
            <tr>
              <th className="px-3 py-2.5 cursor-pointer hover:text-ink" onClick={() => handleSort('id')}>
                <div className="flex items-center gap-1">
                  <span>ID</span>
                  {sortField === 'id' && (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                </div>
              </th>
              <th className="px-3 py-2.5 cursor-pointer hover:text-ink" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  <span>{isBM ? 'Nama Pesakit' : 'Patient Name'}</span>
                  {sortField === 'name' && (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                </div>
              </th>
              <th className="px-3 py-2.5">{isBM ? 'No. IC / Pasport' : 'IC / Passport'}</th>
              <th className="px-3 py-2.5">{isBM ? 'Jantina / Umur' : 'Gender & Age'}</th>
              <th className="px-3 py-2.5 cursor-pointer hover:text-ink" onClick={() => handleSort('sponsor')}>
                <div className="flex items-center gap-1">
                  <span>{isBM ? 'Penaja / Panel' : 'Panel Sponsor'}</span>
                  {sortField === 'sponsor' && (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                </div>
              </th>
              <th className="px-3 py-2.5">{isBM ? 'Alahan Ubat' : 'Drug Allergies'}</th>
              <th className="px-3 py-2.5 cursor-pointer hover:text-ink text-center" onClick={() => handleSort('visits')}>
                <div className="flex items-center justify-center gap-1">
                  <span>{isBM ? 'Lawatan' : 'Visits'}</span>
                  {sortField === 'visits' && (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                </div>
              </th>
              <th className="px-3 py-2.5 cursor-pointer hover:text-ink text-right" onClick={() => handleSort('spend')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{isBM ? 'Jumlah Bil (RM)' : 'Lifetime Spend'}</span>
                  {sortField === 'spend' && (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                </div>
              </th>
              <th className="px-3 py-2.5 text-center sticky right-0 bg-surface-accent shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]">
                {isBM ? 'Tindakan Pentadbir' : 'Administrative Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface">
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted font-medium">
                  {isBM ? 'Tiada rekod pesakit yang sepadan dengan carian.' : 'No patient records found matching your filters.'}
                </td>
              </tr>
            ) : (
              filteredPatients.map((p) => {
                const metrics = patientMetrics[p.id] || { visitCount: 0, lifetimeSpend: 0, latestVisitDate: null };
                const ageDetails = calculatePatientAge(p.dob);
                return (
                  <tr key={p.id} className="hover:bg-surface-accent/40 transition-colors">
                    <td className="px-3 py-2 font-mono text-accent text-xs font-bold">
                      {p.id}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => openPatientModal(p, 'profile')}
                        className="text-left font-bold text-xs text-ink hover:text-accent hover:underline block"
                      >
                        {p.fullName}
                      </button>
                      <span className="text-2xs text-muted font-mono">{p.phone}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-ink">
                      {maskICNumber(p.icNumber, showPII)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted whitespace-nowrap">
                      <span>{p.gender}</span> · <span className="font-medium text-ink">{ageDetails.displayAge}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 text-2xs font-bold border ${
                        p.panelEmployer === 'None (Self-Pay)'
                          ? 'chip-neutral'
                          : 'bg-primary/10 text-accent border-brand/20'
                      }`}>
                        {p.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : p.panelEmployer}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {p.drugAllergies.length === 0 ? (
                        <span className="text-muted text-2xs italic">NKDA</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {p.drugAllergies.map((a, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800 text-2xs font-bold px-1.5 py-0.2"
                            >
                              <ShieldAlert className="w-2.5 h-2.5 text-rose-600" />
                              <span>{a}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center font-mono font-bold text-accent">
                      {metrics.visitCount}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-ink">
                      RM {metrics.lifetimeSpend.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center sticky right-0 bg-surface shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)] whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openPatientModal(p, 'profile')}
                          className="bg-surface border border-line hover:border-brand text-ink hover:text-accent font-bold text-xs px-2.5 py-1 inline-flex items-center gap-1 transition-colors"
                          title={isBM ? 'Pinda Rekod Pesakit' : 'View / Edit Demographics'}
                        >
                          <Edit3 className="w-3 h-3 text-accent" />
                          <span>{isBM ? 'Pinda' : 'View / Edit'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openPatientModal(p, 'visits')}
                          className="bg-primary/10 hover:bg-primary/20 text-accent border border-brand/20 font-bold text-xs px-2.5 py-1 inline-flex items-center gap-1 transition-colors"
                          title={isBM ? 'Sejarah Klinikal & Ubat' : 'Clinical History & Prescriptions'}
                        >
                          <Clock className="w-3 h-3 text-accent" />
                          <span>{isBM ? 'Sejarah' : 'Clinical History'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openReportModal(p.id)}
                          className="bg-surface border border-line hover:border-brand text-muted hover:text-ink font-bold text-xs p-1 inline-flex items-center transition-colors"
                          title={isBM ? 'Jana Laporan Pesakit Ini' : 'Generate Report for this Patient'}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      <PatientDetailModal
        patient={selectedPatient}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onSavePatient={async (updatedPatient) => {
          await onUpdatePatient(updatedPatient);
          setSelectedPatient(updatedPatient);
        }}
        visits={allVisits}
        activeLanguage={activeLanguage}
        canEdit={true}
        initialTab={detailInitialTab}
        onGenerateReport={(patientId) => {
          setDetailModalOpen(false);
          openReportModal(patientId);
        }}
      />

      {/* REPORT MODAL */}
      <PatientReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        patientsList={patientsList}
        completedVisits={allVisits}
        activeLanguage={activeLanguage}
        preselectedPatientId={reportPreselectedPatientId}
      />
    </div>
  );
}
