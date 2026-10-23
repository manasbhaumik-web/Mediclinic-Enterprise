import { describe, expect, it } from 'vitest';
import { assignmentOf, doctorName, prioritiseAssigned, roomOptions } from './doctorAssignment';

describe('assignmentOf', () => {
  it('tells whose patient a visit is', () => {
    expect(assignmentOf({ doctorId: 'd1' }, 'd1')).toBe('mine');
    expect(assignmentOf({ doctorId: 'd2' }, 'd1')).toBe('other');
    expect(assignmentOf({}, 'd1')).toBe('unassigned');
  });
  it('treats every assigned patient as someone else\'s when the doctor has no staff record', () => {
    expect(assignmentOf({ doctorId: 'd2' }, null)).toBe('other');
  });
});

describe('prioritiseAssigned', () => {
  const q = [{ id: 'a', doctorId: 'd2' }, { id: 'b' }, { id: 'c', doctorId: 'd1' }, { id: 'd' }, { id: 'e', doctorId: 'd1' }];
  it('puts my patients first, then unassigned, then other doctors\', keeping the order inside each group', () => {
    expect(prioritiseAssigned(q, 'd1').map((v) => v.id)).toEqual(['c', 'e', 'b', 'd', 'a']);
  });
  it('leaves the queue alone when the doctor is unknown', () => {
    expect(prioritiseAssigned(q, null)).toBe(q);
  });
});

describe('doctorName', () => {
  it('looks a doctor up by staff id', () => {
    const docs = [{ id: 'd1', authId: null, name: 'Dr. Sarah Lee', department: 'Pediatrics' }];
    expect(doctorName(docs, 'd1')).toBe('Dr. Sarah Lee');
    expect(doctorName(docs, 'zz')).toBeUndefined();
    expect(doctorName(undefined, 'd1')).toBeUndefined();
  });
});

describe('roomOptions', () => {
  const visits = [
    { status: 'Consulting' as const, consultRoom: 'consultation room 1', calledByName: 'Dr. Lee' },
    { status: 'Awaiting Consult' as const, consultRoom: 'Consultation Room 2', calledByName: undefined },
  ];
  it('marks a room busy only while a patient is being consulted there, ignoring case', () => {
    expect(roomOptions(['Consultation Room 1', 'Consultation Room 2'], visits)).toEqual([
      { name: 'Consultation Room 1', busyWith: 'Dr. Lee' },
      { name: 'Consultation Room 2' },
    ]);
  });
  it('can ignore the doctor\'s own patient so their room stays selectable', () => {
    expect(roomOptions(['Consultation Room 1'], visits, (v) => v.calledByName === 'Dr. Lee')).toEqual([{ name: 'Consultation Room 1' }]);
  });
});
