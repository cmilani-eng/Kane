/**
 * Blob Evolution — the 3D look of the obstacles, in the arena's cute glossy style.
 * Everything deadly stands on a pulsing red ring, and its warning is a filling red disc under
 * a yellow sign. Trees and puddles are green and blue and have no red on them.
 *
 * The models use only geometry and materials (no image textures), and each one owns all of
 * its own, so `disposeModel` can free it completely when it leaves the arena.
 * `pose` and `animate` run every frame and allocate nothing.
 *
 * Called by: src/games/blob-evolution/blobObstacleField.ts
 * Tested by: blobObstacleArt.test.ts
 */
import * as THREE from 'three';
import {
  BLACK_HOLE_PULL_RADIUS,
  HAZARD_LIFETIME_SECONDS,
  HAZARD_WARNING_SECONDS,
  type Hazard,
  type HazardKind,
  type HarmlessObstacle,
} from './blobObstacles';

export interface SceneryModel {
  group: THREE.Group;
  /** Idle life; `t` is the render clock in seconds. */
  animate(t: number): void;
}

export interface HazardModel {
  group: THREE.Group;
  /** Shown while the hazard is only a warning. */
  marker: THREE.Group;
  /** Shown once it is deadly. */
  body: THREE.Group;
  /** Place and animate it for this frame; `t` is the render clock in seconds. */
  pose(hazard: Hazard, t: number): void;
}

const DANGER = 0xff3b3b;
const WARNING_YELLOW = 0xffd23f;
const SUCTION_PURPLE = 0xb36bff;
/** Seconds a hazard takes to swell up when it turns deadly, and to shrink away at the end. */
const POP_SECONDS = 0.35;
const FADE_SECONDS = 0.5;

// ---------------------------------------------------------------- building blocks

function glossy(color: number, extra: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.06, ...extra });
}

/** A flat, unlit, see-through colour: rings, glows and ripples. */
function tint(color: number, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  return m;
}

