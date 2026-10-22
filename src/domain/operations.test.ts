import { describe, expect, it } from 'vitest';
import type { Appointment, Visit } from '../types';
import type { PurchaseOrder } from './inventory';
import { localDateKey, summarizeAppointments, summarizeFlow, summarizeOrders } from './operations';

const NOW = new Date(2026, 9, 22, 12, 0, 0).getTime();
const minsAgo = (m: number) => NOW - m * 60000;

const visit = (status: Visit['status'], registeredTime?: number): Visit =>
  ({ id: `${status}-${registeredTime}`, patientId: 'p', date: '', soap: {} as Visit['soap'], status, totalBill: 0, panelClaimed: 0, paidAmount: 0, registeredTime });

describe('summarizeFlow', () => {
  it('counts each stage and groups in-progress with waiting', () => {
    const f = summarizeFlow([
      visit('Awaiting Triage'), visit('Triaging'), visit('Awaiting Consult'), visit('Consulting'),
      visit('Awaiting Dispensation'), visit('Dispensing'), visit('Awaiting Billing'),
    ], NOW);
    expect(f).toMatchObject({ inClinic: 7, triage: 2, doctor: 2, pharmacy: 2, cashier: 1, waiting: 2 });
  });

  it('averages and maxes waits for patients not yet being seen', () => {
    const f = summarizeFlow([visit('Awaiting Consult', minsAgo(10)), visit('Awaiting Triage', minsAgo(30)), visit('Consulting', minsAgo(90))], NOW);
    expect(f.avgWaitMins).toBe(20);
    expect(f.longestWaitMins).toBe(30);
    expect(f.overTarget).toBe(1);
  });

  it('returns null waits when nobody is waiting or times are missing', () => {
    expect(summarizeFlow([], NOW)).toMatchObject({ avgWaitMins: null, longestWaitMins: null, overTarget: 0 });
    expect(summarizeFlow([visit('Awaiting Consult')], NOW).avgWaitMins).toBeNull();
  });
});

describe('summarizeAppointments', () => {
  const appt = (status: Appointment['status'], when: Date): Appointment =>
    ({ id: Math.random().toString(), patientName: 'x', patientPhone: '', appointmentTime: when.toISOString(), durationMinutes: 15, purpose: '', status, createdAt: '' });
  const today = new Date(2026, 9, 22, 9, 0);
  const tomorrow = new Date(2026, 9, 23, 9, 0);

  it('only counts the given day and computes attendance from concluded visits', () => {
    const s = summarizeAppointments([
      appt('Completed', today), appt('Completed', today), appt('Completed', today), appt('No-Show', today),
      appt('Scheduled', today), appt('Cancelled', today), appt('Scheduled', tomorrow),
    ], '2026-10-22');
    expect(s).toEqual({ total: 6, scheduled: 1, completed: 3, cancelled: 1, noShow: 1, attendanceRate: 75 });
  });

  it('has no attendance rate until something has concluded', () => {
    expect(summarizeAppointments([appt('Scheduled', today)], '2026-10-22').attendanceRate).toBeNull();
  });
});

describe('summarizeOrders', () => {
  const po = (status: PurchaseOrder['status'], expectedDate: string | null): PurchaseOrder =>
    ({ id: status + expectedDate, poNumber: '', supplierId: 's', status, expectedDate, notes: null, createdAt: '', orderedAt: null, cancelReason: null, lines: [] });

  it('separates open, overdue and draft orders', () => {
    const s = summarizeOrders([po('ordered', '2026-10-20'), po('partially_received', '2026-10-30'), po('draft', null), po('received', '2026-10-01'), po('cancelled', null)], '2026-10-22');
    expect(s).toEqual({ open: 2, overdue: 1, drafts: 1 });
  });
});

describe('localDateKey', () => {
  it('formats the local calendar date', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
