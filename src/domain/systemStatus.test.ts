import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  APP_REALTIME_TABLES, EDGE_FUNCTIONS, classifyProbe, formatBytes, latencyTone, minutesLeft, realtimeCoverage, resolveProbes, summarizeLatency,
} from './systemStatus';

const root = process.cwd();

describe('summarizeLatency / latencyTone', () => {
  it('reports median, fastest and slowest', () => {
    expect(summarizeLatency([300, 100, 200])).toEqual({ median: 200, min: 100, max: 300, samples: 3 });
    expect(summarizeLatency([100, 200, 300, 400])).toEqual({ median: 250, min: 100, max: 400, samples: 4 });
    expect(summarizeLatency([])).toBeNull();
  });

  it('judges a round trip on broadband terms', () => {
    expect(latencyTone(120)).toBe('ok');
    expect(latencyTone(400)).toBe('ok');
    expect(latencyTone(900)).toBe('warn');
    expect(latencyTone(2500)).toBe('bad');
  });
});

describe('edge function probes', () => {
  it('reads a "not found" from the platform as not deployed', () => {
    expect(classifyProbe({ status: 404, body: '{"code":"NOT_FOUND","message":"Requested function was not found"}' })).toBe('not-deployed');
  });

  it('treats any other answer as deployed, including a refusal for a missing token', () => {
    expect(classifyProbe({ status: 401, body: '{"code":"UNAUTHORIZED_NO_AUTH_HEADER"}' })).toBe('deployed');
    expect(classifyProbe({ status: 405 })).toBe('deployed');
    expect(classifyProbe({ status: 200 })).toBe('deployed');
    expect(classifyProbe({ status: 404, body: '<html>some other 404</html>' })).toBe('deployed');
  });

  it('marks a request the browser could not read as unreadable, or unreachable when nothing answered at all', () => {
    expect(classifyProbe({ failed: true })).toBe('unreadable');
    expect(resolveProbes(['deployed', 'unreadable', 'not-deployed'])).toEqual(['deployed', 'unreadable', 'not-deployed']);
    expect(resolveProbes(['unreadable', 'unreadable'])).toEqual(['unreachable', 'unreachable']);
  });
});

describe('realtimeCoverage', () => {
  it('lists which listened-to tables publish changes and which do not', () => {
    const c = realtimeCoverage(['visits', 'transactions', 'something_else']);
    expect(c.published).toEqual(['transactions', 'visits']);
    expect(c.missing).toHaveLength(APP_REALTIME_TABLES.length - 2);
    expect(realtimeCoverage([]).published).toEqual([]);
    expect(realtimeCoverage([...APP_REALTIME_TABLES]).missing).toEqual([]);
  });
});

describe('formatting', () => {
  it('formats sizes and token lifetimes', () => {
    expect(formatBytes(15_535_251)).toBe('14.8 MB');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(-1)).toBe('—');
    expect(minutesLeft(1_000_000 + 600, 1_000_000_000)).toBe(10);
    expect(minutesLeft(1, 1_000_000_000)).toBe(0);
    expect(minutesLeft(null, 0)).toBeNull();
  });
});

/** The checks are only honest if the lists they run over match the code. */
describe('the page stays in step with the code', () => {
  it('lists exactly the edge functions that exist in supabase/functions', () => {
    const dir = join(root, 'supabase', 'functions');
    const onDisk = readdirSync(dir).filter((n) => !n.startsWith('_') && statSync(join(dir, n)).isDirectory()).sort();
    expect(EDGE_FUNCTIONS.map((f) => f.slug).sort()).toEqual(onDisk);
  });

  it('lists exactly the tables the app subscribes to for live changes', () => {
    const found = new Set<string>();
    const walk = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) { walk(p); continue; }
        if (!/\.(ts|tsx)$/.test(n) || /\.test\./.test(n)) continue;
        const text = readFileSync(p, 'utf-8');
        for (const m of text.matchAll(/postgres_changes'?,\s*\{[^}]*?table:\s*'([a-z_]+)'/g)) found.add(m[1]);
      }
    };
    walk(join(root, 'src'));
    expect([...found].sort()).toEqual([...APP_REALTIME_TABLES].sort());
  });
});
