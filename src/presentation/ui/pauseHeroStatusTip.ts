/**
 * Pause overlay hero status tip (HUD label only).
 * Same Ready / Down / sector logic as minimap — frozen at pause open.
 */
import { t } from '../../i18n';
import type { MinimapHeroStatus } from './minimapHeroStatusTip';

/** Hero · Ready / Down / sector — frozen pause snapshot. */
export function pauseHeroStatusTipLine(status: MinimapHeroStatus): string {
  if (status.kind === 'ready') return t('pause.heroReady');
  if (status.kind === 'down') return t('pause.heroDown');
  return t('pause.heroSector', { sector: status.sector });
}
