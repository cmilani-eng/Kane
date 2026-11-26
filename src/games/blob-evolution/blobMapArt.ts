/**
 * Blob Evolution — the three arenas: the original night arena (small), a sunny playground
 * (medium) and a castle courtyard at dusk (large).
 *
 * On the playground and in the castle everything inside the play area is painted flat on the
 * ground, so nothing there can be taken for an obstacle. What stands up is outside the edge,
 * and it stays low on the side the camera looks in from.
 *
 * Called by: src/games/blob-evolution/BlobEvolutionScene.ts
 * Tested by: blobMapArt.test.ts
 */
import * as THREE from 'three';
import { disposeModel } from './blobObstacleArt';
import { ARENA, type BlobMap, type MapId } from './blobRules';

export interface ArenaScenery {
  /** Everything the map put in the scene. */
  group: THREE.Group;
  /** Each frame: keeps shadows round the player on the big maps and moves the scenery. */
  update(playerX: number, playerZ: number, t: number): void;
  /** Take it all out of the scene and free it. */
  dispose(): void;
}

/** Moves a map's scenery; `t` is the render clock in seconds. */
type Animate = (t: number) => void;

interface Theme {
  /** Background and fog colour. */
  sky: number;
  fogNear: number;
  fogFar: number;
  skyLight: number;
  groundLight: number;
  ambient: number;
  sunColour: number;
  sunStrength: number;
  build(group: THREE.Group, half: number): Animate | null;
}

// ---------------------------------------------------------------- building blocks

function matte(color: number, extra: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.03, ...extra });
}

function paint(color: number, opacity = 1): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, side: THREE.DoubleSide });
}

