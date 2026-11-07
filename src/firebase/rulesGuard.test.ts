import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Static checks on the rule files in the repo. They cannot prove what is deployed
// (docs/security-verification.md covers that) or what a rule allows (the emulator
// tests in rules-tests/ cover that), but they catch the common ways a database ends up
// open: a test-mode rule, an unconditional grant, or a missing deny-by-default.

const read = (file: string) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

const REQUIRES_SIGN_IN = /signedIn\(|isSelf\(|request\.auth/;

describe('firestore.rules', () => {
  const code = read('firestore.rules')
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
  const allows = (code.match(/allow\s[^;]*;/g) ?? []).map((rule) => rule.replace(/\s+/g, ' '));

  it('has rules to check', () => {
    expect(code).toContain("rules_version = '2'");
    expect(allows.length).toBeGreaterThan(0);
  });

  it('has no unconditional grant and no expiring test-mode rule', () => {
    expect(code).not.toMatch(/if\s+true\s*;/);
    expect(code).not.toMatch(/request\.time\s*[<>]/);
  });

  it.each(allows.map((rule) => [rule] as const))('%s has a condition', (rule) => {
    expect(rule).toMatch(/:\s*if\s+\S/);
  });

  it.each(allows.map((rule) => [rule] as const))('%s is false or needs sign-in', (rule) => {
    const condition = rule.replace(/^[^:]*:\s*if\s+/, '').replace(/;$/, '').trim();
    expect(condition === 'false' || REQUIRES_SIGN_IN.test(condition)).toBe(true);
  });

  it('ends with a deny-by-default catch-all', () => {
    const catchAll = code.indexOf('match /{document=**}');
    expect(catchAll).toBeGreaterThan(-1);
    expect(code.lastIndexOf('match ')).toBe(catchAll);
    expect(code.slice(catchAll)).toMatch(/allow read, write: if false;/);
  });
});

describe('database.rules.json', () => {
  const rules = JSON.parse(read('database.rules.json')).rules as Record<string, unknown>;

  /** Every `.read` / `.write` grant in the tree with its path. */
  function grants(node: unknown, path: string): Array<{ path: string; key: string; value: unknown }> {
    if (typeof node !== 'object' || node === null) return [];
    return Object.entries(node).flatMap(([key, value]) =>
      key === '.read' || key === '.write' ? [{ path, key, value }] : grants(value, `${path}/${key}`),
    );
  }
  const all = grants(rules, '');

  it('has rules to check', () => {
    expect(all.length).toBeGreaterThan(0);
  });

  it('denies read and write at the root', () => {
    expect(rules['.read']).toBe(false);
    expect(rules['.write']).toBe(false);
  });

  it.each(all.map((g) => [`${g.path} ${g.key}`, g] as const))('%s is false or needs sign-in', (_label, g) => {
    expect(g.value === false || (typeof g.value === 'string' && /\bauth\b/.test(g.value))).toBe(true);
  });
});
