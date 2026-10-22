import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReceiptData } from '../domain/receipt';

const money = (n: number) => `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

const LEFT = 14;
const RIGHT = 196;

/** Draws a receipt from ReceiptData (see domain/receipt) and downloads it. Everything printed comes from the data passed in. */
export function downloadReceiptPdf(r: ReceiptData): void {
  const doc = new jsPDF();

  // Clinic header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(r.clinic.name, LEFT, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  let y = 26;
  const headerLines = [
    r.clinic.branch,
    ...doc.splitTextToSize(r.clinic.address, 100),
    r.clinic.phone && `Tel: ${r.clinic.phone}`,
    r.clinic.licenseNo && `KKM licence: ${r.clinic.licenseNo}`,
  ].filter(Boolean) as string[];
  for (const line of headerLines) { doc.text(line, LEFT, y); y += 5; }

  // Receipt title block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text('RECEIPT', RIGHT, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.text(r.receiptNo ?? 'Summary copy', RIGHT, 27, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text(when(r.issuedAt), RIGHT, 33, { align: 'right' });

  y = Math.max(y, 38) + 4;
  doc.setDrawColor(210, 210, 210);
  doc.line(LEFT, y, RIGHT, y);

  // Patient
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('RECEIVED FROM', LEFT, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(r.patientName, LEFT, y + 6);
  if (r.visitRef) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(`Visit ref: ${r.visitRef}`, RIGHT, y + 6, { align: 'right' });
  }

  // Items
  const body = r.itemised
    ? r.lines.map((l) => [l.description, String(l.quantity), money(l.unitPrice), money(l.amount)])
    : [['Itemised bill not available for this payment (taken before bills were stored).', '', '', money(r.total)]];

  autoTable(doc, {
    startY: y + 14,
    head: [['Description', 'Qty', 'Unit price', 'Amount']],
    body,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [45, 55, 72], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 34, halign: 'right' },
    },
  });

  // Totals
  // @ts-expect-error jspdf-autotable adds lastAutoTable to the document
  let ty: number = (doc.lastAutoTable?.finalY ?? y + 40) + 9;
  const row = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(bold ? 20 : 60, bold ? 20 : 60, bold ? 20 : 60);
    doc.text(label, 150, ty, { align: 'right' });
    doc.text(value, RIGHT, ty, { align: 'right' });
    ty += bold ? 8 : 6;
  };
  if (r.itemised) {
    if (r.discount > 0) row('Discount', `-${money(r.discount)}`);
    row('Subtotal', money(r.subtotal ?? 0));
    row(r.taxLabel ?? 'SST', money(r.tax ?? 0));
    doc.setDrawColor(200, 200, 200);
    doc.line(120, ty - 3, RIGHT, ty - 3);
    ty += 2;
  }
  row('Total', money(r.total), true);

  // Payment
  ty += 6;
  doc.setDrawColor(210, 210, 210);
  doc.line(LEFT, ty - 4, RIGHT, ty - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('PAYMENT', LEFT, ty + 2);
  ty += 9;
  const info = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(label, LEFT, ty);
    doc.text(value, RIGHT, ty, { align: 'right' });
    ty += 6;
  };
  info('Method', r.paymentMethod === 'Panel' ? 'Panel / TPA claim' : r.paymentMethod);
  if (r.paymentReference) info('Reference', r.paymentReference);
  info('Paid by patient', money(r.paidByPatient));
  if (r.panelClaimed > 0) {
    info(`Claimed from ${r.panelName ?? 'panel'}`, money(r.panelClaimed));
    if (r.glNumber) info('Guarantee letter (GL)', r.glNumber);
  }

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer-generated receipt. No signature is required.', LEFT, 283);
  if (!r.receiptNo) doc.text('Summary copy of a payment taken before receipts were numbered.', LEFT, 288);

  doc.save(`Receipt_${r.receiptNo ?? r.visitRef ?? 'copy'}.pdf`);
}
