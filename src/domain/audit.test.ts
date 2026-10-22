import { describe, expect, it } from 'vitest';
import {
  describeDetail, equipmentEntry, humanise, hrEntry, integrationEntry, inventoryEntry, mergeFeed, payrollEntry, summarizeActivity,
} from './audit';

describe('humanise / describeDetail', () => {
  it('turns identifiers into readable text', () => {
    expect(humanise('leave_request.approved')).toBe('Leave request approved');
    expect(humanise(null)).toBe('');
  });

  it('summarises scalar detail pairs and skips nested values', () => {
    expect(describeDetail({ drug_name: 'Panadol', quantity: 20, nested: { a: 1 }, none: null })).toBe('Drug name: Panadol · Quantity: 20');
    expect(describeDetail('plain text')).toBe('plain text');
    expect(describeDetail(null)).toBe('');
  });

  it('limits to the requested number of pairs and clips long values', () => {
    expect(describeDetail({ a: 1, b: 2, c: 3, d: 4 }, 2)).toBe('A: 1 · B: 2');
    expect(describeDetail({ note: 'x'.repeat(100) })).toContain('…');
  });
});

describe('normalisers', () => {
  it('maps each source to a feed entry', () => {
    expect(inventoryEntry({ id: '1', entity: 'drug', action: 'retired', detail: { reason: 'expired' }, actor: 'u1', created_at: '2026-10-22T01:00:00Z' }))
      .toMatchObject({ id: 'inventory:1', source: 'inventory', action: 'Drug: Retired', detail: 'Reason: expired', actor: 'u1' });
    expect(hrEntry({ id: '2', entity: 'leave', action: 'approved', created_at: '2026-10-22T02:00:00Z' })).toMatchObject({ source: 'hr', action: 'Leave: Approved', detail: '' });
    expect(payrollEntry({ id: '3', action: 'run_finalised', detail: 'Oct run', created_at: '2026-10-22T03:00:00Z' })).toMatchObject({ source: 'payroll', action: 'Run finalised', detail: 'Oct run' });
  });

  it('flags failed equipment checks and failed or blocked integration events', () => {
    expect(equipmentEntry({ id: 'e', kind: 'calibration', outcome: 'fail', performed_by: 'Ali', actor_name: 'Sam', created_at: '2026-10-22T00:00:00Z' }))
      .toMatchObject({ tone: 'bad', actorName: 'Sam', action: 'Calibration (fail)', detail: 'By Ali' });
    expect(equipmentEntry({ id: 'e2', kind: 'service', outcome: 'conditional', created_at: '2026-10-22T00:00:00Z' }).tone).toBe('warn');
    expect(integrationEntry({ id: 'i', event_type: 'send', direction: 'outbound', status: 'failure', http_status: 500, created_at: '2026-10-22T00:00:00Z' }))
      .toMatchObject({ tone: 'bad', detail: 'Failure · HTTP 500' });
    expect(integrationEntry({ id: 'i2', event_type: 'send', direction: 'outbound', status: 'blocked', created_at: '2026-10-22T00:00:00Z' }).tone).toBe('warn');
    expect(integrationEntry({ id: 'i3', event_type: 'send', direction: 'outbound', status: 'success', created_at: '2026-10-22T00:00:00Z' }).tone).toBe('ok');
  });
});

describe('mergeFeed / summarizeActivity', () => {
  const a = hrEntry({ id: 'a', entity: 'x', action: 'y', created_at: '2026-10-20T00:00:00Z' });
  const b = payrollEntry({ id: 'b', action: 'z', created_at: '2026-10-22T00:00:00Z' });
  const c = integrationEntry({ id: 'c', event_type: 't', direction: 'inbound', status: 'failure', created_at: '2026-10-21T00:00:00Z' });

  it('sorts newest first across sources and respects the limit', () => {
    expect(mergeFeed([[a], [b, c]]).map((e) => e.id)).toEqual(['payroll:b', 'integration:c', 'hr:a']);
    expect(mergeFeed([[a], [b, c]], 2)).toHaveLength(2);
  });

  it('counts events since a cut-off, by source, with problems', () => {
    const s = summarizeActivity([a, b, c], Date.parse('2026-10-21T00:00:00Z'));
    expect(s).toEqual({ total: 2, bySource: { inventory: 0, hr: 0, payroll: 1, equipment: 0, integration: 1 }, problems: 1 });
  });
});
