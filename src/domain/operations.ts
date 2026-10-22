/** Read-only roll-ups for the Operations Hub. Pure functions over data the app already loads. */
import { Appointment, Visit } from '../types';
import { PurchaseOrder, isOverdue } from './inventory';

/** Local calendar date as YYYY-MM-DD (the format the inventory and equipment helpers expect). */
export function localDateKey(now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export const WAIT_TARGET_MINUTES = 20;

export interface FlowSummary {
  inClinic: number;
  triage: number;
  doctor: number;
  pharmacy: number;
  cashier: number;
  /** Patients registered but not yet being seen (awaiting triage or consult). */
  waiting: number;
  /** Null when nobody is waiting or no waiting patient has a registration time. */
  avgWaitMins: number | null;
  longestWaitMins: number | null;
  overTarget: number;
}

const minutesSince = (registeredTime: number | undefined, now: number): number | null =>
  registeredTime ? Math.max(0, Math.floor((now - registeredTime) / 60000)) : null;

/** Where active visits sit in the pathway, and how long the people still waiting to be seen have waited. */
export function summarizeFlow(activeVisits: Visit[], now: number): FlowSummary {
  const count = (...s: Visit['status'][]) => activeVisits.filter((v) => s.includes(v.status)).length;
  const waitingVisits = activeVisits.filter((v) => v.status === 'Awaiting Triage' || v.status === 'Awaiting Consult');
  const waits = waitingVisits.map((v) => minutesSince(v.registeredTime, now)).filter((m): m is number => m !== null);
  return {
    inClinic: activeVisits.length,
    triage: count('Awaiting Triage', 'Triaging'),
    doctor: count('Awaiting Consult', 'Consulting'),
    pharmacy: count('Awaiting Dispensation', 'Dispensing'),
    cashier: count('Awaiting Billing'),
    waiting: waitingVisits.length,
    avgWaitMins: waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : null,
    longestWaitMins: waits.length ? Math.max(...waits) : null,
    overTarget: waits.filter((m) => m >= WAIT_TARGET_MINUTES).length,
  };
}

export interface AppointmentSummary {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  /** Completed ÷ (completed + no-show); null until at least one has concluded. */
  attendanceRate: number | null;
}

/** Appointments whose time falls on the given local day. */
export function summarizeAppointments(appointments: Appointment[], dayKey: string): AppointmentSummary {
  const today = appointments.filter((a) => localDateKey(new Date(a.appointmentTime)) === dayKey);
  const n = (s: Appointment['status']) => today.filter((a) => a.status === s).length;
  const completed = n('Completed');
  const noShow = n('No-Show');
  const concluded = completed + noShow;
  return {
    total: today.length,
    scheduled: n('Scheduled'),
    completed,
    cancelled: n('Cancelled'),
    noShow,
    attendanceRate: concluded ? Math.round((completed / concluded) * 100) : null,
  };
}

export interface OrderSummary { open: number; overdue: number; drafts: number }

export function summarizeOrders(orders: PurchaseOrder[], today: string): OrderSummary {
  return {
    open: orders.filter((o) => o.status === 'ordered' || o.status === 'partially_received').length,
    overdue: orders.filter((o) => isOverdue(o, today)).length,
    drafts: orders.filter((o) => o.status === 'draft').length,
  };
}
