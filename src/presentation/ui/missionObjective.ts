/**
 * Skirmish mission objective ids + pause tip copy (HUD label only).
 */
import type { AiDifficultyId } from '../../gameplay/battlefield/aiDifficulty';
import { t } from '../../i18n';

export type MissionObjectiveId = 'destroy_or_core' | 'practice_destroy';

/** Mission snapshot — current / last objective for the active skirmish. */
export interface MissionState {
  objectiveId: MissionObjectiveId;
}

/** Practice = destroy base only; otherwise Keep or CORE hold. */
export function resolveMissionObjective(
  difficulty: AiDifficultyId,
): MissionObjectiveId {
  return difficulty === 'practice' ? 'practice_destroy' : 'destroy_or_core';
}

export function missionStateForDifficulty(
  difficulty: AiDifficultyId,
): MissionState {
  return { objectiveId: resolveMissionObjective(difficulty) };
}

export function missionObjectiveText(state: MissionState): string {
  return t(`mission.objective.${state.objectiveId}`);
}

/** Pause overlay Objective · {text} tip from mission state. */
export function pauseObjectiveTipLine(state: MissionState): string {
  return t('pause.objectiveTip', { text: missionObjectiveText(state) });
}
