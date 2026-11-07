import { t } from '../../src/i18n';

export function legalChrome(): { games: string; play: string; privacy: string } {
  return {
    games: `← ${t('hub.title')}`,
    play: `${t('menu.play')} KANE`,
    privacy: t('menu.privacy'),
  };
}

export function privacyCopy(): {
  title: string;
  meta: string;
  note: string;
  body: string;
  points: string[];
} {
  return {
    title: t('legal.privacyTitle'),
    meta: t('legal.privacyMeta'),
    note: t('legal.privacyNote'),
    body: t('legal.privacyBody'),
    points: [
      t('legal.privacySale'),
      t('legal.privacyAuth'),
      t('legal.privacyContact'),
    ],
  };
}

export function termsCopy(): {
  title: string;
  meta: string;
  note: string;
  points: string[];
} {
  return {
    title: t('legal.termsTitle'),
    meta: t('legal.termsMeta'),
    note: t('legal.termsNote'),
    points: [
      t('legal.termsFair'),
      t('legal.termsCosmetics'),
      t('legal.termsPrototype'),
    ],
  };
}