function put(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function block(parent: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = put(parent, new THREE.BoxGeometry(w, h, d), material, x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** A round bar from one point to another. */
function bar(parent: THREE.Object3D, radius: number, from: THREE.Vector3, to: THREE.Vector3, material: THREE.Material): THREE.Mesh {
  const along = to.clone().sub(from);
  const mesh = put(parent, new THREE.CylinderGeometry(radius, radius, along.length(), 8), material);
  mesh.position.copy(from).addScaledVector(along, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), along.normalize());
  mesh.castShadow = true;
  return mesh;
}

/** A shape painted flat on the ground at height `y`. */
function onGround(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = put(parent, geometry, material, x, y, z);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

/** A painted straight line between two points on the ground. */
function line(parent: THREE.Object3D, material: THREE.Material, x1: number, z1: number, x2: number, z2: number, y: number, width = 0.2): void {
  const mesh = onGround(parent, new THREE.PlaneGeometry(Math.hypot(x2 - x1, z2 - z1) + width, width), material, (x1 + x2) / 2, y, (z1 + z2) / 2);
  mesh.rotation.z = -Math.atan2(z2 - z1, x2 - x1);
}

function outline(parent: THREE.Object3D, material: THREE.Material, x: number, z: number, w: number, d: number, y: number): void {
  line(parent, material, x - w / 2, z - d / 2, x + w / 2, z - d / 2, y);
  line(parent, material, x - w / 2, z + d / 2, x + w / 2, z + d / 2, y);
  line(parent, material, x - w / 2, z - d / 2, x - w / 2, z + d / 2, y);
  line(parent, material, x + w / 2, z - d / 2, x + w / 2, z + d / 2, y);
}

interface Place {
  x: number;
  y: number;
  z: number;
  /** Turn about the upright axis, in radians. */
  turn?: number;
  colour?: number;
}

/** One shape in many places, drawn in a single call. `flat` lays it on the ground. */
function repeat(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, places: readonly Place[], flat = false): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, places.length);
  const dummy = new THREE.Object3D();
  const colour = new THREE.Color();
  places.forEach((place, i) => {
    dummy.position.set(place.x, place.y, place.z);
    dummy.rotation.set(flat ? -Math.PI / 2 : 0, flat ? 0 : (place.turn ?? 0), 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (place.colour !== undefined) mesh.setColorAt(i, colour.set(place.colour));
  });
  mesh.receiveShadow = true;
  // Its pieces are spread round the whole map, so it is never off screen as one.
  mesh.frustumCulled = false;
  parent.add(mesh);
  return mesh;
}

/** Evenly spaced positions from `from` to `to`, at most `gap` apart, both ends included. */
function spaced(from: number, to: number, gap: number): number[] {
  const steps = Math.max(1, Math.ceil((to - from) / gap));
  return Array.from({ length: steps + 1 }, (_, i) => from + ((to - from) * i) / steps);
}

// ---------------------------------------------------------------- small: the original night arena

/** Night arena: floor, grid, glowing boundary and drifting stars, as in the original game. */
function buildNight(group: THREE.Group, half: number): null {
  const fill = new THREE.PointLight(0x3a9cff, 35, 55);
  fill.position.set(15, 9, -12);
  group.add(fill);

  onGround(group, new THREE.PlaneGeometry(100, 100), matte(0x10263a, { roughness: 0.92, metalness: 0.05 }), 0, -0.16, 0);

  const grid = new THREE.GridHelper(half * 2, 34, 0x2a5974, 0x1b3a50);
  grid.position.y = -0.145;
  group.add(grid);

  const boundary = put(group, new THREE.TorusGeometry(half, 0.16, 10, 160), new THREE.MeshStandardMaterial({ color: 0x47b8d7, emissive: 0x14546a, emissiveIntensity: 0.65 }), 0, -0.08, 0);
  boundary.rotation.x = Math.PI / 2;

  for (let i = 0; i < 70; i++) {
    put(
      group,
      new THREE.SphereGeometry(0.035 + Math.random() * 0.045, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x8ccfff, transparent: true, opacity: 0.45 }),
      (Math.random() - 0.5) * 95,
      2 + Math.random() * 17,
      (Math.random() - 0.5) * 95,
    );
  }
  return null;
}

// ---------------------------------------------------------------- medium: the playground

const CRAYONS = [0xffd23f, 0x3fa9ff, 0x56d364, 0xffffff, 0xff9f43];

/** Games painted on the tarmac: a court, hopscotch, four-square, a sun and a number trail. */
function paintPlayground(group: THREE.Group, half: number): void {
  const white = paint(0xdfeaf2, 0.85);
  const yellow = paint(0xf6cf4a, 0.9);
  const green = paint(0x7fd68a, 0.85);
  const y = -0.145;

  outline(group, white, 0, 0, 26, 18, y);
  line(group, white, 0, -9, 0, 9, y);
  onGround(group, new THREE.RingGeometry(3.2, 3.42, 48), white, 0, y + 0.002, 0);

  const hopscotch = (x: number, z: number): void => {
    const size = 2.2;
    [[0], [0], [-0.5, 0.5], [0], [-0.5, 0.5], [0]].forEach((row, i) => {
      for (const side of row) outline(group, yellow, x + side * size, z - i * size, size, size, y);
    });
  };
  const fourSquare = (x: number, z: number): void => {
    for (const dx of [-2, 2]) for (const dz of [-2, 2]) outline(group, white, x + dx, z + dz, 4, 4, y);
  };
  const sun = (x: number, z: number): void => {
    onGround(group, new THREE.CircleGeometry(2.4, 40), yellow, x, y, z);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      line(group, yellow, x + Math.cos(a) * 3, z + Math.sin(a) * 3, x + Math.cos(a) * 4.4, z + Math.sin(a) * 4.4, y, 0.4);
    }
  };
  const trail = (x: number, z: number): void => {
    const tiles = Array.from({ length: 18 }, (_, i) => ({ x: x + i * 1.35, y: y + 0.003, z: z + Math.sin(i * 0.55) * 3, colour: [0xf6cf4a, 0xe8f1f7, 0x7fd68a][i % 3] }));
    repeat(group, new THREE.PlaneGeometry(1.15, 1.15), paint(0xffffff, 0.8), tiles, true);
  };

  const q = half * 0.62;
  hopscotch(-17, 9);
  hopscotch(q, q + 6);
  fourSquare(18, -13);
  fourSquare(-q, q);
  sun(-20, -17);
  sun(q + 4, -q);
  trail(8, 17);
  trail(-q - 8, -q - 4);
  for (const [x, z] of [[q, 3], [-q, -4], [4, -q]]) {
    onGround(group, new THREE.RingGeometry(4.2, 4.45, 48), green, x, y, z);
    onGround(group, new THREE.RingGeometry(2.2, 2.4, 48), yellow, x, y + 0.002, z);
  }
}

