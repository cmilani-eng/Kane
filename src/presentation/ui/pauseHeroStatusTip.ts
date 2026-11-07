/**
 * Pause overlay hero status tip (HUD label only).
 * Format: Hero · Ready / Down / {sector} — middot (U+00B7).
 * Same Ready / Down / sector logic as minimap — frozen at pause open.
 * Distinct from Cam · / Focus · / Army · / Selected · pause peers;
 * same en/pt-BR/es copy as minimap Hero tip (`hud.minimapHeroReady` /
 * `hud.minimapHeroDown` / `hud.minimapHeroSector`), own keys.
 */
import { t } from '../../i18n';
import type { MinimapHeroStatus } from './minimapHeroStatusTip';

/** Hero · Ready / Down / sector — frozen pause snapshot. */
export function pauseHeroStatusTipLine(status: MinimapHeroStatus): string {
  if (status.kind === 'ready') return t('pause.heroReady');
  if (status.kind === 'down') return t('pause.heroDown');
  return t('pause.heroSector', { sector: status.sector });
}
