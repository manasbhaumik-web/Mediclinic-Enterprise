import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A screen that listens for changes to a table only hears anything if the database publishes that table.
 * Before this test, the app listened to a dozen tables and the database published two, so most screens only
 * updated after a manual refresh. This reads the app and the migrations and checks they agree.
 */

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const listenedTables = (): Set<string> => {
  const tables = new Set<string>();
  for (const file of walk(join(process.cwd(), 'src')).filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f))) {
    const text = readFileSync(file, 'utf8');
    if (!text.includes('postgres_changes') && !text.includes('useAuditFeed') && !/\{ source: '/.test(text)) continue;
    for (const m of text.matchAll(/table: '([a-z_]+)'/g)) tables.add(m[1]);
  }
  return tables;
};

const publishedTables = (): Set<string> => {
  const dir = join(process.cwd(), 'supabase', 'migrations');
  const tables = new Set<string>();
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql'))) {
    const text = readFileSync(join(dir, f), 'utf8');
    if (!text.includes('supabase_realtime')) continue;
    for (const m of text.matchAll(/ADD TABLE public\.([a-z_]+)/g)) tables.add(m[1]);
    for (const m of text.matchAll(/FOREACH t IN ARRAY ARRAY\[([\s\S]*?)\]/g)) {
      for (const n of m[1].matchAll(/'([a-z_]+)'/g)) tables.add(n[1]);
    }
  }
  return tables;
};

describe('realtime', () => {
  it('publishes every table the app listens to', () => {
    const published = publishedTables();
    const missing = [...listenedTables()].filter((t) => !published.has(t)).sort();
    expect(missing, `the app listens to these tables but no migration publishes them: ${missing.join(', ')}`).toEqual([]);
  });

  it('listens to the patient journey tables', () => {
    const listened = listenedTables();
    for (const t of ['visits', 'patients', 'prescriptions', 'soap_notes', 'appointments']) expect(listened.has(t), t).toBe(true);
  });
});
