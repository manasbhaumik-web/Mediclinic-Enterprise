import React, { useState } from 'react';
import Pagination from '../../components/ui/Pagination';
import type { SortKey } from './types';
import { Plus, Search, ShieldAlert, Clock, UserCheck, Edit3, FileSpreadsheet, X } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [patientRegistrySearch]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedResults = sortedResults.slice(startIndex, startIndex + pageSize);
  return (
    <div className="space-y-4 font-sans">
      {/* Title block with the primary action */}
      <section aria-labelledby="registry-title" className="bg-surface border border-line px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-[1_1_26rem]">
          <h2 id="registry-title" className="text-xl font-bold tracking-tight text-ink">
            {isBM ? 'Rekod induk pesakit' : 'Patient master registry'}
          </h2>
          <p className="mt-1.5 text-sm text-muted leading-relaxed max-w-2xl">
            {isAdmin
              ? (isBM ? 'Urus rekod pesakit, sejarah klinikal, ubat setiap lawatan dan laporan pentadbir.' : 'Manage patient records, clinical history, visit prescriptions and admin reports.')
              : (isBM ? 'Cari rekod pesakit, semak alahan ubat dan mulakan lawatan klinikal.' : 'Search patient records, review drug allergies and start a clinical visit.')}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isAdmin && onOpenReports && (
            <button type="button" onClick={() => onOpenReports()} className="btn-secondary min-h-12 px-5 text-sm">
              <FileSpreadsheet className="w-4 h-4 text-accent" aria-hidden="true" />
              {isBM ? 'Jana laporan' : 'Generate reports'}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('form');
              setRegistrationStep('id_check');
            }}
            className="btn-primary min-h-12 px-6 text-sm"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            {isBM ? 'Daftar pesakit baharu' : 'Register new patient'}
          </button>
        </div>
      </section>

      <section aria-label={isBM ? 'Rekod pesakit' : 'Patient records'} className="bg-surface border border-line">
        {/* Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-line">
          <div className="relative flex-[1_1_22rem] max-w-xl">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search patients"
              placeholder={isBM ? 'Cari mengikut nama, No. IC (cth: 900101-14-5555) atau ID' : 'Search by name, NRIC (e.g. 900101-14-5555) or ID'}
              value={patientRegistrySearch}
              onChange={(e) => setPatientRegistrySearch(/^[d-]+$/.test(e.target.value) ? formatNric(e.target.value) : e.target.value)}
              autoComplete="off"
              className="w-full min-h-11 pl-10 pr-10 bg-surface border border-line rounded-none text-sm text-ink placeholder:text-muted outline-none focus:border-brand focus:ring-2 focus:ring-accent"
            />
            {patientRegistrySearch && (
              <button
                type="button"
                onClick={() => setPatientRegistrySearch('')}
                className="absolute right-0 top-0 w-11 h-11 flex items-center justify-center text-muted hover:text-ink cursor-pointer"
                aria-label={isBM ? 'Kosongkan carian' : 'Clear search'}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <span className="text-xs text-muted">{isBM ? 'Padanan separa disokong. Sengkang IC ditambah semasa menaip.' : 'Partial matches work. NRIC dashes are added as you type.'}</span>
        </div>

        {/* Patient table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[62rem] text-sm text-left border-separate border-spacing-0">
            <thead>
              <tr className="text-xs font-semibold text-muted [&>th]:bg-surface-muted [&>th]:border-b [&>th]:border-line [&>th]:whitespace-nowrap">
                {sortHeader('id', 'ID')}
                {sortHeader('name', isBM ? 'Nama pesakit' : 'Patient name')}
                <th scope="col" className="px-4 py-3.5">{isBM ? 'No. IC / pasport' : 'IC / passport'}</th>
                {sortHeader('sponsor', isBM ? 'Penaja panel' : 'Panel sponsor')}
                <th scope="col" className="px-4 py-3.5">{isBM ? 'Alahan ubat' : 'Drug allergies'}</th>
                {sortHeader('registered', isBM ? 'Tarikh daftar' : 'Registered')}
                <th scope="col" className="px-4 py-3.5 text-right sticky right-0 !bg-surface-muted">
                  {isAdmin ? (isBM ? 'Tindakan pentadbir' : 'Admin actions') : (isBM ? 'Tindakan' : 'Action')}
                </th>
              </tr>
            </thead>
            <tbody className="[&>tr>td]:border-b [&>tr>td]:border-line-subtle [&>tr:hover>td]:bg-surface-accent">
              {paginatedResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                    {isBM ? 'Tiada rekod pesakit yang sepadan dengan carian anda.' : 'No patient records found matching your search term.'}
                  </td>
                </tr>
              ) : (
                paginatedResults.map((p) => {
                  const inQueue = triageQueue.some((v) => v.patientId === p.id);
                  const selfPay = p.panelEmployer === 'None (Self-Pay)';
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-3.5 bg-surface tabular-nums font-bold text-accent">
                        {p.id.includes('-') ? p.id.slice(0, 8).toUpperCase() : p.id}
                      </td>
                      <td className="px-4 py-3.5 bg-surface">
                        <button
                          type="button"
                          onClick={() => onOpenPatientDetail?.(p, 'profile')}
                          className="text-sm font-semibold text-ink text-left hover:text-accent hover:underline cursor-pointer"
                        >
                          {p.fullName.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 bg-surface tabular-nums text-ink">{maskICNumber(p.icNumber, showPII)}</td>
                      <td className="px-4 py-3.5 bg-surface">
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold ${selfPay ? 'bg-surface-strong text-muted' : 'bg-surface-strong text-accent'}`}>
                          {selfPay ? (isBM ? 'Bayar sendiri' : 'Self-pay') : p.panelEmployer}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 bg-surface">
                        {p.drugAllergies.length === 0 ? (
                          <span className="text-xs text-muted">{isBM ? 'Tiada alahan diketahui' : 'No known allergies'}</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {p.drugAllergies.map((a, i) => (
                              <span key={i} className="chip-danger px-2 py-0.5 text-xs font-bold">
                                <ShieldAlert className="w-3 h-3 shrink-0" aria-hidden="true" />
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 bg-surface tabular-nums text-muted whitespace-nowrap">{p.registeredDate}</td>
                      <td className="px-4 py-3.5 bg-surface text-right sticky right-0 whitespace-nowrap shadow-[-8px_0_8px_-8px_rgba(15,60,76,0.15)]">
                        {isAdmin ? (
                          <div className="inline-flex items-center gap-2">
                            <button type="button" onClick={() => onOpenPatientDetail?.(p, 'profile')} className="btn-secondary px-3 text-xs" title={isBM ? 'Pinda profil & maklumat' : 'View / edit record'}>
                              <Edit3 className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                              {isBM ? 'Pinda' : 'View / edit'}
                            </button>
                            <button type="button" onClick={() => onOpenPatientDetail?.(p, 'visits')} className="btn-secondary px-3 text-xs" title={isBM ? 'Sejarah lawatan & ubat' : 'Clinical history & prescriptions'}>
                              <Clock className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                              {isBM ? 'Sejarah' : 'Clinical history'}
                            </button>
                            <button type="button" onClick={() => onOpenReports?.(p.id)} className="btn-secondary w-11 !px-0" aria-label={isBM ? 'Jana laporan pesakit' : 'Generate patient report'} title={isBM ? 'Jana laporan pesakit' : 'Generate patient report'}>
                              <FileSpreadsheet className="w-4 h-4 text-accent" aria-hidden="true" />
                            </button>
                          </div>
                        ) : inQueue ? (
                          <span className="inline-flex items-center gap-1.5 min-h-11 px-4 text-xs font-bold text-accent bg-surface-accent border border-line">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" /> {isBM ? 'Dalam giliran triaj' : 'In triage queue'}
                          </span>
                        ) : (
                          <button type="button" onClick={() => handleCreateTicket(p)} className="btn-primary px-4 text-xs" aria-label={`Start visit for ${p.fullName}`}>
                            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" /> {isBM ? 'Mula lawatan' : 'Start visit'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={sortedResults.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel={isBM ? 'pesakit' : 'patients'}
        />
      </section>
    </div>
  );
}
