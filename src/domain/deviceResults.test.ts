import { describe, it, expect } from 'vitest';
import {
  candidateOrders, deviceActivity, deviceResultFromRow, generateDeviceKey, ingestUrl, keyHint, labDeviceFromRow, matchState, sha256Hex,
  type DeviceResult,
} from './deviceResults';
import type { Investigation } from './investigations';

const result = (o: Partial<DeviceResult> = {}): DeviceResult => ({
  id: 'r', deviceId: 'd', deviceCode: 'HGB', patientRef: '991001101111', value: '11.2', unit: 'g/dL', range: '12-16', abnormal: true, notes: '',
  receivedAt: '2026-11-19T10:00:00Z', status: 'Pending', ...o,
});

describe('device keys', () => {
  it('makes a prefixed 48-character key from random bytes', () => {
    const key = generateDeviceKey(() => new Uint8Array(24).fill(255));
    expect(key).toBe('mcd_' + 'ff'.repeat(24));
    expect(generateDeviceKey()).toMatch(/^mcd_[0-9a-f]{48}$/);
    expect(generateDeviceKey()).not.toBe(generateDeviceKey());
  });

  it('fingerprints with SHA-256', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('keeps only the last four characters as a hint', () => {
    expect(keyHint('mcd_abcdef123456')).toBe('3456');
  });

  it('builds the endpoint address without a doubled slash', () => {
    expect(ingestUrl('https://x.supabase.co/')).toBe('https://x.supabase.co/functions/v1/lab-device-ingest');
    expect(ingestUrl('https://x.supabase.co')).toBe('https://x.supabase.co/functions/v1/lab-device-ingest');
  });
});

describe('matching', () => {
  it('says what a person still has to decide', () => {
    expect(matchState(result({ investigationId: 'i', patientId: 'p', testName: 'FBC' }))).toBe('matched');
    expect(matchState(result())).toBe('no-patient');
    expect(matchState(result({ patientId: 'p' }))).toBe('unmapped');
    expect(matchState(result({ patientId: 'p', testName: 'FBC' }))).toBe('no-order');
  });

  it('offers only the same patient\'s open orders', () => {
    const inv = (id: string, patientId: string, status: Investigation['status']) => ({ id, patientId, status } as Investigation);
    const list = [inv('1', 'p', 'Ordered'), inv('2', 'p', 'Collected'), inv('3', 'p', 'Resulted'), inv('4', 'other', 'Ordered')];
    expect(candidateOrders(result({ patientId: 'p' }), list).map((i) => i.id)).toEqual(['1', '2']);
    expect(candidateOrders(result(), list)).toEqual([]);
  });
});

describe('device activity', () => {
  const now = Date.parse('2026-11-19T12:00:00Z');
  it('tells a quiet device from a recent one', () => {
    expect(deviceActivity({ active: false, lastSeenAt: undefined }, now)).toBe('off');
    expect(deviceActivity({ active: true, lastSeenAt: undefined }, now)).toBe('never');
    expect(deviceActivity({ active: true, lastSeenAt: '2026-11-19T11:00:00Z' }, now)).toBe('recent');
    expect(deviceActivity({ active: true, lastSeenAt: '2026-11-17T11:00:00Z' }, now)).toBe('quiet');
  });
});

describe('row mapping', () => {
  it('maps a device and falls back on unknown values', () => {
    expect(labDeviceFromRow({ id: 'd', name: 'Sysmex', kind: 'analyzer', protocol: 'hl7v2', active: true, key_hint: 'ab12' })).toMatchObject({ name: 'Sysmex', keyHint: 'ab12', active: true });
    expect(labDeviceFromRow({ id: 'd', name: 'X', kind: 'weird', protocol: 'odd' })).toMatchObject({ kind: 'other', protocol: 'hl7v2' });
  });

  it('maps an inbox result', () => {
    expect(deviceResultFromRow({ id: 'r', device_id: 'd', device_code: 'HGB', result_value: '11.2', status: 'Accepted', received_at: '2026-11-19T10:00:00Z', abnormal: true })).toMatchObject({ value: '11.2', status: 'Accepted', abnormal: true });
    expect(deviceResultFromRow({ id: 'r', device_id: 'd', device_code: 'X', status: 'weird', received_at: 'z' }).status).toBe('Pending');
  });
});
