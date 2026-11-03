import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, normalize, relative, sep } from 'node:path';
import { ALLOWED_DOMAIN_DEPS, COMPOSERS, DOMAINS, domainOf } from './domains';

/**
 * Module boundaries, checked from the import statements:
 * - every feature folder belongs to exactly one domain
 * - a feature imports another feature only inside its own domain, or a domain it is allowed to use
 * - code that is not a feature (domain, components, hooks, lib, utils, context, theme) never imports a feature
 */

const SRC = join(process.cwd(), 'src');
const FEATURES = join(SRC, 'features');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const isSource = (p: string) => /\.(ts|tsx)$/.test(p) && !/\.test\.(ts|tsx)$/.test(p);
const IMPORT = /(?:from\s+|import\s*\(\s*|import\s+)['"](\.{1,2}\/[^'"]*)['"]/g;

/** Every relative import in a file, resolved to a path under src. */
function importsOf(file: string): string[] {
  const text = readFileSync(file, 'utf8');
  return [...text.matchAll(IMPORT)].map((m) => normalize(join(dirname(file), m[1])));
}

const featureOf = (abs: string): string | null => {
  const rel = relative(FEATURES, abs);
  return rel.startsWith('..') ? null : rel.split(sep)[0];
};

const featureFolders = readdirSync(FEATURES).filter((n) => statSync(join(FEATURES, n)).isDirectory());

describe('module boundaries', () => {
  it('puts every feature folder in exactly one domain', () => {
    const listed = Object.values(DOMAINS).flatMap((d) => [...d.features]);
    expect(new Set(listed).size).toBe(listed.length);
    expect(featureFolders.filter((f) => !listed.includes(f))).toEqual([]);
    expect(listed.filter((f) => !featureFolders.includes(f))).toEqual([]);
  });

  it('keeps features inside their domain, except for the allowed dependencies', () => {
    const violations: string[] = [];
    for (const file of walk(FEATURES).filter(isSource)) {
      const from = featureOf(file)!;
      if (COMPOSERS.includes(from)) continue;
      const fromDomain = domainOf(from)!;
      for (const target of importsOf(file)) {
        const to = featureOf(target);
        if (!to || to === from) continue;
        const toDomain = domainOf(to)!;
        if (toDomain === fromDomain || ALLOWED_DOMAIN_DEPS[fromDomain].includes(toDomain)) continue;
        violations.push(`${from} (${fromDomain}) imports ${to} (${toDomain}): ${relative(SRC, file).split(sep).join('/')}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('keeps shared layers free of feature imports', () => {
    const offenders: string[] = [];
    for (const layer of ['domain', 'components', 'hooks', 'lib', 'utils', 'context', 'theme']) {
      const dir = join(SRC, layer);
      for (const file of walk(dir).filter(isSource)) {
        if (importsOf(file).some((t) => featureOf(t) !== null)) offenders.push(relative(SRC, file).split(sep).join('/'));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('only allows dependencies between domains that exist', () => {
    for (const [domain, deps] of Object.entries(ALLOWED_DOMAIN_DEPS)) {
      expect(Object.keys(DOMAINS)).toContain(domain);
      for (const d of deps) expect(Object.keys(DOMAINS)).toContain(d);
      expect(deps).not.toContain(domain);
    }
  });
});
