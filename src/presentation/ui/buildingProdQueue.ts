/**
 * Live production-queue tip for buildings that train units (HUD label only).
 * Formats: Queue · empty / Training · {name} / Queue · {n} — middot (U+00B7).
 * Distinct from Build · time / Build · progress / Size · / live Training ETA
 * (`sel.training`) / live Queue {n} row (`sel.queue`); selection-only tip
 * (no lobby/pause twin).
 */
import { t } from '../../i18n';

/**
 * Catalog tip for a production building:
 * - empty → Queue · empty
 * - single train → Training · {unit}
 * - deeper queue → Queue · {n}
 */
export function buildingProdQueueLabel(
  canTrain: boolean,
  queueLength: number,
  headName: string | null,
): string | null {
  if (!canTrain) return null;
  const n = Math.max(0, Math.floor(queueLength));
  if (n <= 0) return t('sel.prodQueueEmpty');
  if (n === 1 && headName) return t('sel.prodQueueTraining', { name: headName });
  return t('sel.prodQueueTip', { n });
}
