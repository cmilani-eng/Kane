/**
 * End-screen APM tip (HUD label only).
 * Format: APM · {n} — middot (U+00B7).
 * Actions per minute from player command tally ÷ match minutes.
 * Distinct from Avg APM · / Best APM · / Time · peers; same en/pt-BR/es
 * copy as pause APM · tip (distinct i18n key / surface).
 */
import { t } from '../../i18n';

/** Round actions-per-minute for the match clock. */
export function matchApm(actions: number, durationMs: number): number {
  const a = Math.max(0, Math.floor(actions));
  const ms = Math.max(0, Math.floor(durationMs));
  if (ms <= 0) return 0;
  return Math.round(a / (ms / 60_000));
}

export function endApmTipLine(actions: number, durationMs: number): string {
  return t('end.apmTip', { n: matchApm(actions, durationMs) });
}
