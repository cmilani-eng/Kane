import { t, type MessageKey } from '../../src/i18n';

const HUB_BLURB: Record<string, MessageKey> = {
  kane: 'hub.kane.blurb',
  'blob-evolution': 'hub.blob.blurb',
};

/** Footer copyright year — pass `year` in tests; live path uses the calendar year. */
export function hubFooterYear(year: number = new Date().getFullYear()): string {
  return t('hub.year', { n: year });
}

export function hubChrome(): {
  title: string;
  documentTitle: string;
  subtitle: string;
  meta: string;
  play: string;
  live: string;
  experimental: string;
  privacy: string;
  terms: string;
  language: string;
  year: string;
} {
  return {
    title: t('hub.title'),
    documentTitle: t('hub.documentTitle'),
    subtitle: t('hub.subtitle'),
    meta: t('hub.meta'),
    play: t('hub.play'),
    live: t('hub.live'),
    experimental: t('hub.experimental'),
    privacy: t('menu.privacy'),
    terms: t('menu.terms'),
    language: t('menu.language'),
    year: hubFooterYear(),
  };
}

/** Card blurb. Titles and taglines stay as written in games.json. */
export function hubBlurb(id: string, fallback: string): string {
  const key = HUB_BLURB[id];
  return key ? t(key) : fallback;
}
