import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, Visit } from '../types';

export const generateInvoicePDF = (patient: Patient, visit: Visit, isPanel: boolean = false) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(7, 178, 178); // #07B2B2
  doc.text('Klinik Malaysia Enterprise', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('123, Jalan Bukit Bintang, 55100 Kuala Lumpur', 14, 28);
  doc.text('Phone: 03-2141 1234 | Email: billing@klinikmalaysia.com', 14, 34);
  
  // Invoice Details
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('OFFICIAL MEDICAL RECEIPT', 14, 50);
  
  doc.setFontSize(10);
  doc.text(`Invoice No: INV-${visit.id.replace('V-', '')}`, 14, 60);
  doc.text(`Date: ${new Date(visit.date).toLocaleDateString()}`, 14, 66);
  
  if (isPanel) {
    doc.text(`Payment Method: Panel Claim / TPA`, 194, 60, { align: 'right' });
    doc.text(`GL Number: ${visit.glNumber || 'N/A'}`, 194, 66, { align: 'right' });
  } else {
    doc.text(`Payment Method: ${visit.paymentMethod}`, 194, 60, { align: 'right' });
  }

  // Patient Info Box
  doc.setFillColor(245, 247, 250);
  doc.rect(14, 75, 180, 30, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 18, 83);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${patient.fullName}`, 18, 91);
  doc.text(`IC Number: ${patient.icNumber}`, 18, 97);
  doc.text(`Panel/Employer: ${patient.panelEmployer || 'Self-Pay'}`, 190, 91, { align: 'right' });
  
  // Table Data Preparation
  const tableRows = [];
  
  // Add Consultation Fee
  tableRows.push(['Consultation Fee (Primary APC Care)', '1', 'RM 35.00', 'RM 35.00']);
  
  // Add Procedures
  tableRows.push(['Clinical Procedures / Nursing Vitals Audit Fee', '1', 'RM 15.00', 'RM 15.00']);
  
  // Add Medications
  if (visit.soap.plan.prescription && visit.soap.plan.prescription.length > 0) {
    visit.soap.plan.prescription.forEach(med => {
      const lineTotal = (med.quantity * med.pricePerUnit).toFixed(2);
      tableRows.push([
        `Dispensed Medication: ${med.drugName}`, 
        med.quantity.toString(), 
        `RM ${med.pricePerUnit.toFixed(2)}`, 
        `RM ${lineTotal}`
      ]);
    });
  }
  
  const subTotal = visit.totalBill / 1.06;
  const tax = visit.totalBill - subTotal;

  autoTable(doc, {
    startY: 115,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [7, 178, 178], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
    }
  });

  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY || 150;
  
  // Totals
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Subtotal:`, 165, finalY + 10, { align: 'right' });
  doc.text(`RM ${subTotal.toFixed(2)}`, 194, finalY + 10, { align: 'right' });
  
  doc.text(`SST (6%):`, 165, finalY + 16, { align: 'right' });
  doc.text(`RM ${tax.toFixed(2)}`, 194, finalY + 16, { align: 'right' });
  
  // Line above Grand Total
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(130, finalY + 20, 194, finalY + 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(`Grand Total:`, 165, finalY + 28, { align: 'right' });
  doc.text(`RM ${visit.totalBill.toFixed(2)}`, 194, finalY + 28, { align: 'right' });
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer generated document. No signature is required.', 14, 280);
  doc.text('Thank you for choosing Klinik Malaysia Enterprise.', 14, 285);

  // Download
  doc.save(`Invoice_${visit.id}.pdf`);
};
