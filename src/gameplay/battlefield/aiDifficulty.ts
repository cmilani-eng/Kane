/**
 * Skirmish AI difficulty — Easy / Normal / Hard.
 * Tunables: economy rate + aggression (attack thresholds / think speed).
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
    blurb: 'Soft economy · late rushes',
    economyRate: 0.7,
    startGoldBonus: -40,
    startCrystalBonus: -10,
    thinkMs: 1400,
    attackArmyMin: 8,
    armyPhaseMin: 5,
    workerTarget: 3,
    armyCap: 8,
    pokeChance: 0,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    blurb: 'Balanced pace · fair pressure',
    economyRate: 1,
    startGoldBonus: 0,
    startCrystalBonus: 0,
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
