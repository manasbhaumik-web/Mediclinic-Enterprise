/** Patient WhatsApp messages: settings, the outbox log, phone numbers and the templates the clinic must register with WhatsApp. */
export type MessageKind = 'appointment' | 'results' | 'followup';
export type MessageStatus = 'Queued' | 'Sending' | 'Sent' | 'Failed' | 'Skipped' | 'Cancelled';

export interface MessageSettings {
  enabled: boolean;
  appointmentEnabled: boolean;
  appointmentHours: number[];
  resultsEnabled: boolean;
  followupEnabled: boolean;
  followupDaysBefore: number;
  templateAppointment: string;
  templateResults: string;
  templateFollowup: string;
  languageCode: string;
  quietStart: string;
  quietEnd: string;
  providerConfigured: boolean;
  lastRunAt?: string;
}

export interface OutboxMessage {
  id: string;
  kind: MessageKind;
  toPhone: string;
  template: string;
  params: string[];
  scheduledFor: string;
  status: MessageStatus;
  attempts: number;
  lastError?: string;
  sentAt?: string;
}

export interface OptOut {
  phone: string;
  reason: string;
  createdAt: string;
}

export const KIND_LABEL: Record<MessageKind, string> = {
  appointment: 'Appointment reminder',
  results: 'Results reviewed',
  followup: 'Follow-up due',
};

export const DEFAULT_SETTINGS: MessageSettings = {
  enabled: false,
  appointmentEnabled: true,
  appointmentHours: [24, 2],
  resultsEnabled: true,
  followupEnabled: true,
  followupDaysBefore: 3,
  templateAppointment: 'appointment_reminder',
  templateResults: 'results_ready',
  templateFollowup: 'followup_due',
  languageCode: 'en',
  quietStart: '21:00',
  quietEnd: '08:00',
  providerConfigured: false,
};

const hhmm = (v: unknown, fallback: string) => (typeof v === 'string' && /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : fallback);

export function settingsFromRow(r: any): MessageSettings {
  if (!r) return DEFAULT_SETTINGS;
  return {
    enabled: !!r.enabled,
    appointmentEnabled: r.appointment_enabled !== false,
    appointmentHours: Array.isArray(r.appointment_hours) ? r.appointment_hours.map(Number).filter((n: number) => n > 0) : DEFAULT_SETTINGS.appointmentHours,
    resultsEnabled: r.results_enabled !== false,
    followupEnabled: r.followup_enabled !== false,
    followupDaysBefore: Number.isFinite(Number(r.followup_days_before)) ? Number(r.followup_days_before) : 3,
    templateAppointment: r.template_appointment ?? DEFAULT_SETTINGS.templateAppointment,
    templateResults: r.template_results ?? DEFAULT_SETTINGS.templateResults,
    templateFollowup: r.template_followup ?? DEFAULT_SETTINGS.templateFollowup,
    languageCode: r.language_code ?? 'en',
    quietStart: hhmm(r.quiet_start, '21:00'),
    quietEnd: hhmm(r.quiet_end, '08:00'),
    providerConfigured: !!r.provider_configured,
    lastRunAt: r.last_run_at ?? undefined,
  };
}

export const outboxFromRow = (r: any): OutboxMessage => ({
  id: r.id,
  kind: r.kind,
  toPhone: r.to_phone ?? '',
  template: r.template,
  params: Array.isArray(r.params) ? r.params.map(String) : [],
  scheduledFor: r.scheduled_for,
  status: r.status,
  attempts: r.attempts ?? 0,
  lastError: r.last_error ?? undefined,
  sentAt: r.sent_at ?? undefined,
});

export const optOutFromRow = (r: any): OptOut => ({ phone: r.phone, reason: r.reason ?? '', createdAt: r.created_at });

/** The same rule the database applies: a Malaysian mobile number as 60 followed by 8 to 10 digits, or null. */
export function normalizeMyPhone(input: string): string | null {
  const d = (input ?? '').replace(/\D/g, '');
  const n = d === '' ? '' : d.startsWith('60') ? d : d.startsWith('0') ? `60${d.slice(1)}` : d.startsWith('1') ? `60${d}` : d;
  return /^60[1-9]\d{7,9}$/.test(n) ? n : null;
}

/** Shows a number as +60 12-345 6789 style, with the middle hidden in lists. */
export function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return `+${phone.slice(0, 4)}${'•'.repeat(Math.max(0, phone.length - 7))}${phone.slice(-3)}`;
}

export function summarizeOutbox(rows: readonly OutboxMessage[]): Record<MessageStatus, number> {
  const out: Record<MessageStatus, number> = { Queued: 0, Sending: 0, Sent: 0, Failed: 0, Skipped: 0, Cancelled: 0 };
  for (const r of rows) out[r.status] += 1;
  return out;
}

/** Reads "6, 24, 2" as the hours before an appointment, largest first, ignoring anything that is not 1 to 168. */
export function parseHours(text: string): number[] {
  const hours = text.split(/[,\s]+/).map((t) => Number(t)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 168);
  return [...new Set(hours)].sort((a, b) => b - a);
}

/** The templates the clinic registers with WhatsApp (Meta). The wording below is suggested; the parameter order is fixed. */
export const TEMPLATE_GUIDE: { kind: MessageKind; setting: 'templateAppointment' | 'templateResults' | 'templateFollowup'; params: string[]; body: string }[] = [
  {
    kind: 'appointment', setting: 'templateAppointment', params: ['first name', 'date', 'time'],
    body: 'Hello {{1}}, this is a reminder of your appointment at our clinic on {{2}} at {{3}}. To change or cancel, please call the clinic.',
  },
  {
    kind: 'results', setting: 'templateResults', params: ['first name'],
    body: 'Hello {{1}}, your doctor has reviewed your test results. Please contact the clinic to discuss them. Results are never sent by message.',
  },
  {
    kind: 'followup', setting: 'templateFollowup', params: ['first name', 'date'],
    body: 'Hello {{1}}, your doctor advised a follow-up visit around {{2}}. Please call the clinic to book an appointment.',
  },
];

/** True when the worker has run recently enough that the schedule is clearly working (it runs every 5 minutes). */
export function workerIsRunning(lastRunAt: string | undefined, now = Date.now()): boolean {
  return !!lastRunAt && now - Date.parse(lastRunAt) < 30 * 60_000;
}