/** A bright picket fence on three sides and a low striped kerb on the camera's side. */
function buildFence(group: THREE.Group, half: number): void {
  const edge = half + 0.32;
  const posts: Place[] = [];
  const along = spaced(-edge, edge, 1.05);
  along.forEach((at, i) => {
    const colour = CRAYONS[i % CRAYONS.length];
    posts.push({ x: at, y: 0.5, z: -edge, colour });
    posts.push({ x: edge, y: 0.5, z: at, turn: Math.PI / 2, colour });
    posts.push({ x: -edge, y: 0.5, z: at, turn: Math.PI / 2, colour });
  });
  repeat(group, new THREE.BoxGeometry(0.34, 1.35, 0.14), matte(0xffffff, { roughness: 0.6 }), posts).castShadow = true;
  repeat(group, new THREE.SphereGeometry(0.2, 10, 8), matte(0xffffff, { roughness: 0.4 }), posts.map((p) => ({ ...p, y: 1.22 })));

  const rail = matte(0xf4efe2, { roughness: 0.6 });
  for (const height of [0.3, 0.82]) {
    block(group, edge * 2, 0.14, 0.08, rail, 0, height, -edge - 0.1);
    block(group, 0.08, 0.14, edge * 2, rail, edge + 0.1, height, 0);
    block(group, 0.08, 0.14, edge * 2, rail, -edge - 0.1, height, 0);
  }
  const kerb = spaced(-half, half, 2).map((x, i) => ({ x, y: 0.02, z: half + 0.5, colour: CRAYONS[i % CRAYONS.length] }));
  repeat(group, new THREE.BoxGeometry(1.9, 0.42, 0.55), matte(0xffffff, { roughness: 0.6 }), kerb);
}

function buildSlide(parent: THREE.Group, x: number, z: number, turn: number): void {
  const slide = new THREE.Group();
  slide.position.set(x, -0.2, z);
  slide.rotation.y = turn;
  const frame = matte(0x2f80ed, { roughness: 0.4 });
  const chute = matte(0xffd23f, { roughness: 0.25, metalness: 0.15 });
  for (const px of [-2.4, -1.1]) for (const pz of [-0.7, 0.7]) bar(slide, 0.12, new THREE.Vector3(px, 0, pz), new THREE.Vector3(px, 3.6, pz), frame);
  block(slide, 1.6, 0.18, 1.6, matte(0xff9f43), -1.75, 2.4, 0);
  for (let i = 1; i <= 5; i++) block(slide, 0.14, 0.1, 1.2, frame, -3.35 + i * 0.16, i * 0.44, 0);
  const ramp = new THREE.Group();
  ramp.position.set(1.35, 1.28, 0);
  ramp.rotation.z = -0.46;
  block(ramp, 5.1, 0.14, 1.15, chute, 0, 0, 0);
  for (const side of [-0.62, 0.62]) block(ramp, 5.1, 0.34, 0.12, chute, 0, 0.15, side);
  slide.add(ramp);
  parent.add(slide);
}

function buildSwings(parent: THREE.Group, x: number, z: number): Animate {
  const swings = new THREE.Group();
  swings.position.set(x, -0.2, z);
  const frame = matte(0x56d364, { roughness: 0.4 });
  for (const side of [-3.4, 3.4]) {
    for (const lean of [-1.5, 1.5]) bar(swings, 0.15, new THREE.Vector3(side, 0, lean), new THREE.Vector3(side, 4.3, 0), frame);
  }
  bar(swings, 0.16, new THREE.Vector3(-3.6, 4.3, 0), new THREE.Vector3(3.6, 4.3, 0), frame);
  const rope = matte(0xdfe6ee, { roughness: 0.5 });
  const seat = matte(0x3fa9ff, { roughness: 0.4 });
  const hung = [-1.5, 1.5].map((at) => {
    const pivot = new THREE.Group();
    pivot.position.set(at, 4.3, 0);
    for (const side of [-0.5, 0.5]) bar(pivot, 0.04, new THREE.Vector3(side, 0, 0), new THREE.Vector3(side, -3.1, 0), rope);
    block(pivot, 1.25, 0.16, 0.55, seat, 0, -3.15, 0);
    swings.add(pivot);
    return pivot;
  });
  parent.add(swings);
  return (t) => {
    hung[0].rotation.x = Math.sin(t * 1.9) * 0.42;
    hung[1].rotation.x = Math.sin(t * 1.9 + 2.2) * 0.34;
  };
}

