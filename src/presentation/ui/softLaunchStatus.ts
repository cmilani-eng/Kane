/**
 * Soft-launch status strip copy for the menu — posture only, no gameplay.
 * Ads / age-gate chrome intentionally omitted from the player-facing strip.
 * See docs/soft-launch.md.
 */
import { flags } from '../../config/flags';
import { getAdminAccessMode } from '../../database/adminAllowlist';
import { loadCosmeticsLoadout } from '../../database/cosmeticsLoadout';
import { HOSTING_PREVIEW } from '../../firebase/hostingPreview';
import { getMasterVolume } from '../audio/sfx';

/** Compact one-liner for the title menu. */
export function softLaunchStatusStrip(): string {
  const hostBit = flags.hostingPreviewConfig
    ? `host ${HOSTING_PREVIEW.channelId}`
    : 'host n/a';
  const adminBit = `admin ${getAdminAccessMode()}`;
  const loadout = loadCosmeticsLoadout();
  const cosBit = `skin ${loadout.equipped.nobles.replace(/^skin_/, '').slice(0, 8)}`;
  const volBit = `vol ${Math.round(getMasterVolume() * 100)}`;
  const pwaBit = 'pwa';
  // Canonical play URL after the multi-game hub (see games/PATHS.md).
  const playBit = '/kane';
  return `${hostBit} · ${adminBit} · ${cosBit} · ${volBit} · ${pwaBit} · ${playBit}`;
}
