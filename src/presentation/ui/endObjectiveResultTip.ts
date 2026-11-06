/**
 * End-screen objective result tip (HUD label only).
 * Distinct from subtitle body copy and pause Objective · mission tip.
 */
import type { MatchEndReason } from '../../gameplay/battlefield/battlefieldVictory';
import { t } from '../../i18n';

/** Result text for a known end reason; null when reason is missing. */
export function endObjectiveResultText(
  win: boolean,
  reason: MatchEndReason | undefined,
): string | null {
  if (reason == null) return null;
  const outcome = win ? 'win' : 'loss';
  return t(`end.objectiveResult.${reason}.${outcome}`);
}

/** Objective · {text} tip from match end reason. */
export function endObjectiveResultTipLine(
  win: boolean,
  reason: MatchEndReason | undefined,
): string | null {
  const text = endObjectiveResultText(win, reason);
  return text == null ? null : t('end.objectiveTip', { text });
}
