import { describe, expect, it, vi } from 'vitest';
import type { ReportTable } from '../domain/reports';
import { downloadPdf } from './reportExport';

const captured = vi.hoisted(() => ({ text: '', file: '' }));

// Wrap jsPDF so the finished document can be inspected instead of triggering a download.
vi.mock('jspdf', async (importOriginal) => {
  const mod = await importOriginal<typeof import('jspdf')>();
  class Capturing extends mod.jsPDF {
    constructor(...args: ConstructorParameters<typeof mod.jsPDF>) {
      super(...args);
      (this as unknown as { save: (name: string) => unknown }).save = (name: string) => {
        captured.text = this.output();
        captured.file = name;
        return this;
      };
    }
  }
  return { ...mod, jsPDF: Capturing };
});

/** PDF content streams escape parentheses and backslashes. */
const pdf = (s: string) => s.replace(/[()\\]/g, '\\$&');

const table: ReportTable = {
  title: 'Revenue by month (Oct 2026)',
  subtitle: 'Period: 1 Oct 2026 to 22 Oct 2026',
  columns: ['Month', 'Patient paid (RM)', 'Panel claimed (RM)'],
  rows: [['2026-10', '120.50', '80.00'], ['2026-11', null, 0]],
  numeric: [1, 2],
};

describe('downloadPdf', () => {
  it('prints the clinic, title, period, headings and every row', async () => {
    await downloadPdf(table, { name: 'Klinik Contoh', branch: 'Shah Alam' });
    expect(captured.file).toBe('revenue-by-month-oct-2026.pdf');
    for (const expected of ['Klinik Contoh, Shah Alam', 'Revenue by month (Oct 2026)', 'Period: 1 Oct 2026 to 22 Oct 2026', 'Patient paid (RM)', '2026-10', '120.50', '2026-11']) {
      expect(captured.text, expected).toContain(pdf(expected));
    }
  });
});
