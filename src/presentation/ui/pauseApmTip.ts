/**
 * Pause overlay APM tip (HUD label only).
 * Same actions÷minutes math as the end-screen APM tip; frozen at pause open.
 */
import { t } from '../../i18n';
import { matchApm } from './endApmTip';

/** APM · {n} — live match rate from playerActions ÷ elapsed minutes. */
export function pauseApmTipLine(actions: number, elapsedMs: number): string {
  return t('pause.apmTip', { n: matchApm(actions, elapsedMs) });
}
