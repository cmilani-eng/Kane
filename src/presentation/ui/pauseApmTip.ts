/**
 * Pause overlay APM tip (HUD label only).
 * Format: APM · {n} — middot (U+00B7).
 * Same actions÷minutes math as the end-screen APM tip; frozen at pause open.
 * Distinct from Avg APM · / Best APM · / Time · peers; same en copy as end
 * APM · tip (distinct i18n key / surface).
 */
import { t } from '../../i18n';
import { matchApm } from './endApmTip';

/** APM · {n} — live match rate from playerActions ÷ elapsed minutes. */
export function pauseApmTipLine(actions: number, elapsedMs: number): string {
  return t('pause.apmTip', { n: matchApm(actions, elapsedMs) });
}