function solid(geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = mesh(geometry, material, x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Lay a shape drawn in the XY plane flat on the ground. */
function lay(m: THREE.Mesh, y: number): THREE.Mesh {
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  return m;
}

/** A broken circle of `pieces` arcs, all sharing one geometry and material. */
function dashedRing(radius: number, width: number, pieces: number, material: THREE.Material): THREE.Group {
  const ring = new THREE.Group();
  const step = (Math.PI * 2) / pieces;
  const arc = new THREE.RingGeometry(radius - width, radius, 8, 1, 0, step * 0.55);
  for (let i = 0; i < pieces; i++) {
    const dash = lay(mesh(arc, material), 0);
    dash.rotation.z = i * step;
    ring.add(dash);
  }
  return ring;
}

/** Free every geometry, material, texture and instance buffer under a model. */
export function disposeModel(root: THREE.Object3D): void {
  const owned = new Set<{ dispose(): void }>();
  root.traverse((obj) => {
    if (obj instanceof THREE.InstancedMesh) owned.add(obj);
    const item = obj as Partial<THREE.Mesh>;
    if (item.geometry) owned.add(item.geometry);
    const materials = Array.isArray(item.material) ? item.material : item.material ? [item.material] : [];
    for (const material of materials) {
      owned.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) owned.add(value);
    }
  });
  owned.forEach((item) => item.dispose());
}

// ---------------------------------------------------------------- harmless scenery

/** A round, leafy tree on a grassy mound. The mound's edge is exactly where blobs bounce. */
function makeTree(radius: number): SceneryModel {
  const group = new THREE.Group();
  group.add(solid(new THREE.CylinderGeometry(radius * 0.93, radius, 0.24, 36), glossy(0x2c7a4b, { roughness: 0.8 }), 0, -0.05, 0));
  group.add(solid(new THREE.CylinderGeometry(radius * 0.19, radius * 0.29, radius * 1.05, 14), glossy(0x9a6438, { roughness: 0.65 }), 0, radius * 0.5, 0));

  const crown = new THREE.Group();
  crown.position.y = radius * 0.8;
  const leaf = glossy(0x3fcb74, { emissive: 0x12552f, emissiveIntensity: 0.28 });
  const lightLeaf = glossy(0x78e394, { emissive: 0x1c6b38, emissiveIntensity: 0.25 });
  // [x, y, z, size] as shares of the radius; none reaches past the mound.
  const puffs: readonly [number, number, number, number][] = [
    [0, 0.72, 0, 0.7],
    [-0.44, 0.45, 0.16, 0.5],
    [0.47, 0.42, 0.08, 0.48],
    [0.04, 0.4, -0.47, 0.46],
    [0.02, 0.36, 0.48, 0.45],
    [0.06, 1.2, 0.02, 0.4],
  ];
  puffs.forEach(([x, y, z, size], i) => {
    crown.add(solid(new THREE.SphereGeometry(radius * size, 22, 16), i % 2 ? lightLeaf : leaf, x * radius, y * radius, z * radius));
  });
  const blossom = glossy(0xfff1a8, { emissive: 0xffd95a, emissiveIntensity: 0.45 });
  for (const [x, y, z] of [[-0.62, 0.68, 0.48], [0.4, 0.98, 0.5], [0.68, 0.5, 0.42], [-0.12, 1.45, 0.3], [-0.3, 0.38, 0.84]]) {
    crown.add(mesh(new THREE.SphereGeometry(radius * 0.085, 10, 8), blossom, x * radius, y * radius, z * radius));
  }
  const shine = mesh(new THREE.SphereGeometry(radius * 0.16, 14, 10), tint(0xffffff, 0.28), -radius * 0.28, radius * 1.18, radius * 0.5);
  shine.scale.set(1.3, 0.7, 0.5);
  crown.add(shine);
  group.add(crown);

  return {
    group,
    animate(t) {
      crown.rotation.z = Math.sin(t * 1.3 + group.position.x) * 0.025;
      crown.rotation.x = Math.sin(t * 1.1 + group.position.z) * 0.018;
    },
  };
}

/** A flat shape with a gently wavy rim that never goes past `radius`. */
function wavyDisc(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const angle = Math.atan2(y, x);
    const k = 0.95 + Math.sin(angle * 3 + 1.2) * 0.032 + Math.sin(angle * 5) * 0.018;
    position.setXY(i, x * k, y * k);
  }
  position.needsUpdate = true;
  return geometry;
}

/** A see-through blue puddle with spreading ripples. Its wet area is where blobs are slowed. */
function makePuddle(radius: number): SceneryModel {
  const group = new THREE.Group();
  const water = glossy(0x56c8ff, { roughness: 0.1, metalness: 0.35, emissive: 0x0d5c99, emissiveIntensity: 0.6, transparent: true, opacity: 0.6, depthWrite: false });
  group.add(lay(mesh(wavyDisc(new THREE.CircleGeometry(radius, 64)), water), -0.115));
  group.add(lay(mesh(wavyDisc(new THREE.RingGeometry(radius * 0.9, radius, 64)), tint(0xc4ecff, 0.62)), -0.105));

  const rippleShape = new THREE.RingGeometry(0.93, 1, 48);
  const ripples = [0, 1, 2].map(() => {
    const ripple = lay(mesh(rippleShape, tint(0xe8f8ff, 0.5)), -0.1);
    group.add(ripple);
    return ripple;
  });

  const glint = tint(0xffffff, 0.55);
  const glintShape = new THREE.CircleGeometry(1, 24);
  for (const [x, z, w, h] of [[-0.38, -0.32, 0.22, 0.09], [-0.12, -0.45, 0.08, 0.04]]) {
    const spot = lay(mesh(glintShape, glint, x * radius, 0, z * radius), -0.095);
    spot.scale.set(w * radius, h * radius, 1);
    group.add(spot);
  }

  return {
    group,
    animate(t) {
      for (let i = 0; i < ripples.length; i++) {
        const p = (t * 0.4 + i / ripples.length) % 1;
        const size = radius * (0.12 + 0.72 * p);
        ripples[i].scale.set(size, size, 1);
        (ripples[i].material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - p);
      }
    },
  };
}

