import React, { useState, useMemo } from 'react';
import { Visit, Patient } from '../../types';
import { generateBukuRacunEntries, exportBukuRacunCsv, BukuRacunEntry } from '../../domain/bukuRacun';
import { BookOpen, Search, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { StatStrip } from '../../components/ui/StationChrome';
import { maskICNumber } from '../../utils/piiMasker';
import { useAuth } from '../../context/AuthContext';

const COLUMNS: [string, string][] = [
  ['No.', ''],
  ['Date', 'Tarikh'],
  ['Patient and IC', 'Nama & No. K/P'],
  ['Poison dispensed', 'Nama ubat racun'],
  ['Group', 'Jadual'],
  ['Qty', 'Kuantiti'],
  ['Batch', 'No. batch'],
  ['Doctor and MMC', 'Doktor & No. MMC'],
  ['Purpose', 'Tujuan / diagnosis'],
];

interface BukuRacunRegisterProps {
  visits: Visit[];
  patientsMap: Record<string, Patient>;
  clinicName?: string;
}

export default function BukuRacunRegister({
  visits,
  patientsMap,
  clinicName = 'Mediclinic Cyberjaya'
}: BukuRacunRegisterProps) {
  const { showPII } = useAuth();
  const [filterSchedule, setFilterSchedule] = useState<'All' | 'Group B' | 'Group C'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Generate complete statutory records
  const allEntries = useMemo(() => {
    return generateBukuRacunEntries(visits, patientsMap, {
      categoryFilter: filterSchedule
    });
  }, [visits, patientsMap, filterSchedule]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return allEntries;
    const q = searchQuery.toLowerCase();
    return allEntries.filter(entry => {
      const matchName = entry.patientName.toLowerCase().includes(q);
      const matchDrug = entry.medicineName.toLowerCase().includes(q);
      const matchIc = entry.patientIc.toLowerCase().includes(q);
      const matchBatch = entry.batchNo.toLowerCase().includes(q);
      return matchName || matchDrug || matchIc || matchBatch;
    });
  }, [allEntries, searchQuery]);

  const handleExportCsv = () => {
    const csvContent = exportBukuRacunCsv(filteredEntries);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Buku_Racun_KKM_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadToast(`Exported ${filteredEntries.length} poison book records for MOH inspection audit.`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  const groupB = allEntries.filter((e) => e.poisonCategory.includes('Group B')).length;
  const groupC = allEntries.filter((e) => e.poisonCategory.includes('Group C')).length;

  return (
    <div className="space-y-4 animate-fadeIn font-sans">
      {/* Toast Notification */}
      {downloadToast && (
        <div role="status" className="fixed top-20 right-6 z-[100] bg-primary text-white px-5 py-3 border border-line rounded-none flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-200" aria-hidden="true" />
          <span className="text-xs font-bold">{downloadToast}</span>
        </div>
      )}

      {/* Register title and statute note */}
      <section aria-labelledby="buku-racun-title" className="bg-surface border border-line px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-[1_1_28rem]">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 id="buku-racun-title" className="text-xl font-bold tracking-tight text-ink">Buku Rekod Bekalan Racun</h2>
            <span className="px-2.5 py-0.5 bg-surface-strong text-accent text-xs font-bold">Akta Racun 1952, Section 24</span>
          </div>
          <p className="mt-1.5 text-sm text-muted leading-relaxed max-w-3xl">
            Statutory register of every Group B and Group C poison dispensed at the clinic. Entries are added automatically when a prescription is handed over.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="btn-primary min-h-12 px-6 text-sm"
          title="Export complete poison register in MOH audit CSV format"
        >
          <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
          Export KKM audit CSV
        </button>
      </section>

      <StatStrip
        label="Register figures"
        stats={[
          { label: 'Total records', value: filteredEntries.length, note: filterSchedule === 'All' && !searchQuery.trim() ? 'All dispensed poisons' : 'Matching the current filter' },
          { label: 'Group B', value: groupB, note: 'Prescription-only poisons' },
          { label: 'Group C', value: groupC, note: 'Pharmacy-supplied poisons' },
        ]}
      />

      <section aria-label="Register entries" className="bg-surface border border-line">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-line">
          <div className="relative flex-[1_1_20rem] max-w-md">
            <label htmlFor="buku-racun-search" className="sr-only">Search the register</label>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="buku-racun-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drug, patient IC or batch number"
              autoComplete="off"
              className="w-full min-h-11 pl-10 pr-3 bg-surface border border-line text-sm text-ink placeholder:text-muted rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-muted">Schedule</span>
            <div role="group" aria-label="Filter by poison group" className="flex border border-line bg-surface">
              {(['All', 'Group B', 'Group C'] as const).map((sch, i) => (
                <button
                  key={sch}
                  type="button"
                  aria-pressed={filterSchedule === sch}
                  onClick={() => setFilterSchedule(sch)}
                  className={`min-h-11 px-4 text-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${i > 0 ? 'border-l border-line' : ''} ${
                    filterSchedule === sch ? 'bg-primary text-white font-bold' : 'text-muted font-semibold hover:bg-surface-strong hover:text-ink'
                  }`}
                >
                  {sch}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-left border-collapse text-sm">
            <thead>
              <tr className="bg-surface-muted border-b border-line text-xs font-semibold text-muted align-bottom">
                {COLUMNS.map(([en, ms]) => (
                  <th key={en} scope="col" className="px-4 py-3 whitespace-nowrap">
                    {en}
                    {ms && <span className="block text-2xs font-medium">{ms}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <BookOpen className="w-8 h-8 mx-auto text-accent opacity-40 mb-2" aria-hidden="true" />
                    <p className="text-sm font-semibold text-ink">Tiada rekod bekalan racun</p>
                    <p className="text-xs text-muted mt-1">Dispensed Group B and Group C poisons will appear here automatically.</p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isGroupB = entry.poisonCategory.includes('Group B');
                  return (
                    <tr key={entry.serialNo} className="border-b border-line-subtle align-top hover:bg-surface-accent transition-colors">
                      <td className="px-4 py-3.5 font-bold tabular-nums text-accent">{entry.serialNo}</td>
                      <td className="px-4 py-3.5 tabular-nums whitespace-nowrap text-ink">{entry.date}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink">{entry.patientName}</div>
                        <div className="mt-0.5 text-xs text-muted tabular-nums">IC {showPII ? entry.patientIc : maskICNumber(entry.patientIc)}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink">{entry.medicineName}</div>
                        <div className="mt-0.5 text-xs text-muted">{entry.dosageInstructions}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold border ${isGroupB ? 'chip-danger' : 'chip-warn'}`}>
                          {isGroupB ? 'Group B' : 'Group C'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold tabular-nums text-ink">{entry.quantityDispensed}</td>
                      <td className="px-4 py-3.5 tabular-nums text-muted">{entry.batchNo}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink">{entry.prescribingDoctor}</div>
                        <div className="mt-0.5 text-xs text-muted tabular-nums">MMC {entry.doctorMmcNo || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-ink">{entry.diagnosis}</div>
                        <div className="mt-0.5 text-xs text-muted">Ref {entry.prescriptionRef}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-line text-xs text-muted">
          <span>Showing {filteredEntries.length} of {allEntries.length} records · Group B {groupB} · Group C {groupC}</span>
          {!showPII && <span>Patient IC numbers are masked unless sensitive data is shown for your role.</span>}
        </div>
      </section>
    </div>
  );
}
