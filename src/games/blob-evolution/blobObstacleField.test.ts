import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BlobObstacleField } from './blobObstacleField';
import { HAZARD_LIFETIME_SECONDS, HAZARD_WARNING_SECONDS, spawnHazard } from './blobObstacles';

const PLAYER = { x: 0, z: 0, radius: 0.58 };

/** A repeatable random source that never returns the same value twice in a row. */
function cycle(start: number): () => number {
  let n = start;
  return () => {
    n = (n + 0.6180339887) % 1;
    return n;
  };
}

function geometriesUnder(root: THREE.Object3D): THREE.BufferGeometry[] {
  const found = new Set<THREE.BufferGeometry>();
  root.traverse((obj) => {
    const geometry = (obj as Partial<THREE.Mesh>).geometry;
    if (geometry) found.add(geometry);
  });
  return [...found];
}

/** Count how many of these get freed from now on. */
function watch(geometries: THREE.BufferGeometry[]): () => number {
  let freed = 0;
  for (const geometry of geometries) geometry.addEventListener('dispose', () => freed++);
  return () => freed;
}

function play(field: BlobObstacleField, seconds: number): number {
  let warnings = 0;
  for (let i = 0; i < Math.round(seconds * 60); i++) if (field.step(1 / 60, PLAYER)) warnings++;
  return warnings;
}

/** A game whose scenery count is fixed by the first random draw. */
function game(start = 0.37) {
  const scene = new THREE.Scene();
  const field = new BlobObstacleField(scene, cycle(start));
  field.reset();
  return { scene, field };
}

describe('the obstacles in a running game', () => {
  it('starts with one model per tree or puddle and no hazards', () => {
    for (let i = 0; i < 40; i++) {
      const { scene, field } = game(i / 40);
      expect(field.harmless.length).toBeLessThanOrEqual(5);
      expect(field.hazards).toHaveLength(0);
      expect(scene.children).toHaveLength(field.harmless.length);
    }
  });

  it('adds a model when a hazard appears and says so once', () => {
    const { scene, field } = game();
    const before = scene.children.length;
    let warnings = 0;
    for (let i = 0; i < 60 * 20 && field.hazards.length === 0; i++) if (field.step(1 / 60, PLAYER)) warnings++;
    expect(field.hazards).toHaveLength(1);
    expect(warnings).toBe(1);
    expect(scene.children).toHaveLength(before + 1);
  });

  it('removes and frees the model when a hazard expires', () => {
    const { scene, field } = game();
    field.state.spawnIn = Infinity;
    spawnHazard(field.state, 'tornado', 12, 3, cycle(0.2));
    const before = scene.children.length;
    field.render(0);
    expect(scene.children).toHaveLength(before + 1);
    const model = scene.children[scene.children.length - 1];
    const geometries = geometriesUnder(model);
    const freed = watch(geometries);
    play(field, HAZARD_WARNING_SECONDS + HAZARD_LIFETIME_SECONDS + 0.5);
    expect(field.hazards).toHaveLength(0);
    expect(scene.children).not.toContain(model);
    expect(freed()).toBe(geometries.length);
  });

  it('frees everything on a new game and lays out fresh scenery', () => {
    const { scene, field } = game();
    play(field, 14);
    const old = [...scene.children];
    expect(old.length).toBeGreaterThan(0);
    const geometries = old.flatMap(geometriesUnder);
    const freed = watch(geometries);
    field.reset();
    expect(freed()).toBe(geometries.length);
    for (const child of old) expect(scene.children).not.toContain(child);
    expect(field.hazards).toHaveLength(0);
    expect(scene.children).toHaveLength(field.harmless.length);
  });

  it('leaves the scene empty when the game closes', () => {
    const { scene, field } = game();
    play(field, 14);
    const geometries = scene.children.flatMap(geometriesUnder);
    const freed = watch(geometries);
    field.dispose();
    expect(scene.children).toHaveLength(0);
    expect(freed()).toBe(geometries.length);
    expect(field.harmless).toHaveLength(0);
    expect(field.hazards).toHaveLength(0);
  });

  it('clears the hazards but keeps the scenery for the ascension', () => {
    const { scene, field } = game();
    play(field, 14);
    expect(field.hazards.length).toBeGreaterThan(0);
    field.clearHazards();
    expect(field.hazards).toHaveLength(0);
    expect(scene.children).toHaveLength(field.harmless.length);
  });

  it('holds still while the game is paused, however often it is drawn', () => {
    const { field } = game();
    play(field, 14);
    const before = structuredClone(field.state);
    for (let frame = 0; frame < 3000; frame++) field.render(frame / 60);
    expect(field.state).toEqual(before);
  });
});
