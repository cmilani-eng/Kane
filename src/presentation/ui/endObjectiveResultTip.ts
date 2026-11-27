/**
 * End-screen objective result tip (HUD label only).
 * Format: Objective · {text} — middot (U+00B7) from match end reason.
 * Distinct from pause Objective · mission tip (same template, distinct
 * key/surface + body) / Difficulty · / Map · / meta map · difficulty · clock.
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

/** Objective · {text} — end-reason framing (middot U+00B7). */
export function endObjectiveResultTipLine(
  win: boolean,
  reason: MatchEndReason | undefined,
): string | null {
  const text = endObjectiveResultText(win, reason);
  return text == null ? null : t('end.objectiveTip', { text });
}
