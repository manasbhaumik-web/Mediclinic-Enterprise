import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CSV_TEMPLATE, parseCsv, parseStaffCsv } from './staffCsv';

describe('parseCsv', () => {
  it('handles quotes, embedded commas, doubled quotes and newlines inside quotes', () => {
    expect(parseCsv('a,"b, c","say ""hi""","line1\nline2"\n1,2,3,4')).toEqual([
      ['a', 'b, c', 'say "hi"', 'line1\nline2'],
      ['1', '2', '3', '4'],
    ]);
  });

  it('copes with CRLF, a BOM, a missing final newline and blank lines', () => {
    expect(parseCsv('﻿x,y\r\n1,2\r\n\r\n3,4')).toEqual([['x', 'y'], ['1', '2'], ['3', '4']]);
  });
});

describe('parseStaffCsv', () => {
  const header = 'name,email,department,role,status,gender,dob,icNumber,phone,salaryBase';

  it('imports the template as a valid row', () => {
    const r = parseStaffCsv(CSV_TEMPLATE);
    expect(r.errors).toEqual([]);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({ name: 'Dr. Example Name', status: 'Active', salaryBase: 14500, dob: '1985-04-12' });
  });

  it('imports the shipped sample roster completely', () => {
    const csv = readFileSync('docs/sample-data/staff_import.csv', 'utf8');
    const r = parseStaffCsv(csv);
    expect(r.errors).toEqual([]);
    expect(r.duplicates).toEqual([]);
    expect(r.rows).toHaveLength(15);
  });

  it('accepts common header names in any order and case', () => {
    const r = parseStaffCsv('Job Title,Full Name,E-mail,Salary\nNurse,Aina Ali,aina@clinic.my,"RM 4,300.50"');
    expect(r.missingColumns).toEqual([]);
    expect(r.rows[0]).toMatchObject({ name: 'Aina Ali', role: 'Nurse', email: 'aina@clinic.my', salaryBase: 4300.5 });
  });

  it('reports missing required columns instead of guessing', () => {
    expect(parseStaffCsv('name,department\nA,B').missingColumns).toEqual(['email', 'role']);
    expect(parseStaffCsv('').missingColumns).toEqual(['name', 'email', 'role']);
  });

  it('reports row problems with the spreadsheet line number and keeps the good rows', () => {
    const r = parseStaffCsv(`${header}\nA,not-an-email,Dept,Nurse,Active,,,,,1000\nB,b@clinic.my,Dept,Nurse,Gone,,1990-1-1,,,abc\nC,c@clinic.my,Dept,Nurse,Active,,,,,2000`);
    expect(r.rows.map((x) => x.name)).toEqual(['C']);
    expect(r.errors.map((e) => e.line)).toEqual([2, 3]);
    expect(r.errors[0].problems).toContain('Email is not valid');
    expect(r.errors[1].problems).toEqual(expect.arrayContaining([expect.stringContaining('Status "Gone"'), expect.stringContaining('Date of birth')]));
  });

  it('skips emails already in the directory or repeated in the file, ignoring case', () => {
    const r = parseStaffCsv(`${header}
A,A@Clinic.my,D,Nurse,,,,,,
B,a@clinic.my,D,Nurse,,,,,,
C,c@clinic.my,D,Nurse,,,,,,`, ['c@clinic.my']);
    expect(r.rows.map((x) => x.email)).toEqual(['a@clinic.my']);
    expect(r.duplicates).toEqual([
      { line: 3, email: 'a@clinic.my', reason: 'email', of: 'A' },
      { line: 4, email: 'c@clinic.my', reason: 'email', of: 'c@clinic.my' },
    ]);
  });

  it('skips the same ID number written differently, in the file or already in the directory', () => {
    const r = parseStaffCsv(`${header}
A,a@clinic.my,D,Nurse,,,,900101-14-5555,,
B,b@clinic.my,D,Nurse,,,,900101 14 5555,,
C,c@clinic.my,D,Nurse,,,,850412145224,,`, [{ name: 'Existing', email: 'e@clinic.my', icNumber: '850412-14-5224' }]);
    expect(r.rows.map((x) => x.name)).toEqual(['A']);
    expect(r.duplicates.map((d) => [d.line, d.reason])).toEqual([[3, 'id_number'], [4, 'id_number']]);
  });

  it('skips the same name and date of birth as a probable duplicate', () => {
    const r = parseStaffCsv(`${header}
Aina Ali,a2@clinic.my,D,Nurse,,,1990-01-01,,,`, [{ name: 'aina ali', email: 'a@clinic.my', dob: '1990-01-01' }]);
    expect(r.rows).toEqual([]);
    expect(r.duplicates[0]).toMatchObject({ reason: 'name_dob', of: 'aina ali' });
  });

  it('does not treat blank ID numbers as duplicates of each other', () => {
    const r = parseStaffCsv(`${header}
A,a@clinic.my,D,Nurse,,,,,,
B,b@clinic.my,D,Nurse,,,,,,`);
    expect(r.rows).toHaveLength(2);
    expect(r.duplicates).toEqual([]);
  });

  it('defaults status to Active and salary to 0 when blank', () => {
    const r = parseStaffCsv(`${header}\nA,a@clinic.my,D,Nurse,,,,,,`);
    expect(r.rows[0]).toMatchObject({ status: 'Active', salaryBase: 0 });
  });
});
