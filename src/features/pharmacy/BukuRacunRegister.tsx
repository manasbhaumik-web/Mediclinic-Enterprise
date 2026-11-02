import React, { useState, useMemo } from 'react';
import { Visit, Patient } from '../../types';
import { generateBukuRacunEntries, exportBukuRacunCsv, BukuRacunEntry } from '../../domain/bukuRacun';
import { BookOpen, Search, Filter, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { maskICNumber } from '../../utils/piiMasker';
import { useAuth } from '../../context/AuthContext';

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

    setDownloadToast(`✓ Exported ${filteredEntries.length} poison book records for MOH inspection audit.`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  return (
    <div className="space-y-4 animate-fadeIn font-sans">
      {/* Toast Notification */}
      {downloadToast && (
        <div className="fixed top-20 right-6 z-[100] bg-emerald-900 text-white px-5 py-3 border border-emerald-400 rounded-none shadow-xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-300" />
          <span className="text-xs font-bold">{downloadToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-surface border border-line p-4 rounded-none flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-white flex items-center justify-center rounded-none">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-ink">Buku Rekod Bekalan Racun (Poison Book Register)</h2>
              <span className="font-mono text-2xs uppercase tracking-wider px-2 py-0.5 border border-indigo-300/40 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold rounded-none">
                KKM Akta Racun 1952
              </span>
            </div>
            <p className="text-xs text-muted font-medium mt-0.5">
              Statutory register of dispensed Category B &amp; C poisons under Section 24 of the Malaysian Poisons Act 1952.
            </p>
          </div>
        </div>

        {/* Export Button */}
        <button
          type="button"
          onClick={handleExportCsv}
          className="btn-primary flex items-center gap-2 rounded-none px-4 py-2 font-mono text-xs font-bold cursor-pointer"
          title="Export complete poison register in MOH audit CSV format"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export KKM Audit CSV</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface border border-line p-3 rounded-none flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drug, patient IC, or batch number..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface border border-line text-xs text-ink placeholder:text-muted rounded-none focus:outline-none focus:border-brand"
            />
          </div>

          {/* Schedule Filter */}
          <div className="flex items-center gap-1.5 border border-line p-1 bg-surface-muted/50 rounded-none">
            <Filter className="w-3.5 h-3.5 text-muted ml-1" />
            <span className="text-2xs font-mono font-bold text-muted mr-1">Schedule:</span>
            {(['All', 'Group B', 'Group C'] as const).map(sch => (
              <button
                key={sch}
                type="button"
                onClick={() => setFilterSchedule(sch)}
                className={`px-2 py-0.5 text-xs font-mono font-bold rounded-none transition-colors cursor-pointer ${
                  filterSchedule === sch
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {sch}
              </button>
            ))}
          </div>
        </div>

        {/* Counter Pill */}
        <div className="text-2xs font-mono text-muted flex items-center gap-2">
          <span>Total Records: <strong className="text-ink">{filteredEntries.length}</strong></span>
          <span>•</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
            Group B: {allEntries.filter(e => e.poisonCategory.includes('Group B')).length}
          </span>
          <span>•</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">
            Group C: {allEntries.filter(e => e.poisonCategory.includes('Group C')).length}
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-line rounded-none overflow-x-auto shadow-2xs">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-surface-muted/60 border-b border-line text-2xs uppercase tracking-wider font-mono text-muted">
              <th className="py-2.5 px-3 border-r border-line/60">No.</th>
              <th className="py-2.5 px-3 border-r border-line/60">Tarikh / Date</th>
              <th className="py-2.5 px-3 border-r border-line/60">Nama &amp; No. K/P Pesakit</th>
              <th className="py-2.5 px-3 border-r border-line/60">Nama Ubat Racun (Poison Drug)</th>
              <th className="py-2.5 px-3 border-r border-line/60">Jadual (Sch)</th>
              <th className="py-2.5 px-3 border-r border-line/60">Kuantiti</th>
              <th className="py-2.5 px-3 border-r border-line/60">No. Batch</th>
              <th className="py-2.5 px-3 border-r border-line/60">Doktor &amp; No. MMC</th>
              <th className="py-2.5 px-3">Tujuan / Diagnosis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-muted">
                  <BookOpen className="w-8 h-8 mx-auto text-muted/40 mb-2" />
                  <p className="font-bold text-sm text-ink">Tiada Rekod Bekalan Racun</p>
                  <p className="text-xs text-muted mt-0.5">Dispensed Group B and Group C poisons will automatically populate here.</p>
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => {
                const isGroupB = entry.poisonCategory.includes('Group B');
                return (
                  <tr key={entry.serialNo} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="py-2 px-3 border-r border-line/60 font-mono text-2xs font-bold text-muted">
                      {entry.serialNo}
                    </td>
                    <td className="py-2 px-3 border-r border-line/60 font-mono text-2xs whitespace-nowrap text-ink">
                      {entry.date}
                    </td>
                    <td className="py-2 px-3 border-r border-line/60">
                      <div className="font-bold text-ink">{entry.patientName}</div>
                      <div className="font-mono text-2xs text-muted">
                        IC: {showPII ? entry.patientIc : maskICNumber(entry.patientIc)}
                      </div>
                    </td>
                    <td className="py-2 px-3 border-r border-line/60 font-semibold text-ink">
                      <div>{entry.medicineName}</div>
                      <div className="text-2xs text-muted">{entry.dosageInstructions}</div>
                    </td>
                    <td className="py-2 px-3 border-r border-line/60">
                      <span className={`inline-block font-mono text-2xs font-bold px-1.5 py-0.5 rounded-none border ${
                        isGroupB
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300/60'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300/60'
                      }`}>
                        {isGroupB ? 'Group B' : 'Group C'}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-line/60 font-mono text-xs font-bold text-ink">
                      {entry.quantityDispensed}
                    </td>
                    <td className="py-2 px-3 border-r border-line/60 font-mono text-2xs text-muted">
                      {entry.batchNo}
                    </td>
                    <td className="py-2 px-3 border-r border-line/60">
                      <div className="font-medium text-ink">{entry.prescribingDoctor}</div>
                      <div className="font-mono text-2xs text-muted">MMC: {entry.doctorMmcNo || 'N/A'}</div>
                    </td>
                    <td className="py-2 px-3 text-muted text-xs">
                      <div>{entry.diagnosis}</div>
                      <div className="text-2xs text-muted/80">Ref: {entry.prescriptionRef}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
