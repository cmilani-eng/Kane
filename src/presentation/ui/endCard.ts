/**
 * End-of-match result as a picker-style card in DOM and Tailwind. It keeps the same copy,
 * numbers, buttons and one step-up offer as the Phaser end screen, in one column that fits
 * any screen.
 */
import { showPostMatchInterstitialStub } from '../../ads/adsSdkStub';
import type { SpeciesId } from '../../data/speciesStub';
import type { SkirmishMapId } from '../../data/skirmishMaps';
import type { AiDifficultyId } from '../../gameplay/battlefield/aiDifficulty';
import { nextMapAfterHardWin } from '../../gameplay/battlefield/mapStepUp';
import { nextSpeciesAfterCatalog } from '../../gameplay/battlefield/speciesStepUp';
import {
  nextDifficultyAfterWin,
  previousDifficultyAfterLoss,
} from '../../gameplay/battlefield/practiceStepUp';
import { difficultyCopy, mapCopy, speciesName, t } from '../../i18n';
import { playSfx } from '../audio/sfx';
import { formatMatchClock } from './matchClock';
import {
  PICKER_BODY_CLASSES,
  PICKER_CARD_CLASSES,
  PICKER_TAG_CLASSES,
  PICKER_TITLE_CLASSES,
} from './pickerCard';

export interface EndCardOpts {
  win: boolean;
  speciesId: SpeciesId;
  mapId: SkirmishMapId;
  difficulty?: AiDifficultyId;
  durationMs: number;
  reason?: 'keep' | 'wipe' | 'core_hold' | null;
  playerUnitsLeft?: number;
  playerBuildingsLeft?: number;
  playerUnitKills?: number;
  playerUnitLosses?: number;
  playerUnitsTrained?: number;
  playerBuildingsLost?: number;
  playerGoldGathered?: number;
  playerCrystalsGathered?: number;
  onMenu: () => void;
  onRematch: () => void;
  onStepUp?: () => void;
  onTryMap?: () => void;
  onTrySpecies?: () => void;
}

const OVERLAY_CLASSES =
  'fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[rgb(10_18_32/0.84)] p-4';
const BUTTON =
  'inline-flex min-h-12 items-center justify-center rounded-[14px] px-5 py-[11px] text-[14px] font-black uppercase shadow-[0_5px_0_rgba(0,0,0,0.45)] hover:brightness-110 active:translate-y-0.5 cursor-pointer';
const PRIMARY = `${BUTTON} bg-[#9dff6a] text-[#06121f] shadow-[0_5px_0_#4a9a2c]`;
const SECONDARY = `${BUTTON} bg-[#2a3a50] text-[#f5f8ff]`;
const QUIET = `${BUTTON} bg-[#3a4555] text-[#f5f8ff]`;
const LINE = 'mt-2 text-[15px] leading-normal text-[#bdcce0]';

interface Offer {
  label: string;
  go: () => void;
}

/** One step-up offer, chosen the same way as the Phaser end screen. */
function pickOffer(opts: EndCardOpts, played: AiDifficultyId): Offer | null {
  const stepUpTo =
    nextDifficultyAfterWin(opts.win, played) ??
    previousDifficultyAfterLoss(opts.win, played);
  const speciesOffer =
    nextSpeciesAfterCatalog(opts.win, played, opts.mapId, opts.speciesId);
  const mapOffer =
    speciesOffer == null
      ? nextMapAfterHardWin(opts.win, played, opts.mapId)
      : null;

  if (stepUpTo && opts.onStepUp) {
    return {
      label: t('end.tryEasy', { difficulty: difficultyCopy(stepUpTo).label }),
      go: opts.onStepUp,
    };
  }
  if (speciesOffer && opts.onTrySpecies) {
    return {
      label: t('end.trySpecies', { species: speciesName(speciesOffer.species) }),
      go: opts.onTrySpecies,
    };
  }
  if (mapOffer && opts.onTryMap) {
    return {
      label: t('end.tryMap', { map: mapCopy(mapOffer).label }),
      go: opts.onTryMap,
    };
  }
  return null;
}

/** Shows the end-of-match card. */
export function showEndCard(opts: EndCardOpts): void {
  showPostMatchInterstitialStub();
  const played: AiDifficultyId = opts.difficulty ?? 'normal';
  const species = speciesName(opts.speciesId);

  const overlay = document.createElement('div');
  overlay.className = OVERLAY_CLASSES;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const card = document.createElement('div');
  card.className = `${PICKER_CARD_CLASSES} my-auto text-center`;

  const tag = document.createElement('span');
  tag.className = `${PICKER_TAG_CLASSES} block w-fit mx-auto`;
  tag.textContent = t('end.meta', {
    map: mapCopy(opts.mapId).label,
    difficulty: difficultyCopy(played).label,
    clock: formatMatchClock(opts.durationMs),
  });

  const title = document.createElement('h2');
  title.className = `${PICKER_TITLE_CLASSES} text-center`;
  title.textContent = opts.win ? t('end.victory') : t('end.defeat');

  const body = document.createElement('p');
  body.className = PICKER_BODY_CLASSES;
  const coreReason = opts.reason === 'core_hold';
  body.textContent = opts.win
    ? t(coreReason ? 'end.coreVictoryBody' : 'end.victoryBody', { species })
    : t(coreReason ? 'end.coreDefeatBody' : 'end.defeatBody', { species });

  const recapHead = document.createElement('p');
  recapHead.className = 'mt-6 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#8fa7c2]';
  recapHead.textContent = t('end.recap', {
    units: opts.playerUnitsLeft ?? 0,
    buildings: opts.playerBuildingsLeft ?? 0,
  });

  const stats = document.createElement('div');
  const lines = [
    t('end.killRatio', { kills: opts.playerUnitKills ?? 0, losses: opts.playerUnitLosses ?? 0 }),
    t('end.gathered', {
      gold: opts.playerGoldGathered ?? 0,
      crystals: opts.playerCrystalsGathered ?? 0,
    }),
    t('end.trainedTip', { n: opts.playerUnitsTrained ?? 0 }),
    t('end.bldLostTip', { n: opts.playerBuildingsLost ?? 0 }),
  ];
  for (const text of lines) {
    const line = document.createElement('p');
    line.className = LINE;
    line.textContent = text;
    stats.append(line);
  }

  const offer = pickOffer(opts, played);

  const row = document.createElement('div');
  row.className = 'mt-6 flex flex-wrap justify-center gap-3';

  const rematch = document.createElement('button');
  rematch.type = 'button';
  rematch.className = PRIMARY;
  rematch.textContent = t('end.rematch');

  const menu = document.createElement('button');
  menu.type = 'button';
  menu.className = SECONDARY;
  menu.textContent = t('end.menu');

  row.append(rematch, menu);
  card.append(tag, title, body, recapHead, stats, row);

  if (offer) {
    const next = document.createElement('div');
    next.className = 'mt-4 flex flex-wrap justify-center gap-3';
    const step = document.createElement('button');
    step.type = 'button';
    step.className = QUIET;
    step.textContent = offer.label;
    step.addEventListener('click', () => {
      playSfx('ui');
      overlay.remove();
      offer.go();
    });
    next.append(step);
    card.append(next);
  }

  overlay.append(card);
  rematch.addEventListener('click', () => {
    playSfx('ui');
    overlay.remove();
    opts.onRematch();
  });
  menu.addEventListener('click', () => {
    playSfx('ui');
    overlay.remove();
    opts.onMenu();
  });

  document.body.append(overlay);
  rematch.focus();
}
