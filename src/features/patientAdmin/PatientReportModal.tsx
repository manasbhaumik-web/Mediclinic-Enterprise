import React, { useState, useMemo } from 'react';
import {
  X, FileSpreadsheet, Download, Printer, Filter, Calendar,
  User, DollarSign, TrendingUp, ShieldCheck, CheckCircle2, ChevronDown,
  Search, FileText
} from 'lucide-react';
import { Patient, Visit, Language } from '../../types';
import { downloadCsv, downloadPdf } from '../../utils/reportExport';
import { ReportTable } from '../../domain/reports';
import { maskICNumber } from '../../utils/piiMasker';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

interface PatientReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientsList: Patient[];
  completedVisits: Visit[];
  activeLanguage?: Language;
  preselectedPatientId?: string | null;
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_BM = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

export default function PatientReportModal({
  isOpen,
  onClose,
  patientsList,
  completedVisits,
  activeLanguage = 'EN',
  preselectedPatientId = null
}: PatientReportModalProps) {
  const isBM = activeLanguage === 'BM';
  const { showPII } = useAuth();
  const { clinic } = useSettings();

  // Filters
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || 'ALL');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' or '01'..'12'
  const [selectedSponsor, setSelectedSponsor] = useState<string>('ALL'); // 'ALL', 'Self-Pay', 'Panel'
  const [searchQuery, setSearchQuery] = useState('');

  const months = isBM ? MONTH_NAMES_BM : MONTH_NAMES_EN;

  // Build patients lookup map
  const patientsMap = useMemo(() => {
    return patientsList.reduce<Record<string, Patient>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [patientsList]);

  // Filter encounters
  const filteredVisits = useMemo(() => {
    return completedVisits.filter((v) => {
      // Patient Filter
      if (selectedPatientId !== 'ALL' && v.patientId !== selectedPatientId) {
        return false;
      }

      // Year Filter
      if (selectedYear !== 'ALL') {
        const visitYear = v.date ? v.date.slice(0, 4) : '';
        if (visitYear !== selectedYear) return false;
      }

      // Month Filter
      if (selectedMonth !== 'ALL') {
        const visitMonth = v.date ? v.date.slice(5, 7) : '';
        if (visitMonth !== selectedMonth) return false;
      }

      // Sponsor Filter
      const p = patientsMap[v.patientId];
      if (selectedSponsor === 'Self-Pay') {
        if (v.panelClaimed > 0 || (p && p.panelEmployer !== 'None (Self-Pay)')) {
          if (v.paidAmount === 0) return false;
        }
      } else if (selectedSponsor === 'Panel') {
        if ((v.panelClaimed || 0) <= 0 && (!p || p.panelEmployer === 'None (Self-Pay)')) {
          return false;
        }
      }

      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pName = p ? p.fullName.toLowerCase() : '';
        const pIc = p ? p.icNumber.toLowerCase() : '';
        const diag = v.soap?.assessment?.description?.toLowerCase() || '';
        const icd = v.soap?.assessment?.icdCode?.toLowerCase() || '';
        const doc = v.doctorName?.toLowerCase() || '';
        if (!pName.includes(q) && !pIc.includes(q) && !diag.includes(q) && !icd.includes(q) && !doc.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [completedVisits, selectedPatientId, selectedYear, selectedMonth, selectedSponsor, searchQuery, patientsMap]);

  // Aggregate Metrics
  const summary = useMemo(() => {
    const totalEncounters = filteredVisits.length;
    const uniquePatientIds = new Set(filteredVisits.map((v) => v.patientId));
    const totalRevenue = filteredVisits.reduce((acc, v) => acc + (v.totalBill || 0), 0);
    const totalPanel = filteredVisits.reduce((acc, v) => acc + (v.panelClaimed || 0), 0);
    const totalSelfPay = filteredVisits.reduce((acc, v) => acc + (v.paidAmount || 0), 0);

    const totalRx = filteredVisits.reduce((acc, v) => acc + (v.soap?.plan?.prescription?.length || 0), 0);

    // Top ICD diagnoses
    const diagCount: Record<string, { code: string; desc: string; count: number }> = {};
    filteredVisits.forEach((v) => {
      const code = v.soap?.assessment?.icdCode || 'OTHER';
      const desc = v.soap?.assessment?.description || 'General Encounter';
      if (!diagCount[code]) {
        diagCount[code] = { code, desc, count: 0 };
      }
      diagCount[code].count += 1;
    });

    const topDiagnoses = Object.values(diagCount).sort((a, b) => b.count - a.count).slice(0, 3);

    return {
      totalEncounters,
      uniquePatients: uniquePatientIds.size,
      totalRevenue,
      totalPanel,
      totalSelfPay,
      totalRx,
      topDiagnoses
    };
  }, [filteredVisits]);

  if (!isOpen) return null;

  // Selected Patient Object
  const currentPatient = selectedPatientId !== 'ALL' ? patientsMap[selectedPatientId] : null;

  // Month label
  const monthLabel = selectedMonth === 'ALL'
    ? (isBM ? 'Sepanjang Tahun' : 'All Months')
    : months[parseInt(selectedMonth, 10) - 1];

  const reportPeriodLabel = selectedYear === 'ALL'
    ? (isBM ? 'Semua Rekod Sejarah' : 'All Historical Records')
    : `${monthLabel} ${selectedYear}`;

  const reportTitle = currentPatient
    ? `${isBM ? 'Laporan Klinikal & Kewangan' : 'Patient Clinical & Financial Report'}: ${currentPatient.fullName}`
    : `${isBM ? 'Laporan Bulanan & Tahunan Lawatan Pesakit' : 'Outpatient Encounters & Revenue Report'} (${reportPeriodLabel})`;

  // CSV Export
  const handleExportCsv = () => {
    const table: ReportTable = {
      title: reportTitle,
      subtitle: `Period: ${reportPeriodLabel} | Generated: ${new Date().toLocaleDateString('en-MY')}`,
      columns: [
        'Encounter Date',
        'Patient ID',
        'Patient Name',
        'IC / Passport',
        'Attending Doctor',
        'ICD-10 Code',
        'Diagnosis Description',
        'Prescription Summary',
        'Total Bill (RM)',
        'Panel Claimed (RM)',
        'Patient Paid (RM)',
        'Payment Method',
        'Receipt Ref'
      ],
      rows: filteredVisits.map((v) => {
        const p = patientsMap[v.patientId];
        const rxSummary = (v.soap?.plan?.prescription || []).map((rx) => `${rx.drugName} (${rx.quantity})`).join('; ');
        return [
          v.date || '',
          v.patientId,
          p ? p.fullName : 'Unknown',
          p ? p.icNumber : '',
          v.doctorName || 'Doctor',
          v.soap?.assessment?.icdCode || '',
          v.soap?.assessment?.description || '',
          rxSummary,
          (v.totalBill || 0).toFixed(2),
          (v.panelClaimed || 0).toFixed(2),
          (v.paidAmount || 0).toFixed(2),
          v.paymentMethod || 'Panel/Direct',
          v.receiptNumber || `INV-${v.id}`
        ];
      }),
      numeric: [8, 9, 10]
    };

    downloadCsv(table);
  };

  // PDF Export
  const handleExportPdf = async () => {
    const table: ReportTable = {
      title: reportTitle,
      subtitle: `Period: ${reportPeriodLabel}`,
      columns: [
        'Date',
        'Patient',
        'Doctor',
        'ICD-10 & Diagnosis',
        'Total (RM)',
        'Panel (RM)',
        'Paid (RM)',
        'Receipt'
      ],
      rows: filteredVisits.map((v) => {
        const p = patientsMap[v.patientId];
        return [
          v.date || '',
          p ? p.fullName : v.patientId,
          v.doctorName || 'Doctor',
          v.soap?.assessment?.description ? `${v.soap.assessment.icdCode || ''} ${v.soap.assessment.description}` : 'Consultation',
          (v.totalBill || 0).toFixed(2),
          (v.panelClaimed || 0).toFixed(2),
          (v.paidAmount || 0).toFixed(2),
          v.receiptNumber || v.id
        ];
      }),
      numeric: [4, 5, 6]
    };

    await downloadPdf(table, {
      name: clinic.name || 'Klinik Mediclinic Enterprise',
      branch: clinic.branch || 'Kuala Lumpur'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="patient-report-title" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="bg-surface border border-line rounded-none shadow-2xl max-w-6xl w-full h-[92vh] max-h-[900px] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-surface-muted border-b border-line px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 border border-brand/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 id="patient-report-title" className="type-section-title text-ink font-bold">
                {isBM ? 'Penjana Laporan Pesakit & Lawatan' : 'Patient Administration & Encounter Reports'}
              </h2>
              <p className="text-xs text-muted">
                {isBM
                  ? 'Jana laporan terperinci mengikut pesakit, bulan, dan tahun dengan eksport rasmi CSV & PDF.'
                  : 'Generate granular analytics and audit summaries filtered by patient, month, and year.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn-outline-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isBM ? 'Eksport CSV' : 'Export CSV'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="btn-outline-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isBM ? 'Eksport PDF' : 'Export PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isBM ? 'Cetak' : 'Print'}</span>
            </button>
            <button
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-muted hover:text-ink hover:bg-surface-accent transition-colors ml-2"
              aria-label="Close patient report modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-surface border-b border-line p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Patient Selector */}
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
              {isBM ? 'Pesakit' : 'Patient Filter'}
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-surface border border-line px-2.5 py-1.5 text-xs text-ink focus:border-brand outline-none"
            >
              <option value="ALL">{isBM ? 'Semua Pesakit Terdaftar' : 'All Registered Patients'}</option>
              {patientsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.id})
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
              {isBM ? 'Tahun' : 'Year'}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-surface border border-line px-2.5 py-1.5 text-xs text-ink focus:border-brand outline-none font-mono"
            >
              <option value="ALL">{isBM ? 'Semua Tahun' : 'All Years'}</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
              {isBM ? 'Bulan' : 'Month'}
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-surface border border-line px-2.5 py-1.5 text-xs text-ink focus:border-brand outline-none"
            >
              <option value="ALL">{isBM ? 'Semua Bulan (Setahun Penuh)' : 'All Months (Full Year)'}</option>
              <option value="01">{months[0]} (01)</option>
              <option value="02">{months[1]} (02)</option>
              <option value="03">{months[2]} (03)</option>
              <option value="04">{months[3]} (04)</option>
              <option value="05">{months[4]} (05)</option>
              <option value="06">{months[5]} (06)</option>
              <option value="07">{months[6]} (07)</option>
              <option value="08">{months[7]} (08)</option>
              <option value="09">{months[8]} (09)</option>
              <option value="10">{months[9]} (10)</option>
              <option value="11">{months[10]} (11)</option>
              <option value="12">{months[11]} (12)</option>
            </select>
          </div>

          {/* Sponsor Category */}
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
              {isBM ? 'Kategori Bayaran' : 'Billing Category'}
            </label>
            <select
              value={selectedSponsor}
              onChange={(e) => setSelectedSponsor(e.target.value)}
              className="w-full bg-surface border border-line px-2.5 py-1.5 text-xs text-ink focus:border-brand outline-none"
            >
              <option value="ALL">{isBM ? 'Semua (Panel & Sendiri)' : 'All (Panel & Self-Pay)'}</option>
              <option value="Panel">{isBM ? 'Panel Korporat Sahaja' : 'Corporate Panel Only'}</option>
              <option value="Self-Pay">{isBM ? 'Bayaran Sendiri Sahaja' : 'Self-Pay Direct Only'}</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">
              {isBM ? 'Carian Teks' : 'Keyword Search'}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isBM ? 'Nama, IC, diagnosis...' : 'Name, IC, diagnosis...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-line pl-8 pr-2.5 py-1.5 text-xs text-ink focus:border-brand outline-none"
              />
            </div>
          </div>
        </div>

        {/* SUMMARY KPI CARDS */}
        <div className="bg-surface-muted border-b border-line px-5 py-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="bg-surface border border-line p-2.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted block">
              {isBM ? 'Jumlah Lawatan' : 'Total Encounters'}
            </span>
            <span className="text-base font-mono font-bold text-ink mt-0.5 block">
              {summary.totalEncounters}
            </span>
          </div>

          <div className="bg-surface border border-line p-2.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted block">
              {isBM ? 'Pesakit Unik' : 'Unique Patients'}
            </span>
            <span className="text-base font-mono font-bold text-accent mt-0.5 block">
              {summary.uniquePatients}
            </span>
          </div>

          <div className="bg-surface border border-line p-2.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted block">
              {isBM ? 'Jumlah Kutipan' : 'Total Revenue'}
            </span>
            <span className="text-base font-mono font-bold text-ink mt-0.5 block">
              RM {summary.totalRevenue.toFixed(2)}
            </span>
          </div>

          <div className="bg-surface border border-line p-2.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted block">
              {isBM ? 'Tuntutan Panel' : 'Panel Claims'}
            </span>
            <span className="text-base font-mono font-bold text-accent mt-0.5 block">
              RM {summary.totalPanel.toFixed(2)}
            </span>
          </div>

          <div className="bg-surface border border-line p-2.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted block">
              {isBM ? 'Bayaran Kendiri' : 'Self-Pay Paid'}
            </span>
            <span className="text-base font-mono font-bold text-emerald-600 mt-0.5 block">
              RM {summary.totalSelfPay.toFixed(2)}
            </span>
          </div>

          <div className="bg-surface border border-line p-2.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted block">
              {isBM ? 'Item Ubat' : 'Medications Dispensed'}
            </span>
            <span className="text-base font-mono font-bold text-ink mt-0.5 block">
              {summary.totalRx} {isBM ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="overflow-x-auto border border-line bg-surface">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-accent border-b border-line uppercase font-bold text-muted sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5">{isBM ? 'Tarikh' : 'Date'}</th>
                  <th className="px-3 py-2.5">{isBM ? 'Pesakit' : 'Patient'}</th>
                  <th className="px-3 py-2.5">{isBM ? 'No. IC' : 'IC Number'}</th>
                  <th className="px-3 py-2.5">{isBM ? 'Doktor & Bilik' : 'Doctor & Room'}</th>
                  <th className="px-3 py-2.5">{isBM ? 'Diagnosis (ICD-10)' : 'Diagnosis (ICD-10)'}</th>
                  <th className="px-3 py-2.5">{isBM ? 'Preskripsi' : 'Prescriptions'}</th>
                  <th className="px-3 py-2.5 text-right">{isBM ? 'Panel (RM)' : 'Panel (RM)'}</th>
                  <th className="px-3 py-2.5 text-right">{isBM ? 'Bayar (RM)' : 'Paid (RM)'}</th>
                  <th className="px-3 py-2.5 text-right">{isBM ? 'Jumlah (RM)' : 'Total (RM)'}</th>
                  <th className="px-3 py-2.5 text-center">{isBM ? 'Kaedah' : 'Method'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-surface font-medium">
                {filteredVisits.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-muted">
                      <p className="font-bold text-sm text-ink mb-1">
                        {isBM ? 'Tiada rekod dijumpai mengikut tapisan.' : 'No encounter records found for the selected filter.'}
                      </p>
                      <p className="text-xs">
                        {isBM ? 'Cuba ubah pilihan bulan, tahun atau pesakit di atas.' : 'Try adjusting the patient, month, or year selectors above.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredVisits.map((v, i) => {
                    const p = patientsMap[v.patientId];
                    return (
                      <tr key={v.id || i} className="hover:bg-surface-accent/40 transition-colors">
                        <td className="px-3 py-2 font-mono text-muted whitespace-nowrap">
                          {v.date || '-'}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-bold text-ink block">
                            {p ? p.fullName : v.patientId}
                          </span>
                          <span className="text-2xs font-mono text-accent">ID: {v.patientId}</span>
                        </td>
                        <td className="px-3 py-2 font-mono text-muted whitespace-nowrap">
                          {p ? maskICNumber(p.icNumber, showPII) : '-'}
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-ink block">{v.doctorName || 'Attending Physician'}</span>
                          {v.roomId && <span className="text-2xs text-muted font-mono">{v.roomId}</span>}
                        </td>
                        <td className="px-3 py-2 max-w-xs">
                          {v.soap?.assessment?.icdCode && (
                            <span className="font-mono text-2xs font-bold text-accent bg-surface-accent border border-line px-1.5 py-0.2 mr-1">
                              {v.soap.assessment.icdCode}
                            </span>
                          )}
                          <span className="text-ink">{v.soap?.assessment?.description || '-'}</span>
                        </td>
                        <td className="px-3 py-2 text-2xs text-muted max-w-xs">
                          {(v.soap?.plan?.prescription || []).map((rx) => rx.drugName).join(', ') || '-'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-accent">
                          {(v.panelClaimed || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-ink">
                          {(v.paidAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-ink">
                          {(v.totalBill || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 bg-surface-accent border border-line text-2xs font-bold">
                            {v.paymentMethod || (v.panelClaimed > 0 ? 'Panel' : 'Cash')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-surface-muted border-t border-line px-5 py-3 flex items-center justify-between text-xs text-muted">
          <span>
            {isBM
              ? `Menunjukkan ${filteredVisits.length} rekod perundingan klinikal`
              : `Displaying ${filteredVisits.length} outpatient encounter records`}
          </span>
          <span className="font-mono text-2xs">
            {reportPeriodLabel} • Klinik Mediclinic Enterprise
          </span>
        </div>
      </div>
    </div>
  );
}
