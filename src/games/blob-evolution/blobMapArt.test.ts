import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { followCamera } from './blobArt';
import { buildArena } from './blobMapArt';
import { ARENA, MAPS, MAP_IDS } from './blobRules';

const THEMED = [MAPS.playground, MAPS.castle];

/** The box round every drawn thing, one per instance for instanced meshes. */
function pieces(root: THREE.Object3D): THREE.Box3[] {
  root.updateMatrixWorld(true);
  const boxes: THREE.Box3[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.geometry) return;
    mesh.geometry.computeBoundingBox();
    const local = mesh.geometry.boundingBox as THREE.Box3;
    if (obj instanceof THREE.InstancedMesh) {
      const instance = new THREE.Matrix4();
      for (let i = 0; i < obj.count; i++) {
        obj.getMatrixAt(i, instance);
        boxes.push(local.clone().applyMatrix4(instance).applyMatrix4(obj.matrixWorld));
      }
      return;
    }
    boxes.push(local.clone().applyMatrix4(mesh.matrixWorld));
  });
  return boxes;
}

function build(map: (typeof MAPS)[keyof typeof MAPS]) {
  const scene = new THREE.Scene();
  const arena = buildArena(scene, map);
  return { scene, arena };
}

function sunOf(root: THREE.Object3D): THREE.DirectionalLight {
  let sun: THREE.DirectionalLight | null = null;
  root.traverse((obj) => {
    if (obj instanceof THREE.DirectionalLight) sun = obj;
  });
  if (!sun) throw new Error('no sun');
  return sun;
}

