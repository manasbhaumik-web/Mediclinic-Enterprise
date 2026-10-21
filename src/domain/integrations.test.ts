import { describe, expect, it } from 'vitest';
import {
  IntegrationConnection, IntegrationHealth, connectionFromRow, connectionStatus, enableBlocker, summariseOutbox,
} from './integrations';

const conn = (over: Partial<IntegrationConnection> = {}): IntegrationConnection => ({
  id: 'c1', type: 'fhir', name: 'Partner', endpointUrl: 'https://fhir.example.com/R4', authType: 'bearer',
  authHeaderName: null, mode: 'sandbox', enabled: true, config: {}, secretSet: true, ...over,
});

const health = (over: Partial<IntegrationHealth> = {}): IntegrationHealth => ({
  connectionId: 'c1', lastSuccessAt: '2026-01-01T00:00:00Z', lastFailureAt: null, lastLatencyMs: 40,
  lastError: null, consecutiveFailures: 0, ...over,
});

describe('connectionStatus', () => {
  it('is honest about connectors that are not built', () => {
    expect(connectionStatus(conn({ type: 'tpa' }), health())).toEqual({ label: 'Connector not built yet', tone: 'idle' });
  });

  it('shows disabled before looking at health', () => {
    expect(connectionStatus(conn({ enabled: false }), health()).label).toBe('Disabled');
  });

  it('says never tested when there is no health data, instead of claiming healthy', () => {
    expect(connectionStatus(conn()).label).toBe('Never tested');
    expect(connectionStatus(conn(), health({ lastSuccessAt: null })).label).toBe('Never tested');
  });

  it('escalates from a single failure to failing', () => {
    expect(connectionStatus(conn(), health({ consecutiveFailures: 1 })).tone).toBe('warn');
    expect(connectionStatus(conn(), health({ consecutiveFailures: 3 }))).toEqual({ label: 'Failing (3 in a row)', tone: 'bad' });
  });

  it('is healthy only after a success with no failures since', () => {
    expect(connectionStatus(conn(), health())).toEqual({ label: 'Healthy', tone: 'ok' });
  });
});

describe('enableBlocker', () => {
  it('allows a configured connection', () => {
    expect(enableBlocker(conn(), true)).toBeNull();
    expect(enableBlocker(conn({ authType: 'none', secretSet: false }), true)).toBeNull();
  });

  it('blocks unbuilt types, bad endpoints and missing credentials', () => {
    expect(enableBlocker(conn({ type: 'lis' }), true)).toMatch(/not implemented/);
    expect(enableBlocker(conn(), false)).toMatch(/endpoint/);
    expect(enableBlocker(conn({ secretSet: false }), true)).toMatch(/credential/);
  });
});

describe('summariseOutbox', () => {
  it('groups statuses, counting in-flight messages as pending', () => {
    expect(summariseOutbox([{ status: 'pending' }, { status: 'sending' }, { status: 'failed' }, { status: 'dead' }, { status: 'sent' }, { status: 'sent' }]))
      .toEqual({ pending: 2, failed: 1, dead: 1, sent: 2 });
  });
});

describe('connectionFromRow', () => {
  it('maps columns and defaults optional ones', () => {
    const c = connectionFromRow({ id: 'x', type: 'fhir', name: 'N', endpoint_url: null, auth_type: 'none', auth_header_name: null, mode: 'live', enabled: false, config: null, secret_set: null });
    expect(c).toMatchObject({ endpointUrl: null, mode: 'live', config: {}, secretSet: false });
  });
});
