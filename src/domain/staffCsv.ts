/**
 * Staff roster CSV: parsing and row validation for the Import Staff CSV dialog.
 *
 * Imports create staff RECORDS only. Granting a login is a separate, deliberate step per person (so nobody
 * receives an invitation, or any access, just because they appear in a spreadsheet).
 */
import { validateStaffInput } from '../../supabase/functions/_shared/staffAccess';

export interface ParsedStaffRow {
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'On Leave';
  gender: string;
  dob: string;
  icNumber: string;
  phone: string;
  salaryBase: number;
}

export interface RowError { line: number; name: string; problems: string[] }

export interface CsvParseResult {
  rows: ParsedStaffRow[];
  errors: RowError[];
  /** Rows skipped because the email is already in the directory or appears earlier in the file. */
  duplicates: { line: number; email: string }[];
  missingColumns: string[];
}

export const CSV_COLUMNS = ['name', 'email', 'department', 'role', 'status', 'gender', 'dob', 'icNumber', 'phone', 'salaryBase'] as const;

/** RFC 4180 style parser: quoted fields, doubled quotes, commas and newlines inside quotes, CRLF, BOM. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

const HEADER_ALIASES: Record<string, (typeof CSV_COLUMNS)[number]> = {
  name: 'name', fullname: 'name', staffname: 'name', employeename: 'name',
  email: 'email', emailaddress: 'email', workemail: 'email',
  department: 'department', dept: 'department',
  role: 'role', jobtitle: 'role', title: 'role', position: 'role', designation: 'role',
  status: 'status',
  gender: 'gender', sex: 'gender',
  dob: 'dob', dateofbirth: 'dob', birthdate: 'dob',
  icnumber: 'icNumber', ic: 'icNumber', nric: 'icNumber', mykad: 'icNumber',
  phone: 'phone', mobile: 'phone', phonenumber: 'phone', contact: 'phone',
  salarybase: 'salaryBase', salary: 'salaryBase', basesalary: 'salaryBase', monthlysalary: 'salaryBase',
};

const normalise = (h: string) => h.toLowerCase().replace(/[^a-z]/g, '');
const STATUSES = ['Active', 'Inactive', 'Suspended', 'On Leave'] as const;

/** Parse and validate a staff CSV. `existingEmails` are skipped as duplicates. */
export function parseStaffCsv(text: string, existingEmails: string[] = []): CsvParseResult {
  const table = parseCsv(text);
  const result: CsvParseResult = { rows: [], errors: [], duplicates: [], missingColumns: [] };
  if (table.length === 0) { result.missingColumns = ['name', 'email', 'role']; return result; }

  const columnIndex = new Map<(typeof CSV_COLUMNS)[number], number>();
  table[0].forEach((h, i) => {
    const key = HEADER_ALIASES[normalise(h)];
    if (key && !columnIndex.has(key)) columnIndex.set(key, i);
  });
  result.missingColumns = (['name', 'email', 'role'] as const).filter((c) => !columnIndex.has(c));
  if (result.missingColumns.length) return result;

  const seen = new Set(existingEmails.map((e) => e.trim().toLowerCase()));

  table.slice(1).forEach((cells, i) => {
    const line = i + 2; // spreadsheet line number, counting the header as line 1
    const get = (c: (typeof CSV_COLUMNS)[number]) => (columnIndex.has(c) ? (cells[columnIndex.get(c)!] ?? '').trim() : '');

    const salaryText = get('salaryBase').replace(/[^0-9.\-]/g, '');
    const salary = salaryText === '' ? 0 : Number(salaryText);
    const statusText = get('status');
    const status = STATUSES.find((s) => s.toLowerCase() === statusText.toLowerCase());
    const dob = get('dob');
    const email = get('email').toLowerCase();

    const problems = validateStaffInput({ name: get('name'), email, role: get('role'), salaryBase: salary });
    if (statusText && !status) problems.push(`Status "${statusText}" is not one of ${STATUSES.join(', ')}`);
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) problems.push('Date of birth must look like 1990-01-31');

    if (problems.length) { result.errors.push({ line, name: get('name') || `(line ${line})`, problems }); return; }
    if (seen.has(email)) { result.duplicates.push({ line, email }); return; }
    seen.add(email);

    result.rows.push({
      name: get('name'), email, department: get('department'), role: get('role'), status: status ?? 'Active',
      gender: get('gender'), dob, icNumber: get('icNumber'), phone: get('phone'), salaryBase: salary,
    });
  });

  return result;
}

/** The header line and one example row, for a "download template" link. */
export const CSV_TEMPLATE = `${CSV_COLUMNS.join(',')}\nDr. Example Name,example.name@clinic.my,General Practice,Senior GP Physician,Active,Female,1985-04-12,850412-14-5224,012-3456789,14500\n`;
