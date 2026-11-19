import { describe, it, expect } from 'vitest';
import {
  TEMPLATE_GUIDE, maskPhone, normalizeMyPhone, outboxFromRow, parseHours, settingsFromRow, summarizeOutbox, workerIsRunning, DEFAULT_SETTINGS,
  type OutboxMessage,
} from './patientMessages';

describe('normalizeMyPhone', () => {
  it('turns local and international forms into 60…', () => {
    expect(normalizeMyPhone('012-345 6789')).toBe('60123456789');
    expect(normalizeMyPhone('+60 12-345 6789')).toBe('60123456789');
    expect(normalizeMyPhone('60123456789')).toBe('60123456789');
    expect(normalizeMyPhone('123456789')).toBe('60123456789');
    expect(normalizeMyPhone('011-2345 6789')).toBe('601123456789');
  });

  it('refuses anything that cannot be a Malaysian mobile number', () => {
    for (const bad of ['', '0', '999', 'abc', '+65 9123 4567', '03-1234 5678 99 99 99']) expect(normalizeMyPhone(bad), bad).toBeNull();
  });
});

describe('maskPhone', () => {
  it('hides the middle of a number', () => {
    expect(maskPhone('60123456789')).toBe('+6012••••789');
    expect(maskPhone('123')).toBe('123');
  });
});

describe('parseHours', () => {
  it('reads a list, largest first, and drops anything out of range or repeated', () => {
    expect(parseHours('2, 24 24 48')).toEqual([48, 24, 2]);
    expect(parseHours('0, 200, abc, 6.5, 12')).toEqual([12]);
    expect(parseHours('')).toEqual([]);
  });
});

describe('settings and rows', () => {
  it('falls back to safe defaults, with sending off', () => {
    expect(settingsFromRow(null)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.enabled).toBe(false);
    expect(settingsFromRow({}).enabled).toBe(false);
  });

  it('reads a settings row', () => {
    const s = settingsFromRow({ enabled: true, appointment_hours: [24, 2], quiet_start: '21:00:00', quiet_end: '08:00:00', provider_configured: true, followup_days_before: 5 });
    expect(s).toMatchObject({ enabled: true, appointmentHours: [24, 2], quietStart: '21:00', quietEnd: '08:00', providerConfigured: true, followupDaysBefore: 5 });
  });

  it('reads an outbox row and counts by status', () => {
    const row = outboxFromRow({ id: 'm', kind: 'appointment', to_phone: '60123456789', template: 't', params: ['Siti', 1], scheduled_for: '2026-11-19T01:00:00Z', status: 'Failed', attempts: 2, last_error: 'x' });
    expect(row.params).toEqual(['Siti', '1']);
    const rows: OutboxMessage[] = [row, { ...row, id: 'b', status: 'Sent' }, { ...row, id: 'c', status: 'Sent' }];
    expect(summarizeOutbox(rows)).toMatchObject({ Failed: 1, Sent: 2, Queued: 0 });
  });
});

describe('templates and worker health', () => {
  it('lists a template for every message type with its parameters in the body', () => {
    expect(TEMPLATE_GUIDE.map((t) => t.kind)).toEqual(['appointment', 'results', 'followup']);
    for (const t of TEMPLATE_GUIDE) {
      for (let i = 1; i <= t.params.length; i++) expect(t.body).toContain(`{{${i}}}`);
      expect(t.body).not.toContain(`{{${t.params.length + 1}}}`);
    }
  });

  it('says results are never sent in the message', () => {
    expect(TEMPLATE_GUIDE.find((t) => t.kind === 'results')!.body).toMatch(/never sent/);
  });

  it('treats the worker as running if it ran in the last half hour', () => {
    const now = Date.parse('2026-11-19T12:00:00Z');
    expect(workerIsRunning('2026-11-19T11:45:00Z', now)).toBe(true);
    expect(workerIsRunning('2026-11-19T10:00:00Z', now)).toBe(false);
    expect(workerIsRunning(undefined, now)).toBe(false);
  });
});
