/**
 * Soft-launch status strip copy for the menu — posture only, no gameplay.
 * See docs/soft-launch.md.
 */
import { flags } from '../../config/flags';
import { getAdminAccessMode } from '../../database/adminAllowlist';
import { loadCosmeticsLoadout } from '../../database/cosmeticsLoadout';
import { loadAgeGate } from '../../firebase/ageGate';
import { HOSTING_PREVIEW } from '../../firebase/hostingPreview';

/** Compact one-liner for the title menu. */
export function softLaunchStatusStrip(): string {
  const age = loadAgeGate();
  const ageBit =
    age.status === 'ok'
      ? `age ${flags.ageGateMinYears}+`
      : age.status === 'blocked'
        ? 'age blocked'
        : 'age pending';
  const adsBit = flags.adsEnabled ? 'ads ON' : 'ads off';
  const hostBit = flags.hostingPreviewConfig
    ? `host ${HOSTING_PREVIEW.channelId}`
    : 'host n/a';
  const adminBit = `admin ${getAdminAccessMode()}`;
  const loadout = loadCosmeticsLoadout();
  const cosBit = `skin ${loadout.equipped.nobles.replace(/^skin_/, '').slice(0, 8)}`;
  return `${adsBit} · ${ageBit} · ${hostBit} · ${adminBit} · ${cosBit}`;
}
