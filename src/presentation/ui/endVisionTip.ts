/**
 * End-screen vision tip (HUD label only).
 * Max living-player unit vision in map tiles at match end — same metric as
 * minimap Vision · tip, distinct surface / i18n key from minimap
 * (`hud.minimapVision`) and selection Sight · (`sel.visionTip`).
 */
import { t } from '../../i18n';

/** Vision · {n} — frozen end-screen max vision reach in tiles. */
export function endVisionTipLine(tiles: number): string {
  const n = Math.max(0, Math.floor(tiles));
  return t('end.visionTip', { n });
}
