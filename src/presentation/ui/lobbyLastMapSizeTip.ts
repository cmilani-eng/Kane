/**
 * Lobby tip for remembered map world size from match prefs + MAP catalog.
 * Map · {w}×{h} (U+00B7). Distinct from Last map · / Best map · / selected
 * map blurb (`lobby.mapTip`) / pause+end Map · name peers; same en copy as
 * end Map · w×h (`end.mapSizeTip`), distinct key/surface.
 */
import { MAP } from '../../config/balance';
import { loadMatchPrefs } from '../../database/matchPrefs';
import { isSkirmishMapId } from '../../data/skirmishMaps';
import { t } from '../../i18n';

/** Map · {w}×{h} — world size for the remembered skirmish map (middot U+00B7). */
export function lobbyLastMapSizeTipLine(): string | null {
  const mapId = loadMatchPrefs().mapId;
  if (!isSkirmishMapId(mapId)) return null;
  // All skirmish layouts share the battlefield MAP bounds.
  return t('lobby.lastMapSizeTip', {
    w: MAP.width,
    h: MAP.height,
  });
}
