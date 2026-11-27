/**
 * The player's Stats as a picker-style card in DOM and Tailwind. It shows the same record
 * and recent matches as the Phaser Stats window; the admin view stays on that window.
 */
import { loadLocalStats } from '../../database/localStats';
import { loadMatchSummaries } from '../../database/matchSummary';
import type { SpeciesId } from '../../data/speciesStub';
import { difficultyCopy, speciesName, t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import {
  PICKER_CARD_CLASSES,
  PICKER_TAG_CLASSES,
  PICKER_TITLE_CLASSES,
} from './pickerCard';

const OVERLAY_CLASSES =
  'fixed inset-0 z-[80] flex items-center justify-center bg-[rgb(10_18_32/0.84)] p-4';
const SPECIES_ORDER: SpeciesId[] = ['brutes', 'nobles', 'weirdos'];
const DONE_BUTTON =
  'mt-6 inline-flex min-h-12 items-center justify-center rounded-[14px] bg-[#9dff6a] px-7 py-[13px] text-[15px] font-black uppercase text-[#06121f] shadow-[0_5px_0_#4a9a2c] hover:brightness-110 active:translate-y-0.5 cursor-pointer';
const ROW = 'mt-2 text-[15px] leading-normal text-[#bdcce0]';
const HEAD = 'mt-5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#8fa7c2]';

/** Opens the player's Stats card. `onClose` runs once, however the card closes. */
export function showStatsCard(onClose: () => void): void {
  const stats = loadLocalStats();
  const matches = loadMatchSummaries();

  const overlay = document.createElement('div');
  overlay.className = OVERLAY_CLASSES;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', t('menu.stats'));

  const card = document.createElement('div');
  card.className = `${PICKER_CARD_CLASSES} relative max-h-[calc(100dvh-32px)] overflow-y-auto text-left`;

  const close = document.createElement('button');
  close.type = 'button';
  close.className =
    'absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-[18px] text-[#f5f8ff] hover:bg-white/20';
  close.setAttribute('aria-label', t('lobby.close'));
  close.textContent = '×';

  const tag = document.createElement('span');
  tag.className = `${PICKER_TAG_CLASSES} block w-fit mx-auto`;
  tag.textContent = t('menu.stats');

  const heading = document.createElement('h2');
  heading.className = `${PICKER_TITLE_CLASSES} text-center`;
  heading.textContent = t('stats.subtitle');

  const played = document.createElement('p');
  played.className = ROW;
  played.textContent = `${t('stats.played', { n: stats.gamesStarted })} · ${t('stats.record', {
    wins: stats.wins,
    losses: stats.losses,
  })}`;

  const bySpeciesHead = document.createElement('p');
  bySpeciesHead.className = HEAD;
  bySpeciesHead.textContent = t('stats.bySpecies');

  const species = document.createElement('div');
  for (const id of SPECIES_ORDER) {
    const r = stats.bySpecies[id];
    const line = document.createElement('p');
    line.className = ROW;
    line.textContent = t('stats.speciesLine', {
      name: speciesName(id),
      played: r.started,
      wins: r.wins,
      losses: r.losses,
    });
    species.append(line);
  }

  const recentHead = document.createElement('p');
  recentHead.className = HEAD;
  recentHead.textContent =
    matches.summaries.length === 0
      ? t('stats.recentEmpty')
      : t('stats.recentHead', { n: Math.min(4, matches.summaries.length) });

  const recent = document.createElement('div');
  for (const s of matches.summaries.slice(0, 4)) {
    const line = document.createElement('p');
    line.className = ROW;
    line.textContent = t('stats.matchLine', {
      result: s.won ? t('stats.win') : t('stats.loss'),
      species: speciesName(s.species),
      difficulty: difficultyCopy(s.difficulty).label,
      clock: formatMatchClock(s.durationMs),
    });
    recent.append(line);
  }

  const done = document.createElement('button');
  done.type = 'button';
  done.className = `${DONE_BUTTON} mx-auto`;
  done.textContent = t('stats.done');

  card.append(close, tag, heading, played, bySpeciesHead, species, recentHead, recent, done);
  overlay.append(card);

  let finished = false;
  const destroy = (): void => {
    if (finished) return;
    finished = true;
    window.removeEventListener('keydown', onKey);
    overlay.remove();
    onClose();
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') destroy();
  };

  close.addEventListener('click', destroy);
  done.addEventListener('click', destroy);
  window.addEventListener('keydown', onKey);
  document.body.append(overlay);
  done.focus();
}
