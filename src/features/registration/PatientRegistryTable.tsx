import type { SortKey } from './types';
import { FolderCheck, Plus, Search, ShieldAlert, Clock, UserCheck } from 'lucide-react';
import { formatNric } from '../../utils/nric';
import { maskICNumber } from '../../utils/piiMasker';
import { Patient, Visit } from '../../types';

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
}

export default function PatientRegistryTable({ totalPatientCount, setActiveSubTab, setRegistrationStep, patientRegistrySearch, setPatientRegistrySearch, sortHeader, sortedResults, showPII, triageQueue, handleCreateTicket }: PatientRegistryTableProps) {
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
                Patient Registry
              </h3>
              <p className="text-xs text-muted font-sans font-medium">Search patient records, review medical allergies, and initiate clinical visits</p>
            </div>
          </div>
    
          <div className="flex flex-wrap items-center gap-3 font-sans">
            <span className="bg-primary/10 text-accent dark:bg-teal-900/40 dark:text-teal-200 border border-brand/20 font-bold px-3 py-1.5 rounded-none text-xs font-sans">
              {totalPatientCount} Registered Patients
            </span>
            <button
              onClick={() => {
                setActiveSubTab('form');
                setRegistrationStep('id_check');
              }}
              className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 rounded-none font-sans transition-colors shadow-xs uppercase tracking-wider inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Register New Patient
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
              placeholder="Search by Patient Name, NRIC (e.g. 900101-14-5555), or ID..."
              value={patientRegistrySearch}
              onChange={(e) => setPatientRegistrySearch(/^[\d-]+$/.test(e.target.value) ? formatNric(e.target.value) : e.target.value)}
              className="w-full bg-surface border border-line rounded-none pl-9 pr-3 py-2 text-xs font-sans text-ink placeholder-primary/60 dark:placeholder-teal-400/60 focus:border-brand outline-none font-medium"
            />
          </div>
          <span className="text-2xs text-muted font-mono">
            Partial matches supported • IC auto-format enabled
          </span>
        </div>
        
        {/* Scannable Patient Table */}
        <div className="overflow-x-auto border border-line rounded-none font-sans">
          <table className="w-full text-xs text-left font-sans">
            <thead className="bg-surface-accent border-b border-line font-sans">
              <tr className="text-muted font-sans text-xs uppercase tracking-wider font-bold">
                {sortHeader('id', 'ID')}
                {sortHeader('name', 'Patient Name')}
                <th scope="col" className="px-3 py-2">IC / Passport Number</th>
                {sortHeader('sponsor', 'Panel Sponsor')}
                <th scope="col" className="px-3 py-2">Drug Allergies</th>
                {sortHeader('registered', 'Date Registered', 'right')}
                <th scope="col" className="px-3 py-2 text-center sticky right-0 bg-surface-accent shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle/50 dark:divide-teal-800/30 bg-surface font-sans">
              {sortedResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted font-sans font-medium">
                    No patient records found matching your search term.
                  </td>
                </tr>
              ) : (
                sortedResults.map(p => (
                  <tr key={p.id} className="hover:bg-surface-accent/40 dark:hover:bg-night-800/40 transition-colors">
                    <td className="px-3 py-2 font-mono text-accent text-xs font-bold">
                      {p.id.includes('-') ? p.id.slice(0, 8).toUpperCase() : p.id}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-bold text-xs capitalize text-ink block font-sans">
                        {p.fullName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
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
                        ? <span className="text-muted dark:text-slate-400 text-xs italic font-sans">No known allergies</span>
                        : <div className="flex flex-wrap gap-1.5">
                            {p.drugAllergies.map((a, i) => (
                              <span key={i} className="inline-flex items-center justify-center gap-1 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 text-2xs font-sans font-bold px-2 py-0.5 rounded-none shadow-2xs">
                                <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                                <span>Allergy: {a}</span>
                              </span>
                            ))}
                          </div>
                      }
                    </td>
                    <td className="px-3 py-2 text-muted font-mono text-xs text-right">
                      {p.registeredDate}
                    </td>
                    <td className="px-3 py-2 text-center sticky right-0 bg-surface shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]">
                      {triageQueue.some((v) => v.patientId === p.id) ? (
                        <span className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-accent bg-surface-accent border border-line">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" /> In triage queue
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCreateTicket(p)}
                          className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-3.5 py-1.5 rounded-none font-sans transition-colors shadow-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                          aria-label={`Start visit for ${p.fullName}`}
                        >
                          <UserCheck className="w-3.5 h-3.5" aria-hidden="true" /> Start Visit
                        </button>
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