function buildSeesaw(parent: THREE.Group, x: number, z: number, turn: number): Animate {
  const seesaw = new THREE.Group();
  seesaw.position.set(x, -0.2, z);
  seesaw.rotation.y = turn;
  put(seesaw, new THREE.ConeGeometry(0.75, 1, 4), matte(0x3fa9ff), 0, 0.5, 0);
  const plank = new THREE.Group();
  plank.position.y = 1.1;
  block(plank, 5.6, 0.2, 0.7, matte(0xff9f43, { roughness: 0.5 }), 0, 0, 0);
  for (const side of [-2.2, 2.2]) block(plank, 0.14, 0.7, 0.5, matte(0xffd23f), side, 0.4, 0);
  seesaw.add(plank);
  parent.add(seesaw);
  return (t) => {
    plank.rotation.z = Math.sin(t * 1.4) * 0.2;
  };
}

function buildRoundabout(parent: THREE.Group, x: number, z: number): Animate {
  const wheel = new THREE.Group();
  wheel.position.set(x, 0.1, z);
  put(wheel, new THREE.CylinderGeometry(2.5, 2.5, 0.28, 32), matte(0x38506b), 0, 0, 0);
  for (let i = 0; i < 6; i++) {
    onGround(wheel, new THREE.CircleGeometry(2.35, 8, (i / 6) * Math.PI * 2, Math.PI / 3), paint(CRAYONS[i % CRAYONS.length]), 0, 0.16, 0);
  }
  const rail = matte(0xdfe6ee, { roughness: 0.3, metalness: 0.4 });
  put(wheel, new THREE.CylinderGeometry(0.14, 0.14, 1.5, 10), rail, 0, 0.8, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    bar(wheel, 0.07, new THREE.Vector3(0, 1.4, 0), new THREE.Vector3(Math.cos(a) * 2.2, 0.9, Math.sin(a) * 2.2), rail);
    bar(wheel, 0.07, new THREE.Vector3(Math.cos(a) * 2.2, 0.14, Math.sin(a) * 2.2), new THREE.Vector3(Math.cos(a) * 2.2, 0.9, Math.sin(a) * 2.2), rail);
  }
  parent.add(wheel);
  return (t) => {
    wheel.rotation.y = t * 0.8;
  };
}

function buildClimbingDome(parent: THREE.Group, x: number, z: number): void {
  const dome = new THREE.Group();
  dome.position.set(x, -0.2, z);
  const steel = matte(0xff9f43, { roughness: 0.35, metalness: 0.2 });
  for (let i = 0; i < 4; i++) {
    const arch = put(dome, new THREE.TorusGeometry(3.4, 0.11, 8, 32, Math.PI), steel);
    arch.rotation.y = (i / 4) * Math.PI;
    arch.castShadow = true;
  }
  for (const [radius, height] of [[3.15, 1.28], [2.2, 2.6]]) {
    put(dome, new THREE.TorusGeometry(radius, 0.1, 8, 40), steel, 0, height, 0).rotation.x = Math.PI / 2;
  }
  parent.add(dome);
}

function buildSandbox(parent: THREE.Group, x: number, z: number): void {
  const wood = matte(0xa86b3c);
  block(parent, 5.4, 0.5, 0.4, wood, x, 0.05, z - 2.5);
  block(parent, 5.4, 0.5, 0.4, wood, x, 0.05, z + 2.5);
  block(parent, 0.4, 0.5, 4.6, wood, x - 2.5, 0.05, z);
  block(parent, 0.4, 0.5, 4.6, wood, x + 2.5, 0.05, z);
  onGround(parent, new THREE.PlaneGeometry(4.8, 4.8), matte(0xe9cd8b), x, 0.05, z);
  put(parent, new THREE.CylinderGeometry(0.5, 0.36, 0.75, 16), matte(0x3fa9ff), x + 1.1, 0.45, z - 0.6);
  put(parent, new THREE.ConeGeometry(0.75, 0.9, 16), matte(0xd9b46c), x - 0.9, 0.5, z + 0.7);
}

function buildBench(parent: THREE.Group, x: number, z: number, turn: number): void {
  const bench = new THREE.Group();
  bench.position.set(x, -0.2, z);
  bench.rotation.y = turn;
  const wood = matte(0xc98a4b);
  block(bench, 3.4, 0.18, 0.9, wood, 0, 0.75, 0);
  block(bench, 3.4, 0.7, 0.16, wood, 0, 1.4, -0.45);
  for (const side of [-1.4, 1.4]) block(bench, 0.2, 0.75, 0.7, matte(0x38506b), side, 0.36, 0);
  parent.add(bench);
}

