import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import type { ReportTable } from '../../domain/reports';
import { downloadCsv, downloadPdf } from '../../utils/reportExport';

/** CSV and PDF downloads of the table a report is showing. Disabled when there is nothing to export. */
export default function ExportButtons({ table }: { table: ReportTable }) {
  const { clinic } = useSettings();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const empty = table.rows.length === 0;
  const base = 'text-2xs font-bold uppercase px-2.5 py-1 border border-line bg-white text-accent hover:bg-teal-50 flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const pdf = async () => {
    setBusy(true); setFailed(false);
    try { await downloadPdf(table, { name: clinic.name, branch: clinic.branch }); } catch { setFailed(true); } finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={`Export ${table.title}`}>
      <button type="button" className={base} disabled={empty} title={empty ? 'Nothing to export' : undefined} onClick={() => downloadCsv(table)}>
        <Download className="w-3 h-3" aria-hidden="true" /> CSV
      </button>
      <button type="button" className={base} disabled={empty || busy} title={empty ? 'Nothing to export' : undefined} onClick={() => void pdf()}>
        <FileText className="w-3 h-3" aria-hidden="true" /> {busy ? 'PDF…' : 'PDF'}
      </button>
      {failed && <span role="alert" className="text-2xs text-rose-700">PDF failed</span>}
    </div>
  );
}
