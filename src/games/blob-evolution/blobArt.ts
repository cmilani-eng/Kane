/**
 * Blob Evolution — the 3D look: per-stage skins and accessories, the arena, the
 * idle wobble and the Angel ascension. Ported from the original game
 * (games/blob-evolution/main.js) so blobs look the way they were tuned.
 * Three.js only; no game rules and no Phaser.
 *
 * Called by: src/games/blob-evolution/BlobEvolutionScene.ts
 */
import * as THREE from 'three';
import { ANGEL_STAGE, ARENA } from './blobRules';

// ---------------------------------------------------------------- skins

function newCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return [canvas, ctx];
}

function toTexture(canvas: HTMLCanvasElement, wrapS: THREE.Wrapping = THREE.ClampToEdgeWrapping, wrapT: THREE.Wrapping = THREE.ClampToEdgeWrapping): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = wrapS;
  tex.wrapT = wrapT;
  return tex;
}

function makeRainbowTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = newCanvas();
  const stops: [number, string][] = [
    [0, '#ff1a1a'],
    [1 / 6, '#ff8a1a'],
    [2 / 6, '#ffe01a'],
    [3 / 6, '#2adf4a'],
    [4 / 6, '#1a8cff'],
    [5 / 6, '#7a3dff'],
    [1, '#ff1ad6'],
  ];
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const v = ctx.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, 'rgba(255,255,255,.22)');
  v.addColorStop(0.5, 'rgba(255,255,255,0)');
  v.addColorStop(1, 'rgba(0,0,0,.18)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 256, 256);
  return toTexture(canvas, THREE.RepeatWrapping, THREE.ClampToEdgeWrapping);
}

function makeVoidTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = newCanvas();
  const g = ctx.createRadialGradient(120, 100, 10, 128, 128, 150);
  g.addColorStop(0, '#d2a6ff');
  g.addColorStop(0.4, '#8b4fd4');
  g.addColorStop(1, '#3a1768');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 55; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.55})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, 0.6 + Math.random() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(canvas);
}

function makeWaterTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = newCanvas();
  const g = ctx.createRadialGradient(110, 90, 20, 128, 128, 160);
  g.addColorStop(0, '#8fd6ff');
  g.addColorStop(0.45, '#2a9dff');
  g.addColorStop(1, '#0d5fb8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 4 + Math.random() * 16;
    const bubble = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, 1, x, y, r);
    bubble.addColorStop(0, 'rgba(255,255,255,.55)');
    bubble.addColorStop(0.55, 'rgba(180,230,255,.18)');
    bubble.addColorStop(1, 'rgba(20,80,160,0)');
    ctx.fillStyle = bubble;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(canvas);
}

function makeLeafTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = newCanvas();
  const g = ctx.createLinearGradient(0, 0, 256, 256);
  g.addColorStop(0, '#1f8f4c');
  g.addColorStop(0.45, '#34c777');
  g.addColorStop(1, '#187a3e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 28; i++) {
    ctx.strokeStyle = `rgba(12,70,35,${0.18 + Math.random() * 0.28})`;
    ctx.lineWidth = 1.2 + Math.random() * 2.2;
    const x = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 40, 128, x + (Math.random() - 0.5) * 30, 256);
    ctx.stroke();
  }
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(180,255,170,${0.04 + Math.random() * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 14, 2 + Math.random() * 6, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(canvas, THREE.RepeatWrapping, THREE.RepeatWrapping);
}

function makeRockTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = newCanvas();
  ctx.fillStyle = '#7a7468';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 180; i++) {
    const shade = 98 + Math.floor(Math.random() * 62);
    ctx.fillStyle = `rgb(${shade},${shade - 5},${shade - 12})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * 256, Math.random() * 256, 6 + Math.random() * 28, 4 + Math.random() * 22, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(55,50,42,${0.1 + Math.random() * 0.2})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 256, Math.random() * 256);
    ctx.lineTo(Math.random() * 256, Math.random() * 256);
    ctx.stroke();
  }
  return toTexture(canvas, THREE.RepeatWrapping, THREE.RepeatWrapping);
}

const SKINS: Record<number, () => THREE.CanvasTexture> = {
  0: makeVoidTexture,
  1: makeWaterTexture,
  2: makeLeafTexture,
  3: makeRockTexture,
  4: makeRainbowTexture,
};

/** One skin per stage, shared by every blob of that stage (they are not disposed with a blob). */
const skinCache = new Map<number, THREE.CanvasTexture>();

function skin(stage: number): THREE.CanvasTexture {
  let tex = skinCache.get(stage);
  if (!tex) {
    tex = SKINS[stage]();
    skinCache.set(stage, tex);
  }
  return tex;
}

/** Free the shared skins. Call when the scene shuts down. */
export function disposeBlobArt(): void {
  skinCache.forEach((tex) => tex.dispose());
  skinCache.clear();
}

/** Flat facets and irregular vertices: a chunky stone, not a smooth pebble. */
function makeRockGeometry(): THREE.BufferGeometry {
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = 0.82 + ((Math.sin(x * 7.1 + y * 3.3) + Math.cos(z * 5.7 - x * 2.1)) * 0.5 + 0.5) * 0.28;
    pos.setXYZ(i, x * n, y * n * 0.9, z * n);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------- blobs

export interface AngelParts {
  glow: THREE.Mesh | null;
  halos: THREE.Mesh[];
  wings: THREE.Mesh[];
  light: THREE.PointLight | null;
}

interface WingData {
  side: number;
  kind: 'upper' | 'lower';
  baseZ: number;
  baseY: number;
}

const NO_ANGEL_PARTS: AngelParts = { glow: null, halos: [], wings: [], light: null };

export function angelPartsOf(group: THREE.Object3D | null): AngelParts {
  return (group?.userData.angelParts as AngelParts | undefined) ?? NO_ANGEL_PARTS;
}

function bodyMaterial(stage: number): THREE.MeshStandardMaterial {
  switch (stage) {
    case 4: {
      const map = skin(4);
      return new THREE.MeshStandardMaterial({ map, color: 0xffffff, roughness: 0.28, metalness: 0.08, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.55 });
    }
    case 0:
      return new THREE.MeshStandardMaterial({ map: skin(0), color: 0xc9a0ff, roughness: 0.32, metalness: 0.05, emissive: 0x4a1f86, emissiveIntensity: 0.28 });
    case 1:
      return new THREE.MeshStandardMaterial({ map: skin(1), color: 0xb8e7ff, roughness: 0.28, metalness: 0.08, emissive: 0x0a4f9a, emissiveIntensity: 0.2 });
    case 2:
      return new THREE.MeshStandardMaterial({ map: skin(2), color: 0x7dffb0, roughness: 0.42, metalness: 0, emissive: 0x145c32, emissiveIntensity: 0.22 });
    case 3:
      return new THREE.MeshStandardMaterial({ map: skin(3), color: 0xb8b0a2, roughness: 0.88, metalness: 0, flatShading: true, emissive: 0x3a352e, emissiveIntensity: 0.1 });
    default:
      return new THREE.MeshStandardMaterial({ color: 0xfff6d0, roughness: 0.22, metalness: 0.12, emissive: 0xffe08a, emissiveIntensity: 0.55 });
  }
}

function addFace(group: THREE.Group): void {
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x102033, roughness: 0.25 });
  for (const x of [-0.28, 0.28]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 12), eyeWhite);
    eye.position.set(x, 0.17, 0.82);
    eye.scale.set(1, 1.12, 0.5);
    group.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), pupilMat);
    pupil.position.set(x + 0.018, 0.16, 0.89);
    group.add(pupil);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(x - 0.018, 0.205, 0.93);
    group.add(shine);
  }
}

function addAngel(group: THREE.Group): AngelParts {
  const parts: AngelParts = { glow: null, halos: [], wings: [], light: null };

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 24, 18),
    new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0.18, depthWrite: false }),
  );
  glow.scale.set(1, 0.85, 1);
  group.add(glow);
  parts.glow = glow;

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.06, 12, 56),
    new THREE.MeshStandardMaterial({ color: 0xffe27a, emissive: 0xffd24a, emissiveIntensity: 0.9, roughness: 0.25, metalness: 0.15 }),
  );
  halo.position.y = 1.32;
  halo.rotation.x = Math.PI / 2;
  group.add(halo);
  const haloInner = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.03, 10, 48),
    new THREE.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xffe9a0, emissiveIntensity: 0.75, roughness: 0.3 }),
  );
  haloInner.position.y = 1.32;
  haloInner.rotation.x = Math.PI / 2;
  group.add(haloInner);
  parts.halos.push(halo, haloInner);

  const wingMat = new THREE.MeshStandardMaterial({ color: 0xfffaf0, emissive: 0xffe9b8, emissiveIntensity: 0.28, roughness: 0.4, metalness: 0.05 });
  for (const side of [-1, 1]) {
    const upper = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 14), wingMat);
    upper.scale.set(0.38, 0.14, 1.2);
    upper.position.set(side * 1.05, 0.38, -0.08);
    upper.rotation.z = side * 0.42;
    upper.rotation.y = side * -0.18;
    upper.userData = { side, kind: 'upper', baseZ: side * 0.42, baseY: side * -0.18 } satisfies WingData;
    group.add(upper);
    parts.wings.push(upper);

    const lower = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 12), wingMat);
    lower.scale.set(0.32, 0.12, 0.95);
    lower.position.set(side * 0.95, 0.08, -0.02);
    lower.rotation.z = side * 0.22;
    lower.userData = { side, kind: 'lower', baseZ: side * 0.22, baseY: 0 } satisfies WingData;
    group.add(lower);
    parts.wings.push(lower);
  }

  const light = new THREE.PointLight(0xffe7a0, 0, 28);
  light.position.set(0, 1.2, 0);
  group.add(light);
  parts.light = light;
  return parts;
}

/**
 * A unit-sized blob (scaled to its radius by `poseBlob`): skin, eyes and the
 * accessories that mark each stage — sparkles, bubbles, a sprout, rainbow rings,
 * and for the Angel a halo, wings and glow.
 */
export function makeBlob(stage: number): THREE.Group {
  const group = new THREE.Group();
  const material = bodyMaterial(stage);

  let body: THREE.Mesh;
  if (stage === 3) {
    body = new THREE.Mesh(makeRockGeometry(), material);
    body.scale.set(1.12, 0.95, 1.05);
  } else {
    body = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), material);
    body.scale.set(1, 0.82, 1);
  }
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  addFace(group);

  if (stage === 0) {
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xf0d7ff, transparent: true, opacity: 0.85 });
    for (const [x, y, z, r] of [[-0.4, 0.5, 0.55, 0.07], [0.42, 0.4, 0.5, 0.055], [-0.1, 0.7, 0.35, 0.045], [0.25, 0.15, 0.7, 0.04]]) {
      const spark = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), sparkMat);
      spark.position.set(x, y, z);
      group.add(spark);
    }
  }
  if (stage === 1) {
    const bubbleMat = new THREE.MeshStandardMaterial({ color: 0xd7f2ff, emissive: 0x6ec8ff, emissiveIntensity: 0.35, roughness: 0.2, metalness: 0.05, transparent: true, opacity: 0.7 });
    for (const [x, y, z, r] of [[-0.45, 0.55, 0.55, 0.16], [0.5, 0.35, 0.4, 0.12], [0.15, 0.75, 0.2, 0.1]]) {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), bubbleMat);
      bubble.position.set(x, y, z);
      group.add(bubble);
    }
  }
  if (stage === 2) {
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2fbf6e, emissive: 0x146b38, emissiveIntensity: 0.2, roughness: 0.45, metalness: 0 });
    const sprout = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), leafMat);
    sprout.scale.set(0.55, 1.15, 0.35);
    sprout.position.set(0, 0.95, -0.05);
    group.add(sprout);
    for (const side of [-1, 1]) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 10), leafMat);
      leaf.scale.set(0.85, 0.28, 0.45);
      leaf.position.set(side * 0.78, 0.2, 0.1);
      leaf.rotation.z = side * -0.55;
      leaf.rotation.y = side * 0.25;
      group.add(leaf);
    }
  }
  if (stage === 4) {
    const ringColors = [0xff1a1a, 0xff8a1a, 0xffe01a, 0x2adf4a, 0x1a8cff, 0x7a3dff, 0xff1ad6];
    ringColors.forEach((c, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.88 + i * 0.04, 0.06, 8, 48),
        new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.3 }),
      );
      ring.rotation.x = Math.PI / 2 + i * 0.11;
      ring.rotation.y = i * 0.38;
      ring.position.y = 0.02;
      group.add(ring);
    });
  }

  group.userData = { stage, angelParts: stage === ANGEL_STAGE ? addAngel(group) : NO_ANGEL_PARTS };
  return group;
}

/** Free the geometry and materials under an object (a blob, or any scene child). The shared skins stay. */
export function disposeBlob(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const item = obj as Partial<THREE.Mesh>;
    item.geometry?.dispose();
    if (Array.isArray(item.material)) item.material.forEach((m: THREE.Material) => m.dispose());
    else item.material?.dispose();
  });
}

export interface Pose {
  x: number;
  z: number;
  radius: number;
  facing: number;
}

/** Idle life: a gentle bob and squash, facing where the blob is heading. */
export function poseBlob(group: THREE.Group, pose: Pose, t: number, phase: number, isPlayer: boolean): void {
  const bob = isPlayer ? Math.sin(t * 5) * 0.055 : Math.sin(t * 4 + phase) * 0.045;
  const squash = isPlayer ? 1 + Math.sin(t * 7) * 0.025 : 1 + Math.sin(t * 5 + phase) * 0.025;
  group.position.set(pose.x, pose.radius * 0.77 + bob, pose.z);
  group.rotation.y = pose.facing;
  group.scale.set(pose.radius * squash, pose.radius / squash, pose.radius * squash);
}

// ---------------------------------------------------------------- arena

/** Night arena: lights, floor, grid, glowing boundary and drifting stars. */
export function buildArena(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0x071321);
  scene.fog = new THREE.Fog(0x071321, 35, 90);

  scene.add(new THREE.HemisphereLight(0xb8dcff, 0x1a2938, 2.0));

  const sun = new THREE.DirectionalLight(0xffffff, 3.0);
  sun.position.set(-12, 24, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -45;
  sun.shadow.camera.right = 45;
  sun.shadow.camera.top = 45;
  sun.shadow.camera.bottom = -45;
  scene.add(sun);

  const fill = new THREE.PointLight(0x3a9cff, 35, 55);
  fill.position.set(15, 9, -12);
  scene.add(fill);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0x10263a, roughness: 0.92, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.16;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(ARENA * 2, 34, 0x2a5974, 0x1b3a50);
  grid.position.y = -0.145;
  scene.add(grid);

  const boundary = new THREE.Mesh(
    new THREE.TorusGeometry(ARENA, 0.16, 10, 160),
    new THREE.MeshStandardMaterial({ color: 0x47b8d7, emissive: 0x14546a, emissiveIntensity: 0.65 }),
  );
  boundary.rotation.x = Math.PI / 2;
  boundary.position.y = -0.08;
  scene.add(boundary);

  for (let i = 0; i < 70; i++) {
    const star = new THREE.Mesh(
      new THREE.SphereGeometry(0.035 + Math.random() * 0.045, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x8ccfff, transparent: true, opacity: 0.45 }),
    );
    star.position.set((Math.random() - 0.5) * 95, 2 + Math.random() * 17, (Math.random() - 0.5) * 95);
    scene.add(star);
  }
}

// ---------------------------------------------------------------- camera

/**
 * Ease the camera behind the player. `dt` keeps the follow speed the same at any
 * frame rate (0.075 per frame was the tuned feel at 60 fps).
 */
export function followCamera(camera: THREE.PerspectiveCamera, x: number, z: number, dt: number): void {
  const k = 1 - Math.pow(1 - 0.075, dt * 60);
  camera.position.lerp(new THREE.Vector3(x + 1.5, 15.5, z + 19.5), k);
  camera.lookAt(x, 0, z);
}

// ---------------------------------------------------------------- Angel ascension

export interface AngelAscension {
  start: number;
  duration: number;
  particles: THREE.Mesh[];
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

/** Begin the ascension: the Angel's wings, halos and glow start closed and open as it plays. */
export function startAscension(scene: THREE.Scene, angel: THREE.Group, now: number): AngelAscension {
  const particles: THREE.Mesh[] = [];
  for (let i = 0; i < 36; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.06 + Math.random() * 0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xfff6c8 : i % 3 === 1 ? 0xffd24a : 0xffffff, transparent: true, opacity: 0.95 }),
    );
    p.userData = {
      ang: (i / 36) * Math.PI * 2,
      spin: 1.5 + Math.random() * 2.5,
      rise: 1.2 + Math.random() * 2.4,
      radius: 0.4 + Math.random() * 1.6,
    };
    scene.add(p);
    particles.push(p);
  }

  const parts = angelPartsOf(angel);
  for (const wing of parts.wings) {
    wing.scale.multiplyScalar(0.05);
    wing.rotation.z = (wing.userData as WingData).side * 0.05;
  }
  for (const halo of parts.halos) {
    halo.scale.set(0.1, 0.1, 0.1);
    (halo.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
  }
  if (parts.glow) (parts.glow.material as THREE.MeshBasicMaterial).opacity = 0;
  if (parts.light) parts.light.intensity = 0;

  return { start: now, duration: 2400, particles };
}

export function clearAscension(scene: THREE.Scene, ascension: AngelAscension | null): void {
  if (!ascension) return;
  for (const p of ascension.particles) {
    scene.remove(p);
    p.geometry.dispose();
    (p.material as THREE.Material).dispose();
  }
}

export interface AscensionTarget {
  x: number;
  z: number;
  radius: number;
  facing: number;
}

/** Advance the ascension. Returns true once it has finished. */
export function updateAscension(
  ascension: AngelAscension,
  angel: THREE.Group,
  target: AscensionTarget,
  camera: THREE.PerspectiveCamera,
  now: number,
  t: number,
): boolean {
  const u = Math.min(1, (now - ascension.start) / ascension.duration);
  const e = easeOutCubic(u);
  const pulse = 1 + Math.sin(u * Math.PI) * 0.55;
  const lift = e * 1.35;

  angel.position.set(target.x, target.radius * 0.77 + lift + Math.sin(t * 8) * 0.04, target.z);
  angel.rotation.y = target.facing + e * Math.PI * 2.2;
  const s = target.radius * pulse;
  angel.scale.set(s, s * (1.05 + e * 0.15), s);

  const parts = angelPartsOf(angel);
  const open = easeOutCubic(Math.min(1, Math.max(0, (u - 0.15) / 0.55)));
  for (const wing of parts.wings) {
    const data = wing.userData as WingData;
    const base = data.kind === 'upper' ? { x: 0.38, y: 0.14, z: 1.2 } : { x: 0.32, y: 0.12, z: 0.95 };
    wing.scale.set(base.x * open, base.y * open, base.z * open);
    wing.rotation.z = data.side * (0.05 + (Math.abs(data.baseZ) - 0.05) * open);
    if (data.kind === 'upper') wing.rotation.y = data.baseY * open;
  }
  const haloOpen = easeOutCubic(Math.min(1, Math.max(0, (u - 0.2) / 0.5)));
  parts.halos.forEach((halo, i) => {
    const sc = 0.1 + 0.9 * haloOpen;
    halo.scale.set(sc, sc, sc);
    halo.rotation.z = t * (1.8 + i);
    (halo.material as THREE.MeshStandardMaterial).emissiveIntensity = (i === 0 ? 0.9 : 0.75) * haloOpen;
  });
  if (parts.glow) {
    (parts.glow.material as THREE.MeshBasicMaterial).opacity = 0.08 + 0.28 * Math.sin(u * Math.PI);
    const g = 1 + e * 0.35;
    parts.glow.scale.set(g, g * 0.85, g);
  }
  if (parts.light) parts.light.intensity = 18 * Math.sin(u * Math.PI) + 4 * e;

  for (const p of ascension.particles) {
    const { ang, spin, rise, radius } = p.userData as { ang: number; spin: number; rise: number; radius: number };
    const a = ang + t * spin;
    const r = radius * (0.35 + e * 1.4);
    p.position.set(
      target.x + Math.cos(a) * r,
      target.radius * 0.77 + lift + rise * e + Math.sin(t * 6 + ang) * 0.15,
      target.z + Math.sin(a) * r,
    );
    (p.material as THREE.MeshBasicMaterial).opacity = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
    p.scale.setScalar(0.6 + (1 - u) * 0.8);
  }

  camera.position.lerp(new THREE.Vector3(target.x + 1.2, 14.2 - e * 1.5, target.z + 16.5 - e * 2.5), 0.12);
  camera.lookAt(target.x, lift, target.z);

  return u >= 1;
}
