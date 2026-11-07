import type { BattlefieldWorld } from './battlefieldWorld';

/**
 * A short fingerprint of the state two clients must agree on. Each side records it
 * at the same tick and compares; a mismatch means the matches have drifted apart.
 */
export function battlefieldHash(world: BattlefieldWorld): string {
  const text = [
    ...world.units.map((u) => `u${u.id}|${u.team}|${u.x.toFixed(3)}|${u.y.toFixed(3)}|${u.hp}`),
    ...world.buildings.map((b) => `b${b.id}|${b.team}|${b.hp}`),
    JSON.stringify(world.wallet),
    JSON.stringify(world.enemyWallet),
  ].join('\n');
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
