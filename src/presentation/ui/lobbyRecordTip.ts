/**
 * Lobby tip for career win–loss record from match prefs.
 * Format: Record · {w}–{l} — middot (U+00B7) with single spaces, en-dash
 * (U+2013); en/pt-BR/es middot. Lobby-only (no pause/end Record · twin).
 * Distinct from Wins · / Losses · / Win rate · / Played · peers.
 */
import { t } from '../../i18n';
import { lobbyLossesCount } from './lobbyLossesTip';
import { lobbyWinsCount } from './lobbyWinsTip';

/** Null when prefs have no finished games counted yet. */
export function lobbyRecordTipLine(): string | null {
  const w = lobbyWinsCount();
  const l = lobbyLossesCount();
  if (w == null || l == null) return null;
  return t('lobby.recordTip', { w, l });
}