export function makeSceneryModel(obstacle: HarmlessObstacle): SceneryModel {
  const model = obstacle.kind === 'tree' ? makeTree(obstacle.radius) : makePuddle(obstacle.radius);
  model.group.position.set(obstacle.x, 0, obstacle.z);
  return model;
}

// ---------------------------------------------------------------- warning marker

/** The look shared by every warning: a red ring that fills up under a floating yellow sign. */
function makeMarker(radius: number): { group: THREE.Group; pose(progress: number, t: number): void } {
  const group = new THREE.Group();
  const edge = tint(DANGER, 1);
  group.add(lay(mesh(new THREE.RingGeometry(radius * 0.86, radius + 0.1, 48), edge), -0.08));
  const fill = lay(mesh(new THREE.CircleGeometry(1, 48), tint(DANGER, 0.34)), -0.09);
  group.add(fill);

  const sign = new THREE.Group();
  sign.add(mesh(new THREE.CircleGeometry(1.05, 3, Math.PI / 2), new THREE.MeshBasicMaterial({ color: WARNING_YELLOW, side: THREE.DoubleSide })));
  const ink = new THREE.MeshBasicMaterial({ color: 0x3a0d0d });
  sign.add(mesh(new THREE.BoxGeometry(0.18, 0.56, 0.06), ink, 0, 0.14, 0.05));
  sign.add(mesh(new THREE.BoxGeometry(0.18, 0.18, 0.06), ink, 0, -0.34, 0.05));
  // Leaned back to face the camera, which looks down on the arena from behind the player.
  sign.rotation.x = -0.55;
  group.add(sign);

  return {
    group,
    pose(progress, t) {
      // Blinks faster as the moment gets closer.
      const pulse = 0.5 + 0.5 * Math.sin(t * (9 + progress * 13));
      edge.opacity = 0.5 + 0.5 * pulse;
      const size = Math.max(0.01, radius * progress);
      fill.scale.set(size, size, 1);
      sign.position.y = 2.7 + Math.sin(t * 6) * 0.14;
      sign.scale.setScalar(1 + 0.14 * pulse);
    },
  };
}

// ---------------------------------------------------------------- black hole

/** Spiral arms from `inner` to `outer`, bright at the middle and fading out at the tips. */
function spiralArms(inner: number, outer: number, arms: number, twist: number, width: number): THREE.BufferGeometry {
  const steps = 28;
  const positions: number[] = [];
  const colours: number[] = [];
  const indices: number[] = [];
  const hot = new THREE.Color(0xffa8f5);
  const cold = new THREE.Color(0x4417a8);
  const colour = new THREE.Color();
  for (let arm = 0; arm < arms; arm++) {
    const base = positions.length / 3;
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      const distance = inner + (outer - inner) * u;
      const angle = (arm / arms) * Math.PI * 2 + u * twist;
      const half = (width * (1 - u * 0.8)) / distance;
      colour.copy(hot).lerp(cold, u);
      for (const a of [angle - half, angle + half]) {
        positions.push(Math.cos(a) * distance, 0, Math.sin(a) * distance);
        colours.push(colour.r, colour.g, colour.b, 0.95 * (1 - u * u));
      }
      if (s < steps) {
        const i = base + s * 2;
        indices.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 4));
  geometry.setIndex(indices);
  return geometry;
}

function spiralMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
}

