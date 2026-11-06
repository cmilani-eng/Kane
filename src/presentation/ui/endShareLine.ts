/**
 * One-line end-of-match summary for copy / share.
 * Built from existing end-screen facts only (no invented stats).
 */
import { t } from '../../i18n';

export type EndShareInput = {
  win: boolean;
  speciesName: string;
  mapLabel: string;
  clock: string;
  units?: number;
  buildings?: number;
};

export function formatEndShareLine(input: EndShareInput): string {
  const result = input.win ? t('end.victory') : t('end.defeat');
  const bits = ['KANE', result, input.speciesName];
  if (input.mapLabel) bits.push(input.mapLabel);
  if (input.clock) bits.push(input.clock);
  if (input.units != null && input.buildings != null) {
    bits.push(
      t('end.shareStanding', {
        units: input.units,
        buildings: input.buildings,
      }),
    );
  }
  return bits.join(' · ');
}

export async function copyEndShareLine(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  return false;
}
