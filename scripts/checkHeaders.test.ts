import { describe, expect, it } from 'vitest';
import firebaseJson from '../firebase.json';
import games from '../games/games.json';
import { checkSite, checkSiteWithRetries, expectedSecurityHeaders } from './checkHeaders.mjs';

const BASE = 'https://example.test';
const ASSET = '/assets/index-abc.js';
const security = expectedSecurityHeaders(firebaseJson) as Record<string, string>;

type Overrides = Record<string, { headers?: Record<string, string | null>; status?: number; body?: string }>;

/** A fake site that is correct unless an override says otherwise (`null` removes a header). */
function site(overrides: Overrides = {}) {
  return async (url: URL) => {
    const path = url.pathname;
    const override = overrides[path] ?? {};
    const headers: Record<string, string | null> = {
      ...security,
      'strict-transport-security': 'max-age=31556926',
      'cache-control': path.startsWith('/assets/') ? 'public,max-age=31536000,immutable' : 'no-cache',
      ...override.headers,
    };
    const sent = Object.fromEntries(Object.entries(headers).filter(([, v]) => v !== null)) as Record<string, string>;
    const body = override.body ?? (path === '/' ? `<script src="${ASSET}"></script>` : '');
    return new Response(body, { status: override.status ?? 200, headers: sent });
  };
}

const check = (fetchImpl: (url: URL) => Promise<Response>) =>
  checkSite(BASE, { fetchImpl: fetchImpl as typeof fetch, firebaseJson, games });

describe('expectedSecurityHeaders', () => {
  it('reads the headers firebase.json sends on every path', () => {
    expect(Object.keys(security).sort()).toEqual([
      'permissions-policy',
      'referrer-policy',
      'x-content-type-options',
      'x-frame-options',
    ]);
  });
});

describe('checkSite', () => {
  it('passes when every page and the hashed asset carry the right headers', async () => {
    expect(await check(site())).toEqual([]);
  });

  it('reports a page that lost a security header', async () => {
    const problems = await check(site({ '/kane/': { headers: { 'x-frame-options': null } } }));
    expect(problems).toEqual(['/kane/: x-frame-options is missing, expected "DENY"']);
  });

  it('reports a header with the wrong value', async () => {
    const problems = await check(site({ '/privacy': { headers: { 'x-content-type-options': 'sniff' } } }));
    expect(problems).toEqual(['/privacy: x-content-type-options is "sniff", expected "nosniff"']);
  });

  it('reports a missing HSTS header', async () => {
    const problems = await check(site({ '/': { headers: { 'strict-transport-security': null } } }));
    expect(problems).toEqual(['/: strict-transport-security is missing']);
  });

  it('reports a page that is cached', async () => {
    const problems = await check(site({ '/blob-evolution/': { headers: { 'cache-control': 'max-age=3600' } } }));
    expect(problems).toEqual(['/blob-evolution/: cache-control is "max-age=3600", expected "no-cache"']);
  });

  it('reports a hashed asset that is not immutable', async () => {
    const problems = await check(site({ [ASSET]: { headers: { 'cache-control': 'no-cache' } } }));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(`${ASSET}: cache-control is "no-cache"`);
  });

  it('reports a page that does not answer 200', async () => {
    const problems = await check(site({ '/terms': { status: 404 } }));
    expect(problems).toEqual(['/terms: status 404, expected 200']);
  });

  it('reports when no hashed asset is linked from any page', async () => {
    const problems = await check(site({ '/': { body: '<p>no scripts</p>' } }));
    expect(problems).toEqual(['no hashed /assets/*.js file is linked from any page']);
  });

  it('checks every game page in games.json', async () => {
    const seen: string[] = [];
    const fetchImpl = site();
    await check(async (url) => {
      seen.push(url.pathname);
      return fetchImpl(url);
    });
    for (const { id } of games) expect(seen).toContain(`/${id}/`);
  });
});

describe('checkSiteWithRetries', () => {
  const options = { firebaseJson, games };
  const fast = { attempts: 3, delayMs: 0 };
  // `/`, one page per game, `/privacy`, `/terms`, the manifest, then the hashed asset.
  const requestsPerPass = 1 + games.length + 3 + 1;

  it('succeeds when a later attempt sees the new release', async () => {
    let calls = 0;
    const good = site();
    const bad = site({ '/': { headers: { 'x-frame-options': null } } });
    const fetchImpl = async (url: URL) => (++calls <= requestsPerPass ? bad(url) : good(url));
    expect(await checkSiteWithRetries(BASE, { ...options, fetchImpl }, fast)).toEqual([]);
    expect(calls).toBe(requestsPerPass * 2);
  });

  it('gives up after the last attempt and returns the problems', async () => {
    const fetchImpl = site({ '/': { headers: { 'x-frame-options': null } } });
    const problems = await checkSiteWithRetries(BASE, { ...options, fetchImpl }, fast);
    expect(problems).toEqual(['/: x-frame-options is missing, expected "DENY"']);
  });

  it('reports a network failure instead of throwing', async () => {
    const fetchImpl = async () => {
      throw new Error('offline');
    };
    const problems = await checkSiteWithRetries(BASE, { ...options, fetchImpl }, fast);
    expect(problems).toEqual(['request failed: offline']);
  });
});