function buildBalloons(parent: THREE.Group, x: number, z: number): Animate {
  const bunch = new THREE.Group();
  bunch.position.set(x, -0.2, z);
  const string = matte(0xeef3f7);
  [[0, 4.6, 0], [-0.9, 3.9, 0.2], [0.9, 4, -0.2], [-0.4, 5.3, -0.4], [0.5, 5.4, 0.3]].forEach(([bx, by, bz], i) => {
    const balloon = put(bunch, new THREE.SphereGeometry(0.62, 18, 14), matte(CRAYONS[i % CRAYONS.length], { roughness: 0.2 }), bx, by, bz);
    balloon.scale.y = 1.2;
    bar(bunch, 0.02, new THREE.Vector3(0, 0, 0), new THREE.Vector3(bx, by - 0.7, bz), string);
  });
  parent.add(bunch);
  return (t) => {
    bunch.rotation.z = Math.sin(t * 0.9 + x) * 0.06;
  };
}

function buildPlayground(group: THREE.Group, half: number): Animate {
  // Grass all round, and a square of blue-grey play tarmac where the blobs are.
  onGround(group, new THREE.PlaneGeometry(half * 2 + 140, half * 2 + 140), matte(0x5fae52, { roughness: 1 }), 0, -0.21, 0);
  onGround(group, new THREE.PlaneGeometry(half * 2 + 0.8, half * 2 + 0.8), matte(0x546878, { roughness: 0.95 }), 0, -0.16, 0);
  paintPlayground(group, half);
  buildFence(group, half);

  const north = -(half + 6);
  const side = half + 6;
  const moving: Animate[] = [
    buildSwings(group, -3, north),
    buildBalloons(group, -(half - 3), -(half + 3)),
    buildBalloons(group, half - 3, -(half + 3)),
    buildBalloons(group, 10, -(half + 3)),
    buildSeesaw(group, side, -20, Math.PI / 2),
    buildRoundabout(group, side, 14),
    buildRoundabout(group, -side, -22),
    buildSeesaw(group, -side, 26, Math.PI / 2),
  ];
  buildSlide(group, -22, north, 0);
  buildSlide(group, 32, north, Math.PI);
  buildSlide(group, -side, 8, Math.PI / 2);
  buildClimbingDome(group, 19, north - 1);
  buildSandbox(group, -side, -4);
  buildSandbox(group, side, 31);
  buildBench(group, side, -3, -Math.PI / 2);
  buildBench(group, -side, 38, Math.PI / 2);

  // Round bushes and puffy clouds beyond the fence.
  const bushes: Place[] = spaced(-half, half, 7).map((x, i) => ({ x, y: 0.35, z: -(half + 12 + (i % 3) * 2) }));
  repeat(group, new THREE.SphereGeometry(1.4, 14, 10), matte(0x3f9142), bushes);
  const cloud = paint(0xffffff, 0.92);
  const puff = new THREE.SphereGeometry(1, 16, 12);
  const clouds = [-34, -6, 24, 48].map((x, i) => {
    const one = new THREE.Group();
    one.position.set(x, 10 + (i % 2) * 3.5, -(half + 24));
    for (const [px, py, size] of [[0, 0, 2.6], [2.6, -0.4, 1.9], [-2.7, -0.5, 1.8], [1, 1.2, 1.7]]) put(one, puff, cloud, px, py, 0).scale.setScalar(size);
    group.add(one);
    return { one, from: x };
  });
  put(group, new THREE.SphereGeometry(4.5, 24, 18), new THREE.MeshBasicMaterial({ color: 0xffe65a, fog: false }), -half, 24, -(half + 45));

  return (t) => {
    for (let i = 0; i < moving.length; i++) moving[i](t);
    for (let i = 0; i < clouds.length; i++) clouds[i].one.position.x = clouds[i].from + Math.sin(t * 0.07 + i * 2) * 6;
  };
}

// ---------------------------------------------------------------- large: the castle

const STONE = 0x9c9486;
const STONE_DARK = 0x6f685e;
const ROOF = 0x39497d;
const ROYAL = 0x5b3a8e;
const GOLD = 0xd9ae45;