/** A dark swirling pit with a glowing rim, and streaks of light falling in from the whole pull zone. */
function makeBlackHole(radius: number): { solidPart: THREE.Group; reach: THREE.Group; animate(t: number): void } {
  const solidPart = new THREE.Group();
  solidPart.add(lay(mesh(new THREE.CircleGeometry(radius * 1.3, 48), tint(0x12021f, 0.92)), -0.1));
  const outerArms = mesh(spiralArms(radius * 0.7, radius * 2.9, 5, 3.4, 0.55), spiralMaterial(), 0, 0.02, 0);
  const innerArms = mesh(spiralArms(radius * 0.55, radius * 1.7, 4, 2.6, 0.38), spiralMaterial(), 0, 0.24, 0);
  solidPart.add(outerArms, innerArms);

  const core = mesh(new THREE.SphereGeometry(radius * 0.72, 32, 24), new THREE.MeshBasicMaterial({ color: 0x000000 }), 0, 0.62, 0);
  const halo = mesh(new THREE.SphereGeometry(radius * 0.94, 32, 24), tint(0x9b3cff, 0.26), 0, 0.62, 0);
  const photon = mesh(new THREE.TorusGeometry(radius * 0.86, 0.075, 10, 64), new THREE.MeshBasicMaterial({ color: 0xf5dcff }), 0, 0.62, 0);
  photon.rotation.x = Math.PI / 2 - 0.34;
  solidPart.add(core, halo, photon);

  // The reach of the pull: a faint dashed circle and light being drawn in from it.
  const reach = new THREE.Group();
  const boundary = dashedRing(BLACK_HOLE_PULL_RADIUS, 0.16, 28, tint(SUCTION_PURPLE, 0.45));
  boundary.position.y = -0.095;
  reach.add(boundary);

  const count = 64;
  const streaks = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 8, 6), tint(0xdcb8ff, 0.85), count);
  streaks.frustumCulled = false;
  reach.add(streaks);
  const dummy = new THREE.Object3D();

  return {
    solidPart,
    reach,
    animate(t) {
      outerArms.rotation.y = t * 2.4;
      innerArms.rotation.y = t * 4.1;
      photon.rotation.z = t * 2;
      halo.scale.setScalar(1 + Math.sin(t * 7) * 0.06);
      boundary.rotation.y = t * 0.5;
      for (let i = 0; i < count; i++) {
        // Each streak falls from the rim to the core, speeding up, then starts again.
        const p = (t * (0.42 + (i % 5) * 0.05) + i * 0.6180339) % 1;
        const distance = radius * 0.9 + (BLACK_HOLE_PULL_RADIUS - radius * 0.9) * (1 - p * p);
        const angle = i * 2.399963 + p * p * 3.2;
        const y = 0.12 + p * 0.45;
        dummy.position.set(Math.cos(angle) * distance, y, Math.sin(angle) * distance);
        // Stretched along its own +z, which faces the centre.
        dummy.rotation.set(0, Math.atan2(-dummy.position.x, -dummy.position.z), 0);
        dummy.scale.set(0.6 + p * 0.5, 0.6 + p * 0.5, 1.4 + p * p * 7);
        dummy.updateMatrix();
        streaks.setMatrixAt(i, dummy.matrix);
      }
      streaks.instanceMatrix.needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------- tornado

/** An angry pair of eyes, brows slanting in toward the middle. */
function angryEyes(size: number, white: number): THREE.Group {
  const face = new THREE.Group();
  const eye = glossy(white, { emissive: white, emissiveIntensity: 0.3 });
  const pupil = glossy(0x1a0508, { roughness: 0.2 });
  const brow = glossy(0x2a070c, { roughness: 0.5 });
  const eyeShape = new THREE.SphereGeometry(size * 0.5, 18, 14);
  const pupilShape = new THREE.SphereGeometry(size * 0.24, 12, 10);
  const browShape = new THREE.BoxGeometry(size * 1.25, size * 0.3, size * 0.3);
  for (const side of [-1, 1]) {
    const ball = mesh(eyeShape, eye, side * size * 0.72, 0, 0);
    ball.scale.set(1, 0.92, 0.55);
    const dot = mesh(pupilShape, pupil, side * size * 0.64, -size * 0.08, size * 0.24);
    const frown = mesh(browShape, brow, side * size * 0.72, size * 0.5, size * 0.2);
    frown.rotation.z = side * 0.48;
    face.add(ball, dot, frown);
  }
  return face;
}

/** A twisting funnel of rings that spin at their own speeds, with debris whirling round it. */
function makeTornado(radius: number): { solidPart: THREE.Group; animate(t: number): void } {
  const solidPart = new THREE.Group();
  const levels = 9;
  const slice = 0.58;
  const widthAt = (u: number): number => radius * (0.26 + 1.12 * Math.pow(u, 1.2));
  const low = new THREE.Color(0x77708f);
  const high = new THREE.Color(0xe2e7ff);
  const streakMaterial = tint(0xffffff, 0.78);

  const rings: THREE.Group[] = [];
  for (let i = 0; i < levels; i++) {
    const u = i / levels;
    const top = widthAt((i + 1) / levels);
    const bottom = widthAt(u);
    const ring = new THREE.Group();
    ring.position.y = slice * (i + 0.5) - 0.1;
    const shell = glossy(0xffffff, { emissive: 0x302b58, emissiveIntensity: 0.4, transparent: true, opacity: 0.62, depthWrite: false, side: THREE.DoubleSide });
    shell.color.copy(low).lerp(high, u);
    ring.add(mesh(new THREE.CylinderGeometry(top, bottom, slice * 0.96, 28, 1, true), shell));
    const swirl = mesh(new THREE.TorusGeometry((top + bottom) / 2 + 0.04, 0.055, 6, 40, Math.PI * 1.25), streakMaterial);
    swirl.rotation.x = Math.PI / 2;
    swirl.position.y = (i % 3) * 0.1 - 0.1;
    ring.add(swirl);
    solidPart.add(ring);
    rings.push(ring);
  }
  solidPart.add(lay(mesh(new THREE.RingGeometry(radius * 0.35, radius * 0.95, 32), tint(0xb9b2cf, 0.5)), -0.085));

  const faceLevel = 5;
  const face = angryEyes(0.42, 0xfff4d6);
  solidPart.add(face);

  const count = 18;
  const debris = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.11, 0.15), glossy(0x8d6a49, { roughness: 0.7 }), count);
  debris.frustumCulled = false;
  solidPart.add(debris);
  const dummy = new THREE.Object3D();

  const sway = (level: number, t: number): number => Math.sin(t * 3.2 + level * 0.62) * 0.032 * level;

  return {
    solidPart,
    animate(t) {
      for (let i = 0; i < rings.length; i++) {
        rings[i].rotation.y = t * (9 - i * 0.55) + i;
        rings[i].position.x = sway(i, t);
        rings[i].position.z = sway(i, t + 0.5);
      }
      // The eyes ride the funnel but always look toward the camera.
      face.position.set(sway(faceLevel, t), slice * (faceLevel + 0.5), widthAt((faceLevel + 0.5) / levels) + sway(faceLevel, t + 0.5) + 0.06);
      for (let i = 0; i < count; i++) {
        const u = ((i * 0.6180339) % 1) * 0.9 + 0.05;
        const angle = t * (6.5 - u * 2.5) + i * 2.4;
        const distance = widthAt(u) + 0.2 + (i % 3) * 0.16;
        dummy.position.set(Math.cos(angle) * distance, u * levels * slice + Math.sin(t * 4 + i) * 0.14, Math.sin(angle) * distance);
        dummy.rotation.set(t * 5 + i, angle, t * 3);
        dummy.updateMatrix();
        debris.setMatrixAt(i, dummy.matrix);
      }
      debris.instanceMatrix.needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------- giant red blob

/** A blob far bigger than any other, glossy red and furious, with horns and fangs. */
function makeRedBlob(radius: number): { solidPart: THREE.Group; animate(t: number, vx: number, vz: number): void } {
  const solidPart = new THREE.Group();
  const blob = new THREE.Group();
  const skin = glossy(0xe3182b, { roughness: 0.2, metalness: 0.1, emissive: 0x7a000c, emissiveIntensity: 0.55 });
  const body = solid(new THREE.SphereGeometry(1, 40, 30), skin);
  body.scale.set(1, 0.82, 1);
  blob.add(body);

  const face = angryEyes(0.27, 0xffe9a8);
  face.position.set(0, 0.2, 0.9);
  blob.add(face);

  const dark = glossy(0x2a0308, { roughness: 0.4 });
  // Half a ring, arching upward: a frown.
  blob.add(mesh(new THREE.TorusGeometry(0.3, 0.065, 10, 28, Math.PI), dark, 0, -0.34, 0.9));
  const tooth = glossy(0xffffff, { emissive: 0x777777, emissiveIntensity: 0.3 });
  const toothShape = new THREE.ConeGeometry(0.07, 0.19, 10);
  for (const x of [-0.14, 0.14]) {
    const fang = mesh(toothShape, tooth, x, -0.17, 0.93);
    fang.rotation.x = Math.PI;
    blob.add(fang);
  }
  const hornShape = new THREE.ConeGeometry(0.16, 0.46, 14);
  const horn = glossy(0x5c0610, { roughness: 0.3 });
  for (const side of [-1, 1]) {
    const spike = solid(hornShape, horn, side * 0.5, 0.82, 0.1);
    spike.rotation.z = side * -0.45;
    blob.add(spike);
  }
  const boil = glossy(0x9c0a18, { roughness: 0.25 });
  const boilShape = new THREE.SphereGeometry(1, 14, 10);
  for (const [x, y, z, size] of [[-0.72, 0.38, 0.36, 0.17], [0.78, 0.1, 0.34, 0.13], [0.3, 0.68, -0.3, 0.19], [-0.5, 0.2, -0.76, 0.2], [0.62, -0.28, -0.6, 0.15]]) {
    const bump = mesh(boilShape, boil, x, y, z);
    bump.scale.setScalar(size);
    blob.add(bump);
  }
  const shine = mesh(new THREE.SphereGeometry(0.2, 14, 10), tint(0xffffff, 0.42), -0.42, 0.55, 0.55);
  shine.scale.set(1.25, 0.65, 0.55);
  blob.add(shine);
  solidPart.add(blob);

  return {
    solidPart,
    animate(t, vx, vz) {
      const squash = 1 + Math.sin(t * 7) * 0.045;
      blob.scale.set(radius * squash, radius / squash, radius * squash);
      blob.position.y = radius * 0.77 + Math.abs(Math.sin(t * 3.5)) * 0.28;
      // Leans toward where it is going, but keeps its face where the player can see it.
      const speed = Math.hypot(vx, vz);
      blob.rotation.y = speed > 0.05 ? (vx / speed) * 0.55 : 0;
    },
  };
}

// ---------------------------------------------------------------- a hazard, warning to gone

export function makeHazardModel(kind: HazardKind, radius: number): HazardModel {
  const group = new THREE.Group();
  const marker = makeMarker(radius);
  const body = new THREE.Group();
  group.add(marker.group, body);

  const dangerEdge = tint(DANGER, 0.9);
  const dangerRing = lay(mesh(new THREE.RingGeometry(radius * 0.9, radius + 0.3, 56), dangerEdge), 0.05);
  // Drawn last, so the black hole's spiral arms cannot wash it out.
  dangerRing.renderOrder = 3;
  body.add(dangerRing);

  let solidPart: THREE.Group;
  let animate: (t: number, hazard: Hazard) => void;
  if (kind === 'blackHole') {
    const hole = makeBlackHole(radius);
    body.add(hole.reach);
    // Also shown during the warning, so the reach of the pull is known before it starts.
    const warningReach = dashedRing(BLACK_HOLE_PULL_RADIUS, 0.16, 28, tint(SUCTION_PURPLE, 0.35));
    warningReach.position.y = -0.095;
    marker.group.add(warningReach);
    solidPart = hole.solidPart;
    animate = (t) => hole.animate(t);
  } else if (kind === 'tornado') {
    const twister = makeTornado(radius);
    solidPart = twister.solidPart;
    animate = (t) => twister.animate(t);
  } else {
    const giant = makeRedBlob(radius);
    solidPart = giant.solidPart;
    animate = (t, hazard) => giant.animate(t, hazard.vx, hazard.vz);
  }
  body.add(solidPart);

  return {
    group,
    marker: marker.group,
    body,
    pose(hazard, t) {
      group.position.set(hazard.x, 0, hazard.z);
      const warning = hazard.phase === 'warning';
      marker.group.visible = warning;
      body.visible = !warning;
      if (warning) {
        marker.pose(Math.min(1, hazard.age / HAZARD_WARNING_SECONDS), t);
        return;
      }
      const swell = Math.min(1, hazard.age / POP_SECONDS, Math.max(0, HAZARD_LIFETIME_SECONDS - hazard.age) / FADE_SECONDS);
      solidPart.scale.setScalar(0.2 + 0.8 * swell);
      dangerEdge.opacity = 0.78 + 0.2 * Math.sin(t * 8);
      animate(t, hazard);
    },
  };
}
