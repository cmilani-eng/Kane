/**
 * One fixed step of the battlefield simulation. The scene calls this on a fixed
 * timer, never with the frame delta, so two clients that run the same steps with
 * the same commands end in the same state. Sounds, camera and other presentation
 * work stay in the scene.
 */
import type { AiState } from './battlefieldAi';
import { tickBattlefieldAi } from './battlefieldAi';
import { tickAttentionPings } from './battlefieldAttentionPing';
import { tickBattlefieldCombat } from './battlefieldCombat';
import { tickBuildings } from './battlefieldBuildings';
import { tickControlGroupFx } from './battlefieldControlGroupFx';
import { tickCoreFragments } from './battlefieldCoreFragments';
import { tickBattlefieldEconomy } from './battlefieldEconomy';
import { tickEconomyFx } from './battlefieldEconomyFx';
import { tickFog } from './battlefieldFog';
import { tickFormations } from './battlefieldFormations';
import { tickHeroes } from './battlefieldHeroes';
import { tickMutations } from './battlefieldMutations';
import { tickProduction } from './battlefieldProduction';
import { tickRage } from './battlefieldRage';
import { tickScoutPulses, spawnScoutPulsesFromFog } from './battlefieldScoutPulse';
import { tickStopFx } from './battlefieldStopFx';
import { tickWaypointMarkers } from './battlefieldWaypointMarkers';
import { tickBattlefield, type BattlefieldWorld } from './battlefieldWorld';

/** Length of one simulation step. Every gameplay timer is counted in these steps. */
export const SIM_STEP_MS = 50;

/**
 * How often the fog of war is rebuilt. This is a shared rule, not a device budget:
 * clients on different devices must rebuild it on the same steps to stay in sync.
 */
export const FOG_STEP_MS = 100;

export function stepBattlefieldSim(
  world: BattlefieldWorld,
  ai: AiState,
  dtMs = SIM_STEP_MS,
): void {
  tickBattlefield(world, dtMs);
  tickBattlefieldEconomy(world);
  tickEconomyFx(world, dtMs);
  tickStopFx(world, dtMs);
  tickControlGroupFx(world, dtMs);
  tickWaypointMarkers(world, dtMs);
  tickBuildings(world, dtMs);
  tickProduction(world, dtMs);
  tickFormations(world, dtMs);
  tickMutations(world, dtMs);
  tickRage(world, dtMs);
  tickHeroes(world, dtMs);
  tickBattlefieldAi(world, ai, dtMs);
  world.fogAccMs += dtMs;
  if (world.fogAccMs >= FOG_STEP_MS) {
    world.fogAccMs = 0;
    tickFog(world, world.fog);
    if (world.fog.exploredDirty) {
      spawnScoutPulsesFromFog(world, world.fog);
    }
  }
  tickScoutPulses(world, dtMs);
  tickAttentionPings(world, dtMs);
  tickCoreFragments(world, dtMs);
  tickBattlefieldCombat(world, dtMs);
}
