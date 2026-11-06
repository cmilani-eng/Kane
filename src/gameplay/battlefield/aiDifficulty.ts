/**
 * Skirmish AI difficulty — Easy / Normal / Hard.
 * Tunables: economy rate + aggression (attack thresholds / think speed).
 * Easy adds a newcomer player cushion; Normal/Hard stay near parity.
 */

export type AiDifficultyId = 'easy' | 'normal' | 'hard';

export interface AiDifficultyProfile {
  id: AiDifficultyId;
  label: string;
  blurb: string;
  /** Multiplier on enemy gather deposit amounts. */
  economyRate: number;
  /** Starting gold bonus for the enemy wallet (on top of base). */
  startGoldBonus: number;
  /** Starting crystal bonus for the enemy. */
  startCrystalBonus: number;
  /** Extra starting gold for the player (Easy newcomer cushion). */
  playerStartGoldBonus: number;
  /** Extra starting crystals for the player. */
  playerStartCrystalBonus: number;
  /** AI think interval in ms (lower = reacts faster). */
  thinkMs: number;
  /** Army size that triggers attack phase. */
  attackArmyMin: number;
  /** Army size that triggers army (pre-attack) phase. */
  armyPhaseMin: number;
  /** Target scavenger / worker count. */
  workerTarget: number;
  /** Cap on trained combat units. */
  armyCap: number;
  /** Chance 0..1 to push an attack even below attackArmyMin when armyPhase. */
  pokeChance: number;
}

export const AI_DIFFICULTIES: Record<AiDifficultyId, AiDifficultyProfile> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    blurb: 'Newcomer cushion · slow AI eco',
    economyRate: 0.55,
    startGoldBonus: -60,
    startCrystalBonus: -15,
    playerStartGoldBonus: 80,
    playerStartCrystalBonus: 15,
    thinkMs: 1800,
    attackArmyMin: 10,
    armyPhaseMin: 6,
    workerTarget: 2,
    armyCap: 7,
    pokeChance: 0,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    blurb: 'Balanced pace · fair pressure',
    economyRate: 1,
    startGoldBonus: 0,
    startCrystalBonus: 0,
    playerStartGoldBonus: 0,
    playerStartCrystalBonus: 0,
    thinkMs: 900,
    attackArmyMin: 5,
    armyPhaseMin: 3,
    workerTarget: 4,
    armyCap: 10,
    pokeChance: 0.15,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    blurb: 'Fast eco · early aggression',
    economyRate: 1.35,
    startGoldBonus: 80,
    startCrystalBonus: 20,
    playerStartGoldBonus: 0,
    playerStartCrystalBonus: 0,
    thinkMs: 550,
    attackArmyMin: 3,
    armyPhaseMin: 2,
    workerTarget: 5,
    armyCap: 14,
    pokeChance: 0.45,
  },
};

export const AI_DIFFICULTY_ORDER: AiDifficultyId[] = ['easy', 'normal', 'hard'];

export function getAiDifficulty(
  id: AiDifficultyId | undefined | null,
): AiDifficultyProfile {
  if (id && id in AI_DIFFICULTIES) return AI_DIFFICULTIES[id];
  return AI_DIFFICULTIES.normal;
}
