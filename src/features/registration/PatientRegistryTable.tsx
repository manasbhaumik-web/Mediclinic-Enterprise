import React from 'react';
import type { SortKey } from './types';
import { FolderCheck, Plus, Search, ShieldAlert, Clock, UserCheck, Edit3, FileSpreadsheet, Eye } from 'lucide-react';
import { formatNric } from '../../utils/nric';
import { maskICNumber } from '../../utils/piiMasker';
import { Patient, Visit, UserRole, Language } from '../../types';

interface PatientRegistryTableProps {
  totalPatientCount: number;
  setActiveSubTab: React.Dispatch<React.SetStateAction<'queue' | 'form' | 'registry'>>;
  setRegistrationStep: React.Dispatch<React.SetStateAction<'id_check' | 'details'>>;
  patientRegistrySearch: string;
  setPatientRegistrySearch: React.Dispatch<React.SetStateAction<string>>;
  sortHeader: (key: SortKey, label: string, align?: 'left' | 'right') => React.JSX.Element;
  sortedResults: Patient[];
  showPII: boolean;
  triageQueue: Visit[];
  handleCreateTicket: (patient: Patient) => void;
  userRole?: UserRole;
  onOpenPatientDetail?: (patient: Patient, initialTab?: 'profile' | 'visits' | 'medications' | 'billing' | 'dossier') => void;
  onOpenReports?: (patientId?: string) => void;
  activeLanguage?: Language;
}