/** Flagstones, a royal carpet from the gate and gold crests, all painted on the courtyard. */
function paveCourtyard(group: THREE.Group, half: number): void {
  onGround(group, new THREE.PlaneGeometry(half * 2 + 0.8, half * 2 + 0.8), matte(0x6b5d4e, { roughness: 1 }), 0, -0.16, 0);
  const cells = Math.round((half * 2) / 3);
  const size = (half * 2) / cells;
  const slabs: Place[] = [];
  for (let col = 0; col < cells; col++) {
    for (let row = 0; row < cells; row++) {
      // A fixed scatter of lighter and darker slabs, so the floor reads as old stone.
      const pick = Math.abs(Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1;
      if (pick > 0.34) continue;
      slabs.push({ x: -half + size * (col + 0.5), y: -0.154, z: -half + size * (row + 0.5), colour: pick < 0.17 ? 0x77685a : 0x5f5245 });
    }
  }
  repeat(group, new THREE.PlaneGeometry(size, size), matte(0xffffff, { roughness: 1 }), slabs, true);
  const joints = new THREE.GridHelper(half * 2, cells, 0x463b31, 0x463b31);
  joints.position.y = -0.149;
  group.add(joints);

  const carpet = matte(ROYAL, { roughness: 0.9 });
  const trim = paint(GOLD, 0.95);
  const from = -half + 0.2;
  const to = -7;
  onGround(group, new THREE.PlaneGeometry(5, to - from), carpet, 0, -0.144, (from + to) / 2);
  for (const side of [-2.35, 2.35]) line(group, trim, side, from, side, to, -0.141, 0.24);

  const crest = (x: number, z: number, scale: number): void => {
    onGround(group, new THREE.CircleGeometry(5.6 * scale, 48), matte(0x4a3a63), x, -0.143, z);
    onGround(group, new THREE.RingGeometry(5.2 * scale, 5.65 * scale, 56), trim, x, -0.14, z);
    onGround(group, new THREE.RingGeometry(2.9 * scale, 3.1 * scale, 48), trim, x, -0.138, z);
    for (const turn of [0, Math.PI / 4]) {
      onGround(group, new THREE.RingGeometry(3.8 * scale, 4.05 * scale, 4, 1, turn), trim, x, -0.139, z);
    }
    onGround(group, new THREE.CircleGeometry(1.5 * scale, 4), trim, x, -0.137, z);
  };
  crest(0, 0, 1);
  const q = half * 0.55;
  for (const [x, z] of [[q, q], [-q, q], [q, -q], [-q, -q]]) crest(x, z, 0.7);
}

/** Stone walls with battlements: tall at the far end, low on the camera's side. */
function buildWalls(group: THREE.Group, half: number): void {
  const stone = matte(STONE);
  const footing = matte(STONE_DARK);
  const middle = half + 1;
  const span = half * 2 + 3.6;

  block(group, span, 5.4, 1.6, stone, 0, 2.5, -middle);
  block(group, 1.6, 3.5, half * 2 + 0.4, stone, middle, 1.55, 0);
  block(group, 1.6, 3.5, half * 2 + 0.4, stone, -middle, 1.55, 0);
  block(group, span, 0.56, 1, stone, 0, 0.08, half + 0.72);
  block(group, span, 0.6, 1.76, footing, 0, 0.1, -middle);
  for (const side of [-middle, middle]) block(group, 1.76, 0.6, half * 2 + 0.4, footing, side, 0.1, 0);

  const far: Place[] = spaced(-half, half, 2.6).map((x) => ({ x, y: 5.65, z: -middle }));
  repeat(group, new THREE.BoxGeometry(1.35, 0.9, 1.6), stone, far).castShadow = true;
  const sides: Place[] = [];
  for (const z of spaced(-half + 0.8, half - 0.8, 2.6)) {
    sides.push({ x: middle, y: 3.65, z }, { x: -middle, y: 3.65, z });
  }
  repeat(group, new THREE.BoxGeometry(1.6, 0.75, 1.35), stone, sides).castShadow = true;
  const near: Place[] = spaced(-half, half, 2.6).map((x) => ({ x, y: 0.5, z: half + 0.72 }));
  repeat(group, new THREE.BoxGeometry(1.2, 0.3, 1), footing, near);
}

function buildTower(group: THREE.Group, x: number, z: number, radius: number, height: number): Animate {
  const stone = matte(STONE);
  const shaft = put(group, new THREE.CylinderGeometry(radius, radius * 1.06, height, 24), stone, x, height / 2 - 0.2, z);
  shaft.castShadow = true;
  put(group, new THREE.CylinderGeometry(radius * 1.12, radius * 1.12, 0.7, 24), matte(STONE_DARK), x, height - 0.2, z);
  put(group, new THREE.ConeGeometry(radius * 1.14, radius * 1.5, 24), matte(ROOF, { roughness: 0.6 }), x, height + 0.15 + radius * 0.75, z).castShadow = true;
  const lamp = paint(0xffd778);
  for (const up of [0.42, 0.68]) block(group, radius * 0.26, radius * 0.44, 0.2, lamp, x, height * up, z + radius * 1.02);

  const top = height + 0.15 + radius * 1.5;
  put(group, new THREE.CylinderGeometry(0.07, 0.07, 2.2, 8), matte(0xe8dcc0), x, top + 1, z);
  const flag = new THREE.Group();
  flag.position.set(x, top + 1.7, z);
  put(flag, new THREE.PlaneGeometry(2, 1.1), paint(GOLD), 1, 0, 0);
  put(flag, new THREE.CircleGeometry(0.3, 4), paint(ROYAL), 1, 0, 0.02);
  group.add(flag);
  return (t) => {
    flag.rotation.y = Math.sin(t * 2.6 + x) * 0.4;
  };
}

/** The great wooden gate in the far wall, and banners along it. */
function buildGate(group: THREE.Group, half: number): void {
  const face = -(half + 0.16);
  const timber = matte(0x6b4226, { roughness: 0.8 });
  block(group, 5.6, 3.9, 0.12, timber, 0, 1.75, face);
  const arch = put(group, new THREE.CircleGeometry(2.8, 32, 0, Math.PI), timber, 0, 3.68, face + 0.06);
  arch.scale.y = 0.55;
  put(group, new THREE.TorusGeometry(2.95, 0.22, 8, 32, Math.PI), matte(STONE_DARK), 0, 3.68, face).scale.y = 0.58;
  const iron = matte(0x2e2b29, { roughness: 0.5, metalness: 0.5 });
  for (const height of [0.9, 2.6]) block(group, 5.6, 0.18, 0.1, iron, 0, height, face + 0.08);
  block(group, 0.14, 4.9, 0.1, iron, 0, 2.2, face + 0.08);

  const cloth = paint(ROYAL);
  const badge = paint(GOLD);
  const places = spaced(-half + 8, half - 8, 13).filter((x) => Math.abs(x) > 11);
  repeat(group, new THREE.PlaneGeometry(2.1, 3.2), cloth, places.map((x) => ({ x, y: 2.9, z: face })));
  repeat(group, new THREE.CircleGeometry(0.62, 4), badge, places.map((x) => ({ x, y: 3.2, z: face + 0.03 })));
}

/** Torches along three walls, their flames flickering. */
function buildTorches(group: THREE.Group, half: number): Animate {
  const spots: Place[] = spaced(-half + 14, half - 14, 13).filter((x) => Math.abs(x) > 8).map((x) => ({ x, y: 2.25, z: -(half + 0.06) }));
  for (const z of spaced(-half + 8, half - 8, 13)) spots.push({ x: half + 0.06, y: 2.25, z }, { x: -(half + 0.06), y: 2.25, z });
  repeat(group, new THREE.BoxGeometry(0.2, 0.9, 0.2), matte(0x3a2a1c), spots);
  const flameShape = new THREE.ConeGeometry(0.22, 0.75, 10);
  const outer = paint(0xff9d2e, 0.95);
  const flames = spots.map((spot) => put(group, flameShape, outer, spot.x, spot.y + 0.82, spot.z));
  return (t) => {
    for (let i = 0; i < flames.length; i++) {
      const lick = Math.sin(t * 13 + i * 2.3) * 0.16 + Math.sin(t * 7.3 + i) * 0.1;
      flames[i].scale.set(1 - lick * 0.4, 1 + lick, 1 - lick * 0.4);
    }
  };
}

function buildCastle(group: THREE.Group, half: number): Animate {
  onGround(group, new THREE.PlaneGeometry(half * 2 + 150, half * 2 + 150), matte(0x24402e, { roughness: 1 }), 0, -0.21, 0);
  paveCourtyard(group, half);
  buildWalls(group, half);
  buildGate(group, half);

  const corner = half + 4.4;
  const moving: Animate[] = [
    buildTorches(group, half),
    buildTower(group, -corner, -corner, 3.6, 10),
    buildTower(group, corner, -corner, 3.6, 10),
    buildTower(group, -6, -(half + 3), 2.4, 8),
    buildTower(group, 6, -(half + 3), 2.4, 8),
    // The keep, further off behind the gate.
    buildTower(group, -12, -(half + 22), 4, 15),
    buildTower(group, 12, -(half + 22), 4, 15),
  ];
  block(group, 20, 11, 6, matte(STONE), 0, 5.3, -(half + 23));
  const keepRoof = put(group, new THREE.ConeGeometry(9, 6, 4), matte(ROOF, { roughness: 0.6 }), 0, 13.8, -(half + 23));
  keepRoof.rotation.y = Math.PI / 4;
  keepRoof.scale.z = 0.5;
  repeat(group, new THREE.BoxGeometry(1.1, 1.7, 0.2), paint(0xffd778), [-6, -2, 2, 6].flatMap((x) => [{ x, y: 4.5, z: -(half + 19.9) }, { x, y: 8, z: -(half + 19.9) }]));

  put(group, new THREE.SphereGeometry(3.6, 24, 18), new THREE.MeshBasicMaterial({ color: 0xf1ecd8, fog: false }), half * 0.55, 26, -(half + 45));
  const stars: Place[] = Array.from({ length: 60 }, (_, i) => ({ x: ((i * 0.618034) % 1) * 150 - 75, y: 12 + ((i * 0.414214) % 1) * 22, z: -(half + 30 + ((i * 0.732051) % 1) * 20) }));
  repeat(group, new THREE.SphereGeometry(0.16, 6, 6), new THREE.MeshBasicMaterial({ color: 0xfff4d0, fog: false }), stars);

  return (t) => {
    for (let i = 0; i < moving.length; i++) moving[i](t);
  };
}

// ---------------------------------------------------------------- putting a map up

const THEMES: Record<MapId, Theme> = {
  dark: { sky: 0x071321, fogNear: 35, fogFar: 90, skyLight: 0xb8dcff, groundLight: 0x1a2938, ambient: 2, sunColour: 0xffffff, sunStrength: 3, build: buildNight },
  playground: { sky: 0x9ad8ff, fogNear: 55, fogFar: 150, skyLight: 0xe4f3ff, groundLight: 0x5d7f4c, ambient: 1.7, sunColour: 0xfff2d2, sunStrength: 2.4, build: buildPlayground },
  castle: { sky: 0x2b2346, fogNear: 50, fogFar: 135, skyLight: 0xcdc2ff, groundLight: 0x3d3027, ambient: 1.7, sunColour: 0xffd2a0, sunStrength: 2.5, build: buildCastle },
};

/** Where the sun sits, measured from the spot it lights. */
const SUN_OFFSET = { x: -12, y: 24, z: 10 };

/** Put a map's sky, lights and scenery into the scene. */
export function buildArena(scene: THREE.Scene, map: BlobMap): ArenaScenery {
  const theme = THEMES[map.id];
  scene.background = new THREE.Color(theme.sky);
  scene.fog = new THREE.Fog(theme.sky, theme.fogNear, theme.fogFar);

  const group = new THREE.Group();
  group.add(new THREE.HemisphereLight(theme.skyLight, theme.groundLight, theme.ambient));

  const sun = new THREE.DirectionalLight(theme.sunColour, theme.sunStrength);
  sun.position.set(SUN_OFFSET.x, SUN_OFFSET.y, SUN_OFFSET.z);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -45;
  sun.shadow.camera.right = 45;
  sun.shadow.camera.top = 45;
  sun.shadow.camera.bottom = -45;
  group.add(sun, sun.target);

  const animate = theme.build(group, map.half);
  // One sun cannot shadow a big map sharply, so there it travels with the player.
  const sunFollows = map.half > ARENA;
  scene.add(group);

  return {
    group,
    update(playerX, playerZ, t) {
      if (sunFollows) {
        sun.position.set(playerX + SUN_OFFSET.x, SUN_OFFSET.y, playerZ + SUN_OFFSET.z);
        sun.target.position.set(playerX, 0, playerZ);
      }
      animate?.(t);
    },
    dispose() {
      scene.remove(group);
      // Lights own their shadow maps, which are freed apart from the meshes.
      group.traverse((obj) => {
        if (obj instanceof THREE.Light) obj.dispose();
      });
      disposeModel(group);
    },
  };
}
