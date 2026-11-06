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

/** Canonical Kane soft-launch play path tip for the menu strip. */
export function softLaunchKanePathTip(path = '/kane/'): string {
  return path;
}

/** Canonical Blob Evolution soft-launch play path tip for the menu strip. */
export function softLaunchBlobPathTip(path = '/blob-evolution/'): string {
  return path;
}

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
  // Hub picker + canonical Kane / Blob play URLs (see games/PATHS.md).
  const hubBit = 'hub /';
  const playBit = softLaunchKanePathTip();
  const blobBit = softLaunchBlobPathTip();
  return `${hostBit} · ${adminBit} · ${cosBit} · ${volBit} · ${pwaBit} · ${hubBit} · ${playBit} · ${blobBit}`;
}
