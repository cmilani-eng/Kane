/**
 * Blob Evolution — the obstacles of one game: the rules' state, and the 3D models that show
 * it. A model is made when something appears and freed as soon as it leaves.
 *
 * Called by: src/games/blob-evolution/BlobEvolutionScene.ts
 * Tested by: blobObstacleField.test.ts
 */
import type * as THREE from 'three';
import { type HazardModel, type SceneryModel, disposeModel, makeHazardModel, makeSceneryModel } from './blobObstacleArt';
import {
  type Body,
  type Hazard,
  type HazardField,
  type HarmlessObstacle,
  createHazardField,
  pickHarmlessCount,
  planHarmlessObstacles,
  stepHazardField,
} from './blobObstacles';
import { ARENA } from './blobRules';

interface HazardView {
  hazard: Hazard;
  model: HazardModel;
}

export class BlobObstacleField {
  /** The trees and puddles of this game. */
  harmless: HarmlessObstacle[] = [];
  /** The deadly hazards and their timers. */
  state: HazardField;
  private readonly scene: THREE.Scene;
  private readonly random: () => number;
  private readonly scenery: SceneryModel[] = [];
  private readonly views: HazardView[] = [];

  constructor(scene: THREE.Scene, random: () => number = Math.random) {
    this.scene = scene;
    this.random = random;
    this.state = createHazardField(random);
  }

  get hazards(): readonly Hazard[] {
    return this.state.hazards;
  }

  /** A new game on a map of half-width `arena`: new scenery, no hazards, timers from the start. */
  reset(arena: number = ARENA): void {
    this.dispose();
    this.state = createHazardField(this.random, arena);
    this.harmless = planHarmlessObstacles(pickHarmlessCount(this.random), this.random, arena);
    for (const obstacle of this.harmless) {
      const model = makeSceneryModel(obstacle);
      this.scene.add(model.group);
      this.scenery.push(model);
    }
  }

  /** Let `dt` seconds of play pass. True when a new warning has just appeared. */
  step(dt: number, player: Body): boolean {
    const nextId = this.state.nextId;
    stepHazardField(this.state, dt, player, this.harmless, this.random);
    this.sync();
    return this.state.nextId !== nextId;
  }

  /** Pose the models for this frame. Only draws, so it is safe while the game is paused. */
  render(t: number): void {
    this.sync();
    for (let i = 0; i < this.views.length; i++) this.views[i].model.pose(this.views[i].hazard, t);
    for (let i = 0; i < this.scenery.length; i++) this.scenery[i].animate(t);
  }

  /** Take every hazard out of the arena. Trees and puddles stay. */
  clearHazards(): void {
    this.state.hazards.length = 0;
    this.sync();
  }

  /** Remove everything and free it. */
  dispose(): void {
    this.clearHazards();
    for (const model of this.scenery) this.remove(model.group);
    this.scenery.length = 0;
    this.harmless = [];
  }

  private remove(group: THREE.Group): void {
    this.scene.remove(group);
    disposeModel(group);
  }

  private hasView(hazard: Hazard): boolean {
    for (let i = 0; i < this.views.length; i++) if (this.views[i].hazard === hazard) return true;
    return false;
  }

  /** Match the models to the hazards in play: free the departed, build the new. */
  private sync(): void {
    const { hazards } = this.state;
    for (let i = this.views.length - 1; i >= 0; i--) {
      if (hazards.includes(this.views[i].hazard)) continue;
      this.remove(this.views[i].model.group);
      this.views.splice(i, 1);
    }
    for (let i = 0; i < hazards.length; i++) {
      const hazard = hazards[i];
      if (this.hasView(hazard)) continue;
      const model = makeHazardModel(hazard.kind, hazard.radius);
      // Posed at once, so a new model never shows for a frame at the middle of the arena.
      model.pose(hazard, 0);
      this.scene.add(model.group);
      this.views.push({ hazard, model });
    }
  }
}
