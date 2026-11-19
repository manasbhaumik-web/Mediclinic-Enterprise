import { describe, it, expect } from 'vitest';
import { auditCsv, auditFromRow, dayEndMy, dayStartMy, describeEntry, fieldsSummary, type ClinicalAuditEntry } from './clinicalAudit';

const entry = (o: Partial<ClinicalAuditEntry> = {}): ClinicalAuditEntry => ({
  id: 1, at: '2026-11-20T01:00:00Z', actorRoles: ['doctor'], action: 'update', entity: 'soap_notes', entityId: 'x', fields: [], context: '', ...o,
});

describe('describeEntry', () => {
  it('says what changed without values', () => {
    expect(describeEntry(entry({ fields: ['clinical_notes', 'description'] }))).toBe('Changed consultation note (clinical notes, description)');
    expect(describeEntry(entry({ action: 'create', entity: 'prescriptions' }))).toBe('Created prescription line');
    expect(describeEntry(entry({ action: 'delete', entity: 'prescriptions' }))).toBe('Removed prescription line');
  });

  it('names the screen when a record was opened', () => {
    expect(describeEntry(entry({ action: 'view', entity: 'patients', context: 'consultation' }))).toBe('Opened the patient record in Consultation room');
    expect(describeEntry(entry({ action: 'view', entity: 'patients', context: '' }))).toBe('Opened the patient record');
  });

  it('shows an unknown table by its name rather than hiding it', () => {
    expect(describeEntry(entry({ action: 'create', entity: 'new_thing' }))).toBe('Created new_thing');
  });
});

describe('fieldsSummary', () => {
  it('lists a few fields and counts the rest', () => {
    expect(fieldsSummary(['a_b', 'c'])).toBe('a b, c');
    expect(fieldsSummary(['a', 'b', 'c', 'd', 'e', 'f'])).toBe('a, b, c, d and 2 more');
    expect(fieldsSummary([])).toBe('');
  });
});

describe('days in Malaysia time', () => {
  it('starts a day at 16:00 UTC the day before, and ends it a day later', () => {
    expect(dayStartMy('2026-11-20')).toBe('2026-11-19T16:00:00.000Z');
    expect(dayEndMy('2026-11-20')).toBe('2026-11-20T16:00:00.000Z');
  });
});

describe('auditFromRow and CSV', () => {
  it('reads a row, with safe defaults', () => {
    expect(auditFromRow({ id: '5', at: 'z', action: 'view', entity: 'patients', entity_id: 'p', actor_roles: ['admin'] })).toMatchObject({ id: 5, fields: [], context: '', actorRoles: ['admin'] });
  });

  it('writes a CSV with quoting, names and no values', () => {
    const csv = auditCsv([entry({ actor: 'u1', patientId: 'p1', fields: ['clinical_notes'], actorRoles: ['doctor', 'admin'] })], () => 'Dr, Test', () => 'Siti');
    expect(csv.split('\n')[0]).toBe('time,staff,roles,action,what,patient,fields,screen');
    expect(csv.split('\n')[1]).toBe('2026-11-20T01:00:00Z,"Dr, Test",doctor/admin,Changed,Consultation note,Siti,clinical_notes,');
  });
});
