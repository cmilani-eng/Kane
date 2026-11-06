/**
 * Idle workers chip gather-type tip (HUD label only).
 * Distinct from the cargo / plain idle chip lines.
 */
import type { ResourceId } from '../../data/resources';
import { t } from '../../i18n';

export function idleWorkerGatherTypeTip(
  resourceId: ResourceId | null,
): string | null {
  if (resourceId == null) return null;
  const resource =
    resourceId === 'gold'
      ? t('hud.resourceGold')
      : resourceId === 'magic_crystals'
        ? t('hud.resourceCrystals')
        : null;
  if (resource == null) return null;
  return t('hud.idleGatherType', { resource });
}
