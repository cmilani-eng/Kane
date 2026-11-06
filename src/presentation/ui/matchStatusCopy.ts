import type { CoreHudModel, CoreHudTone } from '../../gameplay/battlefield/battlefieldCoreFragments';
import type { HeroAbilityHud, HeroHudState } from '../../gameplay/battlefield/battlefieldHeroes';
import { t } from '../../i18n';

/** Same colors the English substring checks used. */
export const CORE_TONE_COLOR: Record<CoreHudTone, string> = {
  win: '#f0c75e',
  lose: '#e87aa8',
  capture: '#7ec8ff',
  contest: '#f0c75e',
  enemyCapture: '#e87aa8',
  idle: '#c8e4ff',
};

export function formatCoreLine(model: CoreHudModel): string {
  const own =
    model.open > 0
      ? t('hud.coreOwnOpen', {
          ours: model.ours,
          theirs: model.theirs,
          open: model.open,
        })
      : t('hud.coreOwn', { ours: model.ours, theirs: model.theirs });
  const event = coreEvent(model);
  return event ? t('hud.coreWith', { own, event }) : t('hud.core', { own });
}

function coreEvent(model: CoreHudModel): string {
  switch (model.tone) {
    case 'contest':
      return t('hud.coreContested');
    case 'capture':
      return t('hud.coreCapturing', { pct: model.pct });
    case 'enemyCapture':
      return t('hud.coreEnemyCapture', { pct: model.pct });
    case 'win':
      return t('hud.coreWin', {
        owned: model.owned,
        needed: model.needed,
        clock: model.clock,
      });
    case 'lose':
      return t('hud.coreEnemyWin', {
        owned: model.owned,
        needed: model.needed,
        clock: model.clock,
      });
    case 'idle':
      return '';
  }
}

export function formatHeroLine(state: HeroHudState): string {
  if (state.kind === 'none') return '';
  if (state.kind === 'fallen') return t('hud.heroFallen');
  if (state.kind === 'recruit') {
    const key =
      state.id === 'zoggle'
        ? 'hud.heroRecruitZoggle'
        : state.id === 'boniface'
          ? 'hud.heroRecruitBoniface'
          : 'hud.heroRecruitGruk';
    return t(key, { gold: state.gold, crystals: state.crystals });
  }
  const chaos =
    state.chaosSec != null ? t('hud.heroChaos', { sec: state.chaosSec }) : '';
  return t('hud.heroLive', {
    name: state.name,
    hp: state.hp,
    q: state.q.name,
    qcd: abilityCd(state.q),
    w: state.w.name,
    wcd: abilityCd(state.w),
    e: state.e.name,
    ecd: abilityCd(state.e),
    chaos,
  });
}

function abilityCd(slot: HeroAbilityHud): string {
  return slot.ready ? t('hud.heroReady') : t('hud.heroCd', { sec: slot.sec });
}