export default function PatientRegistryTable({
  totalPatientCount,
  setActiveSubTab,
  setRegistrationStep,
  patientRegistrySearch,
  setPatientRegistrySearch,
  sortHeader,
  sortedResults,
  showPII,
  triageQueue,
  handleCreateTicket,
  userRole,
  onOpenPatientDetail,
  onOpenReports,
  activeLanguage = 'EN'
}: PatientRegistryTableProps) {
  const isBM = activeLanguage === 'BM';
  const isAdmin = userRole === 'admin';

  return (
    <div className="bg-surface-muted border border-line rounded-none shadow-xs font-sans">
      <div className="p-3.5 space-y-3">
        
        {/* Header section with primary action button and total count badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-2.5 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 dark:bg-teal-900/40 border border-brand/20 flex items-center justify-center rounded-none">
              <FolderCheck className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="type-section-title text-ink font-sans">
                {isBM ? 'Pendaftaran & Rekod Pesakit' : 'Patient Registry'}
              </h3>
              <p className="text-xs text-muted font-sans font-medium">
                {isAdmin
                  ? (isBM ? 'Pengurusan rekod pesakit, sejarah klinikal, ubat per lawatan dan penjanaan laporan pentadbir.' : 'Manage patient records, longitudinal clinical history, visit prescriptions, and admin reports.')
                  : (isBM ? 'Cari rekod pesakit, semak alahan ubat dan mulakan lawatan klinikal.' : 'Search patient records, review medical allergies, and initiate clinical visits.')}
              </p>
            </div>
          </div>
    
          <div className="flex flex-wrap items-center gap-2.5 font-sans">
            <span className="bg-primary/10 text-accent dark:bg-teal-900/40 dark:text-teal-200 border border-brand/20 font-bold px-3 py-1.5 rounded-none text-xs font-sans">
              {totalPatientCount} {isBM ? 'Pesakit Terdaftar' : 'Registered Patients'}
            </span>

            {/* Admin Report Button */}
            {isAdmin && onOpenReports && (
              <button
                type="button"
                onClick={() => onOpenReports()}
                className="btn-outline-primary text-xs px-3.5 py-2 inline-flex items-center gap-2 font-bold uppercase tracking-wider"
              >
                <FileSpreadsheet className="w-4 h-4 text-accent" />
                <span>{isBM ? 'Jana Laporan' : 'Generate Reports'}</span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveSubTab('form');
                setRegistrationStep('id_check');
              }}
              className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 rounded-none font-sans transition-colors shadow-xs uppercase tracking-wider inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> {isBM ? 'Daftar Pesakit Baru' : 'Register New Patient'}
            </button>
          </div>
        </div>
        
        {/* Integrated Search Input & Guidance */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans">
          <div className="relative flex-1 max-w-lg w-full">
            <Search className="w-4 h-4 text-accent absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Search patients"
              placeholder={isBM ? 'Cari mengikut Nama, No. IC (cth: 900101-14-5555), atau ID...' : 'Search by Patient Name, NRIC (e.g. 900101-14-5555), or ID...'}
              value={patientRegistrySearch}
              onChange={(e) => setPatientRegistrySearch(/^[\d-]+$/.test(e.target.value) ? formatNric(e.target.value) : e.target.value)}
              className="w-full bg-surface border border-line rounded-none pl-9 pr-3 py-2 text-xs font-sans text-ink placeholder-primary/60 dark:placeholder-teal-400/60 focus:border-brand outline-none font-medium"
            />
          </div>
          <span className="text-2xs text-muted font-mono">
            {isBM ? 'Padanan separa disokong • Format IC automatik' : 'Partial matches supported • IC auto-format enabled'}
          </span>
        </div>
        
        {/* Scannable Patient Table */}
        <div className="overflow-x-auto border border-line rounded-none font-sans">
          <table className="w-full text-xs text-left font-sans">
            <thead className="bg-surface-accent border-b border-line font-sans">
              <tr className="text-muted font-sans text-xs uppercase tracking-wider font-bold">
                {sortHeader('id', 'ID')}
                {sortHeader('name', isBM ? 'Nama Pesakit' : 'Patient Name')}
                <th scope="col" className="px-3 py-2">{isBM ? 'No. IC / Pasport' : 'IC / Passport Number'}</th>
                {sortHeader('sponsor', isBM ? 'Penaja Panel' : 'Panel Sponsor')}
                <th scope="col" className="px-3 py-2">{isBM ? 'Alahan Ubat' : 'Drug Allergies'}</th>
                {sortHeader('registered', isBM ? 'Tarikh Daftar' : 'Date Registered', 'right')}
                <th scope="col" className="px-3 py-2 text-center sticky right-0 bg-surface-accent shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]">
                  {isAdmin ? (isBM ? 'Tindakan Pentadbir' : 'Administrative Actions') : (isBM ? 'Tindakan' : 'Action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle/50 dark:divide-teal-800/30 bg-surface font-sans">
              {sortedResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted font-sans font-medium">
                    {isBM ? 'Tiada rekod pesakit yang sepadan dengan carian anda.' : 'No patient records found matching your search term.'}
                  </td>
                </tr>
              ) : (
                sortedResults.map(p => (
                  <tr key={p.id} className="hover:bg-surface-accent/40 dark:hover:bg-night-800/40 transition-colors">
                    <td className="px-3 py-2 font-mono text-accent text-xs font-bold">
                      {p.id.includes('-') ? p.id.slice(0, 8).toUpperCase() : p.id}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onOpenPatientDetail?.(p, 'profile')}
                        className="font-bold text-xs capitalize text-ink block font-sans text-left hover:text-accent hover:underline"
                      >
                        {p.fullName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-ink">
                      {maskICNumber(p.icNumber, showPII)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2.5 py-1 rounded-none text-2xs font-sans font-bold uppercase tracking-wider border ${
                        p.panelEmployer === 'None (Self-Pay)' 
                          ? 'chip-neutral' 
                          : 'bg-primary/10 text-accent dark:bg-teal-900/40 dark:text-teal-200 border-brand/20 border-line'
                      }`}>
                        {p.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : p.panelEmployer}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {p.drugAllergies.length === 0
                        ? <span className="text-muted dark:text-slate-400 text-xs italic font-sans">{isBM ? 'Tiada alahan diketahui' : 'No known allergies'}</span>
                        : <div className="flex flex-wrap gap-1.5">
                            {p.drugAllergies.map((a, i) => (
                              <span key={i} className="inline-flex items-center justify-center gap-1 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 text-2xs font-sans font-bold px-2 py-0.5 rounded-none shadow-2xs">
                                <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                                <span>{a}</span>
                              </span>
                            ))}
                          </div>
                      }
                    </td>
                    <td className="px-3 py-2 text-muted font-mono text-xs text-right">
                      {p.registeredDate}
                    </td>
                    <td className="px-3 py-2 text-center sticky right-0 bg-surface shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)] whitespace-nowrap">
                      {isAdmin ? (
                        /* Admin Role Action Buttons: View/Edit Records, Clinical History, and Report (NO "Start Visit" button) */
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenPatientDetail?.(p, 'profile')}
                            className="bg-surface border border-line hover:border-brand text-ink hover:text-accent font-bold text-xs px-2.5 py-1.5 inline-flex items-center gap-1 transition-colors uppercase tracking-wider font-sans"
                            title={isBM ? 'Pinda Profil & Maklumat' : 'View / Edit Record'}
                          >
                            <Edit3 className="w-3.5 h-3.5 text-accent" />
                            <span>{isBM ? 'Pinda' : 'View / Edit'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenPatientDetail?.(p, 'visits')}
                            className="bg-primary/10 hover:bg-primary/20 text-accent border border-brand/20 font-bold text-xs px-2.5 py-1.5 inline-flex items-center gap-1 transition-colors uppercase tracking-wider font-sans"
                            title={isBM ? 'Sejarah Lawatan & Ubat' : 'Clinical History & Prescriptions'}
                          >
                            <Clock className="w-3.5 h-3.5 text-accent" />
                            <span>{isBM ? 'Sejarah' : 'Clinical History'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenReports?.(p.id)}
                            className="bg-surface border border-line hover:border-brand text-muted hover:text-ink font-bold text-xs p-1.5 inline-flex items-center transition-colors"
                            title={isBM ? 'Jana Laporan Pesakit' : 'Generate Patient Report'}
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
                          </button>
                        </div>
                      ) : (
                        /* Non-Admin (Receptionist / Front Desk): In triage queue indicator or Start Visit button */
                        triageQueue.some((v) => v.patientId === p.id) ? (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-accent bg-surface-accent border border-line">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" /> {isBM ? 'Dalam Giliran Triage' : 'In triage queue'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCreateTicket(p)}
                            className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-3.5 py-1.5 rounded-none font-sans transition-colors shadow-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                            aria-label={`Start visit for ${p.fullName}`}
                          >
                            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" /> {isBM ? 'Mula Lawatan' : 'Start Visit'}
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
