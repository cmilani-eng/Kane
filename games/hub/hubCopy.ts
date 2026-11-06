import { t, type MessageKey } from '../../src/i18n';

const HUB_BLURB: Record<string, MessageKey> = {
  kane: 'hub.kane.blurb',
  'blob-evolution': 'hub.blob.blurb',
};

export function hubChrome(): {
  title: string;
  subtitle: string;
  meta: string;
  play: string;
  live: string;
  experimental: string;
  privacy: string;
  terms: string;
  language: string;
} {
  return {
    title: t('hub.title'),
    subtitle: t('hub.subtitle'),
    meta: t('hub.meta'),
    play: t('hub.play'),
    live: t('hub.live'),
    experimental: t('hub.experimental'),
    privacy: t('menu.privacy'),
    terms: t('menu.terms'),
    language: t('menu.language'),
  };
}

/** Card blurb. Titles and taglines stay as written in games.json. */
export function hubBlurb(id: string, fallback: string): string {
  const key = HUB_BLURB[id];
  return key ? t(key) : fallback;
}
