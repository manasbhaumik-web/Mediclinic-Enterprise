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
    const r = parseStaffCsv(`${header}\nA,A@Clinic.my,D,Nurse,,,,,,\nB,a@clinic.my,D,Nurse,,,,,,\nC,c@clinic.my,D,Nurse,,,,,,`, ['c@clinic.my']);
    expect(r.rows.map((x) => x.email)).toEqual(['a@clinic.my']);
    expect(r.duplicates).toEqual([{ line: 3, email: 'a@clinic.my' }, { line: 4, email: 'c@clinic.my' }]);
  });

  it('defaults status to Active and salary to 0 when blank', () => {
    const r = parseStaffCsv(`${header}\nA,a@clinic.my,D,Nurse,,,,,,`);
    expect(r.rows[0]).toMatchObject({ status: 'Active', salaryBase: 0 });
  });
});
