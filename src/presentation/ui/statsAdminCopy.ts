import {
  canAccessAdmin,
  getAdminAccessMode,
  loadAdminAllowlist,
  localAdminCandidateId,
} from '../../database/adminAllowlist';
import {
  loadDailyRollup,
  type DailyRollupStore,
} from '../../database/dailyStatsRollup';
import {
  loadModerationLog,
  type ModerationStore,
} from '../../database/moderationStub';
import { t } from '../../i18n';

export function adminRollupText(
  store: DailyRollupStore = loadDailyRollup(),
  limit = 3,
): string {
  if (store.days.length === 0) return t('stats.rollupEmpty');
  const shown = store.days.slice(0, limit);
  const lines = [t('stats.rollupHead', { n: shown.length })];
  for (const day of shown) {
    const mins = Math.round(day.durationMs / 60000);
    lines.push(
      `  ${t('stats.rollupLine', {
        day: day.day,
        matches: day.matches,
        wins: day.wins,
        losses: day.losses,
        mins,
        brutes: day.bySpecies.brutes.matches,
        nobles: day.bySpecies.nobles.matches,
        weirdos: day.bySpecies.weirdos.matches,
      })}`,
    );
  }
  return lines.join('\n');
}

export function adminAllowlistText(): string {
  const state = loadAdminAllowlist();
  const mode = getAdminAccessMode();
  const you = localAdminCandidateId();
  const lines = [
    t('stats.accessMode', {
      mode,
      note: mode === 'open' ? t('stats.accessOpen') : '',
    }),
    t('stats.allowlist', { n: state.ids.length }),
    ...state.ids.map((id) => `  - ${id}`),
    '',
    t('stats.device', {
      id: you,
      access: canAccessAdmin(you) ? t('stats.allowed') : t('stats.denied'),
    }),
  ];
  return lines.join('\n');
}

export function adminModerationText(
  store: ModerationStore = loadModerationLog(),
  limit = 3,
): string {
  if (store.events.length === 0) return t('stats.modEmpty');
  const shown = store.events.slice(0, limit);
  const lines = [t('stats.modHead', { n: shown.length })];
  for (const event of shown) {
    lines.push(
      `  ${t('stats.modLine', {
        action: event.action,
        target: event.targetId,
        reason: event.reason,
      })}`,
    );
  }
  return lines.join('\n');
}

export function adminToolsBody(): string {
  return [
    t('stats.adminTools'),
    adminRollupText(),
    '',
    adminAllowlistText(),
    '',
    adminModerationText(),
  ].join('\n');
}