describe('the map scenery', () => {
  it.each(MAP_IDS)('puts the whole %s arena in one piece, with its own sky', (id) => {
    const { scene, arena } = build(MAPS[id]);
    expect(scene.children).toEqual([arena.group]);
    expect(scene.background).toBeInstanceOf(THREE.Color);
    expect(scene.fog).not.toBeNull();
  });

  it('gives each map a sky of its own', () => {
    const skies = MAP_IDS.map((id) => (build(MAPS[id]).scene.background as THREE.Color).getHex());
    expect(new Set(skies).size).toBe(3);
    expect(skies[0]).toBe(0x071321);
  });

  it('keeps the original night arena: its ring boundary at the old size and a sun that stays put', () => {
    const { arena } = build(MAPS.dark);
    let ring = 0;
    arena.group.traverse((obj) => {
      const geometry = (obj as THREE.Mesh).geometry;
      if (geometry instanceof THREE.TorusGeometry) ring = geometry.parameters.radius;
    });
    expect(ring).toBe(ARENA);
    const before = sunOf(arena.group).position.clone();
    arena.update(20, -20, 3);
    expect(sunOf(arena.group).position).toEqual(before);
  });

  /** Where a point shows on screen (-1 to 1 both ways), seen from the start of a game. */
  function onScreen(lookAhead: number, point: THREE.Vector3): THREE.Vector3 {
    const camera = new THREE.PerspectiveCamera(52, 4 / 3, 0.1, 180);
    for (let i = 0; i < 600; i++) followCamera(camera, 0, 0, 1 / 60, lookAhead);
    camera.updateMatrixWorld(true);
    return point.clone().project(camera);
  }

  it.each(THEMED)('shows the far edge of the $id from the start, with the blob still in view', (map) => {
    const { arena } = build(map);
    const farEdge = onScreen(arena.lookAhead, new THREE.Vector3(0, 1.2, -(map.half + 0.5)));
    expect(farEdge.y).toBeLessThan(0.95);
    const player = onScreen(arena.lookAhead, new THREE.Vector3(0, 0.5, 0));
    expect(player.y).toBeLessThan(0);
    expect(player.y).toBeGreaterThan(-0.5);
    // Without looking ahead, that edge would be off the top of the screen on the castle.
    if (map.id === 'castle') expect(onScreen(0, new THREE.Vector3(0, 1.2, -(map.half + 0.5))).y).toBeGreaterThan(1);
  });

  it('leaves the original view as it was', () => {
    expect(build(MAPS.dark).arena.lookAhead).toBe(0);
    expect(onScreen(0, new THREE.Vector3(0, 0, 0)).y).toBeCloseTo(0, 2);
  });

  it.each(THEMED)('carries the shadows along with the player on the $id', (map) => {
    const { arena } = build(map);
    arena.update(map.half - 5, -(map.half - 5), 1);
    const sun = sunOf(arena.group);
    expect(sun.target.position.x).toBe(map.half - 5);
    expect(sun.target.position.z).toBe(-(map.half - 5));
    expect(sun.target.parent).not.toBeNull();
  });

  it.each(THEMED)('keeps the $id play area flat, so no scenery passes for an obstacle', (map) => {
    const { arena } = build(map);
    arena.update(0, 0, 2.5);
    const inside = map.half - 0.5;
    const standing = pieces(arena.group).filter(
      (box) => box.min.x < inside && box.max.x > -inside && box.min.z < inside && box.max.z > -inside && box.max.y > 0,
    );
    expect(standing).toHaveLength(0);
  });

  it.each(THEMED)('marks every edge of the $id where blobs are stopped', (map) => {
    const { arena } = build(map);
    const boxes = pieces(arena.group).filter((box) => box.max.y > 0);
    const near = (value: number) => value >= map.half - 0.25 && value <= map.half + 2.5;
    const sides: ((box: THREE.Box3) => boolean)[] = [
      (box) => near(box.min.x) && box.min.z < 0 && box.max.z > -map.half,
      (box) => near(-box.max.x) && box.min.z < 0 && box.max.z > -map.half,
      (box) => near(box.min.z) && box.min.x < map.half && box.max.x > -map.half,
      (box) => near(-box.max.z) && box.min.x < map.half && box.max.x > -map.half,
    ];
    for (const side of sides) expect(boxes.some(side)).toBe(true);
  });

  it.each(THEMED)('never lets $id scenery hide a blob from the camera', (map) => {
    const { arena } = build(map);
    arena.update(0, 0, 2.5);
    for (const box of pieces(arena.group)) {
      // The camera looks in from the +z side, so that edge has to stay low.
      if (box.min.z >= map.half - 0.25 && box.min.x < map.half && box.max.x > -map.half) {
        expect(box.max.y).toBeLessThanOrEqual(0.8);
      }
      // It also sits a little to the +x side: nothing tall may stand along that wall.
      if (box.min.x >= map.half - 0.25 && box.min.z < map.half && box.max.z > -map.half + 1) {
        expect(box.max.y).toBeLessThanOrEqual(4.8);
      }
    }
  });

  it.each(MAP_IDS)('takes the %s away completely and frees it', (id) => {
    const { scene, arena } = build(MAPS[id]);
    const owned = new Set<THREE.BufferGeometry | THREE.Material>();
    let lights = 0;
    let lightsFreed = 0;
    arena.group.traverse((obj) => {
      const mesh = obj as Partial<THREE.Mesh>;
      if (mesh.geometry) owned.add(mesh.geometry);
      if (mesh.material) for (const m of [mesh.material].flat()) owned.add(m);
      if (obj instanceof THREE.DirectionalLight || obj instanceof THREE.PointLight) {
        lights++;
        const dispose = obj.dispose.bind(obj);
        obj.dispose = () => {
          lightsFreed++;
          dispose();
        };
      }
    });
    let freed = 0;
    for (const item of owned) (item as THREE.EventDispatcher<{ dispose: object }>).addEventListener('dispose', () => freed++);
    arena.dispose();
    expect(scene.children).toHaveLength(0);
    expect(freed).toBe(owned.size);
    expect(lights).toBeGreaterThan(0);
    expect(lightsFreed).toBe(lights);
  });
});
