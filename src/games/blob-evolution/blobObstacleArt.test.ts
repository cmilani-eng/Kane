import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { disposeModel, makeHazardModel, makeSceneryModel } from './blobObstacleArt';
import {
  HAZARD_KINDS,
  HAZARD_SPECS,
  HAZARD_WARNING_SECONDS,
  type Hazard,
  type HarmlessObstacle,
  spawnHazard,
  createHazardField,
} from './blobObstacles';

const SCENERY: HarmlessObstacle[] = [
  { kind: 'tree', x: 4, z: 5, radius: 1.5 },
  { kind: 'puddle', x: -6, z: 2, radius: 3 },
];

function hazard(kind: (typeof HAZARD_KINDS)[number], phase: Hazard['phase'], age = 0): Hazard {
  const h = spawnHazard(createHazardField(() => 0.5), kind, 3, -2, () => 0.5);
  h.phase = phase;
  h.age = age;
  return h;
}

/** Every geometry, material, texture and instanced mesh under a model. */
function resources(root: THREE.Object3D): Set<THREE.EventDispatcher<{ dispose: object }>> {
  const found = new Set<THREE.EventDispatcher<{ dispose: object }>>();
  root.traverse((obj) => {
    if (obj instanceof THREE.InstancedMesh) found.add(obj as never);
    const mesh = obj as Partial<THREE.Mesh>;
    if (mesh.geometry) found.add(mesh.geometry as never);
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const material of materials) {
      found.add(material as never);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) found.add(value as never);
    }
  });
  return found;
}

function expectAllFreed(root: THREE.Object3D): void {
  const all = resources(root);
  expect(all.size).toBeGreaterThan(0);
  const freed = new Set<unknown>();
  for (const item of all) item.addEventListener('dispose', () => freed.add(item));
  disposeModel(root);
  expect(freed.size).toBe(all.size);
}

/** How far a model's meshes reach from its centre along the ground. */
function groundReach(root: THREE.Object3D): number {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const centre = new THREE.Vector3().setFromMatrixPosition(root.matrixWorld);
  return Math.max(box.max.x - centre.x, centre.x - box.min.x, box.max.z - centre.z, centre.z - box.min.z);
}

describe('obstacle models', () => {
  it.each(SCENERY)('stand where the rules put the $kind and are no wider than it', (obstacle) => {
    const model = makeSceneryModel(obstacle);
    expect(model.group.position.x).toBe(obstacle.x);
    expect(model.group.position.z).toBe(obstacle.z);
    model.animate(1.23);
    expect(groundReach(model.group)).toBeLessThanOrEqual(obstacle.radius * 1.08);
    expect(groundReach(model.group)).toBeGreaterThan(obstacle.radius * 0.85);
  });

  it.each(SCENERY)('free everything the $kind used', (obstacle) => {
    expectAllFreed(makeSceneryModel(obstacle).group);
  });

  it.each(HAZARD_KINDS)('show only the marker while a %s is warning, then the real thing', (kind) => {
    const model = makeHazardModel(kind, HAZARD_SPECS[kind].radius);
    model.pose(hazard(kind, 'warning', HAZARD_WARNING_SECONDS / 2), 0.5);
    expect(model.marker.visible).toBe(true);
    expect(model.body.visible).toBe(false);
    model.pose(hazard(kind, 'active', 3), 0.5);
    expect(model.marker.visible).toBe(false);
    expect(model.body.visible).toBe(true);
    expect(model.group.position.x).toBe(3);
    expect(model.group.position.z).toBe(-2);
  });

  it.each(HAZARD_KINDS)('free everything the %s used', (kind) => {
    const model = makeHazardModel(kind, HAZARD_SPECS[kind].radius);
    model.pose(hazard(kind, 'active', 3), 2);
    expectAllFreed(model.group);
  });

  it('shares nothing between two models, so removing one leaves the other whole', () => {
    for (const kind of HAZARD_KINDS) {
      const first = resources(makeHazardModel(kind, HAZARD_SPECS[kind].radius).group);
      const second = resources(makeHazardModel(kind, HAZARD_SPECS[kind].radius).group);
      for (const item of second) expect(first.has(item)).toBe(false);
    }
  });
});
