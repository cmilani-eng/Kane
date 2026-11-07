import { describe, expect, it } from 'vitest';
import firebaseJson from '../firebase.json';

const pages = import.meta.glob('./*/index.html', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const isExternal = (url: string) => /^https?:\/\//.test(url);

function attr(tag: string, name: string): string | null {
  return tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`))?.[1] ?? null;
}

/** Every third-party script tag and module import in a page. */
function externalScripts(html: string) {
  const tags = (html.match(/<script\b[^>]*>/g) ?? []).filter((tag) => attr(tag, 'src'));
  const scripts = tags
    .map((tag) => ({ url: attr(tag, 'src')!, integrity: attr(tag, 'integrity'), crossorigin: attr(tag, 'crossorigin') }))
    .filter((s) => isExternal(s.url));

  const map = html.match(/<script\s+type="importmap"\s*>([\s\S]*?)<\/script>/)?.[1];
  const parsed = map ? (JSON.parse(map) as { imports?: Record<string, string>; integrity?: Record<string, string> }) : {};
  const modules = Object.values(parsed.imports ?? {})
    .filter(isExternal)
    .map((url) => ({ url, integrity: parsed.integrity?.[url] ?? null }));
  return { scripts, modules };
}

describe('hosting security headers', () => {
  const rule = firebaseJson.hosting[0].headers.find((r) => r.source === '**');
  const sent = Object.fromEntries((rule?.headers ?? []).map((h) => [h.key, h.value]));

  it('sends baseline security headers on every path', () => {
    expect(rule).toBeDefined();
    expect(sent['X-Content-Type-Options']).toBe('nosniff');
    expect(sent['X-Frame-Options']).toBe('DENY');
    expect(sent['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('switches off browser features no game uses', () => {
    for (const feature of ['camera', 'microphone', 'geolocation', 'payment']) {
      expect(sent['Permissions-Policy']).toContain(`${feature}=()`);
    }
  });
});

// Every game shares one origin, and with it Kane's sign-in session, so a
// changed third-party file must fail to load instead of running.
describe.each(Object.entries(pages))('third-party scripts in %s', (file, html) => {
  const { scripts, modules } = externalScripts(html);

  it.each(scripts.map((s) => [s.url, s] as const))('script %s has integrity and crossorigin', (_url, s) => {
    expect(s.integrity).toMatch(/^sha(256|384|512)-[A-Za-z0-9+/]+=*$/);
    expect(s.crossorigin).toBe('anonymous');
  });

  it.each(modules.map((m) => [m.url, m] as const))('module %s has an integrity entry', (_url, m) => {
    expect(m.integrity).toMatch(/^sha(256|384|512)-[A-Za-z0-9+/]+=*$/);
  });

  it('pins every third-party URL to an exact version', () => {
    for (const { url } of [...scripts, ...modules]) {
      expect(url, file).toMatch(/@\d+\.\d+\.\d+(?:[-+][\w.]+)?\//);
    }
  });
});
