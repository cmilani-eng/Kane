/**
 * Lobby tip for remembered map world size from match prefs + MAP catalog.
 * Distinct from Last map · name tip.
 */
import { MAP } from '../../config/balance';
import { loadMatchPrefs } from '../../database/matchPrefs';
import { isSkirmishMapId } from '../../data/skirmishMaps';
import { t } from '../../i18n';

/** Map · {w}×{h} — world size for the remembered skirmish map. */
export function lobbyLastMapSizeTipLine(): string | null {
  const mapId = loadMatchPrefs().mapId;
  if (!isSkirmishMapId(mapId)) return null;
  // All skirmish layouts share the battlefield MAP bounds.
  return t('lobby.lastMapSizeTip', {
    w: MAP.width,
    h: MAP.height,
  });
}
