import type { ClinicHeader } from '../domain/receipt';
import { ReportTable, slug, toCsv } from '../domain/reports';

const fileName = (table: ReportTable, ext: string) => `${slug(table.title) || 'report'}.${ext}`;

/** Downloads a report table as a CSV file (with a byte-order mark so Excel reads it as UTF-8). */
export function downloadCsv(table: ReportTable): void {
  const blob = new Blob(['﻿', toCsv(table)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName(table, 'csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const cellText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

/** Downloads a report table as a PDF with the clinic's name at the top. jsPDF is loaded only when this is used. */
export async function downloadPdf(table: ReportTable, clinic: Pick<ClinicHeader, 'name' | 'branch'>): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: table.columns.length > 6 ? 'landscape' : 'portrait' });
  const width = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text([clinic.name, clinic.branch].filter(Boolean).join(', ') || 'Clinic', 14, 16);
  doc.setFontSize(12);
  doc.text(table.title, 14, 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  if (table.subtitle) doc.text(table.subtitle, 14, 30);
  doc.text(`Generated ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour12: false })}`, width - 14, 16, { align: 'right' });

  const numeric = new Set(table.numeric ?? []);
  autoTable(doc, {
    startY: table.subtitle ? 35 : 30,
    head: [table.columns],
    body: table.rows.map((r) => r.map(cellText)),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [45, 55, 72], textColor: [255, 255, 255] },
    columnStyles: Object.fromEntries([...numeric].map((i) => [i, { halign: 'right' as const }])),
  });

  doc.save(fileName(table, 'pdf'));
}
