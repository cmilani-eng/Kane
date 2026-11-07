/**
 * Lobby tip for the most-played faction from match prefs speciesPlays.
 * Distinct from last-faction / selected motto and from end Favorite tip surface.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import type { SpeciesId } from '../../data/speciesStub';
import { speciesCopy, t } from '../../i18n';

const SPECIES_ORDER: SpeciesId[] = ['brutes', 'nobles', 'weirdos'];

/** Species with the most finished matches; ties → stable order. */
export function favoriteFactionId(): SpeciesId | null {
  const plays = loadMatchPrefs().speciesPlays;
  if (plays == null) return null;
  let best: SpeciesId | null = null;
  let bestN = 0;
  for (const id of SPECIES_ORDER) {
    const n = Math.max(0, Math.floor(plays[id] ?? 0));
    if (n <= 0) continue;
    if (best == null || n > bestN) {
      best = id;
      bestN = n;
    }
  }
  return best;
}

/** Null when no finished species plays are recorded yet. */
export function lobbyFavoriteFactionTipLine(): string | null {
  const id = favoriteFactionId();
  if (id == null) return null;
  return t('lobby.favoriteFactionTip', { name: speciesCopy(id).name });
}
