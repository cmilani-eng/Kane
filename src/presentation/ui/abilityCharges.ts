/**
 * How many times a crystal-cost ability can be cast with the current wallet.
 * Free abilities (cost 0) return null — no charge meter.
 */
export function abilityChargesLeft(
  walletCrystals: number,
  costCrystals: number,
): number | null {
  if (costCrystals <= 0) return null;
  return Math.floor(Math.max(0, walletCrystals) / costCrystals);
}
