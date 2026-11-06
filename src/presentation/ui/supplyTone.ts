/**
 * Supply readout warning levels for HUD / pause.
 * Near-cap = within NEAR of the hard unit cap (not a % band).
 */
import { t } from '../../i18n';

export const SUPPLY_NEAR_CAP = 4;

export type SupplyTone = 'ok' | 'near' | 'full';

export function supplyTone(
  current: number,
  cap: number,
  near = SUPPLY_NEAR_CAP,
): SupplyTone {
  if (cap <= 0) return current > 0 ? 'full' : 'ok';
  if (current >= cap) return 'full';
  if (current >= cap - near) return 'near';
  return 'ok';
}

/** Open supply slots remaining before the hard unit cap. */
export function supplySlotsLeft(current: number, cap: number): number {
  return Math.max(0, cap - current);
}

/**
 * Localized supply line — appends remaining slots when near/full.
 * HUD, pause, and stock strip share this so near-cap reads the same.
 */
export function formatSupplyLine(current: number, cap: number): string {
  const tone = supplyTone(current, cap);
  if (tone === 'near') {
    return t('pause.supplyNear', {
      current,
      cap,
      left: supplySlotsLeft(current, cap),
    });
  }
  if (tone === 'full') {
    return t('pause.supplyFull', { current, cap });
  }
  return t('pause.supply', { current, cap });
}

export const SUPPLY_TONE_COLOR: Record<SupplyTone, string> = {
  ok: '#d7e6f2',
  near: '#f0c75e',
  full: '#e87aa8',
};

export const SUPPLY_TONE_DOT: Record<SupplyTone, number> = {
  ok: 0xb8c9d9,
  near: 0xf0c75e,
  full: 0xe87aa8,
};
