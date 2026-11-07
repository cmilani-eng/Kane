/* global devicePixelRatio, document, innerHeight, innerWidth, performance, setTimeout, window */
import Phaser from 'phaser';
import * as THREE from 'three';
import './blob.css';
import {
  applyBlobChrome,
  blobEaten,
  blobEndPill,
  blobHudHint,
  blobHudLine,
  blobRpsLose,
  blobRpsLoseFallback,
  blobRpsLoseTitle,
  blobRpsOpen,
  blobRpsTie,
  blobRpsWin,
  blobWin,
} from './blobCopy';

const STAGES = [
  { name:'Purple', color:0x8b4fd4, radius:.42, speed:2.35 },
  { name:'Blue', color:0x1e8ef0, radius:.58, speed:3.05 },
  { name:'Green', color:0x2fbf6e, radius:.77, speed:3.85 },
  { name:'Rock', color:0x7a7468, radius:.98, speed:4.55 },
  { name:'Rainbow', color:0xffffff, radius:1.18, speed:5.35 },
  { name:'Angel', color:0xfff0a8, radius:1.35, speed:5.9 }
];
const ARENA = 34;
const BOT_COUNT = 42;
let scene, camera, renderer, clock;
let player, bots = [], running = false, duelBot = null, duelBusy = false;
let playerGroup;
let lastHud = 0;
let angelXform = null;

const overlay = document.getElementById('overlay');
const startPanel = document.getElementById('start-panel');
const rpsPanel = document.getElementById('rps-panel');
const endPanel = document.getElementById('end-panel');
const rpsResult = document.getElementById('rps-result');

function makeRainbowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const stops = [
    [0,'#ff1a1a'],[1/6,'#ff8a1a'],[2/6,'#ffe01a'],
    [3/6,'#2adf4a'],[4/6,'#1a8cff'],[5/6,'#7a3dff'],[1,'#ff1ad6']
  ];
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  stops.forEach(([t,c])=>g.addColorStop(t,c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const v = ctx.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, 'rgba(255,255,255,.22)');
  v.addColorStop(.5, 'rgba(255,255,255,0)');
  v.addColorStop(1, 'rgba(0,0,0,.18)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function makeVoidTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(120, 100, 10, 128, 128, 150);
  g.addColorStop(0, '#d2a6ff');
  g.addColorStop(.4, '#8b4fd4');
  g.addColorStop(1, '#3a1768');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 55; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.55})`;
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 0.6 + Math.random() * 2.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWaterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(110, 90, 20, 128, 128, 160);
  g.addColorStop(0, '#8fd6ff');
  g.addColorStop(.45, '#2a9dff');
  g.addColorStop(1, '#0d5fb8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 4 + Math.random() * 16;
    const bubble = ctx.createRadialGradient(x - r * .25, y - r * .25, 1, x, y, r);
    bubble.addColorStop(0, 'rgba(255,255,255,.55)');
    bubble.addColorStop(.55, 'rgba(180,230,255,.18)');
    bubble.addColorStop(1, 'rgba(20,80,160,0)');
    ctx.fillStyle = bubble;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeLeafTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 256, 256);
  g.addColorStop(0, '#1f8f4c');
  g.addColorStop(.45, '#34c777');
  g.addColorStop(1, '#187a3e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 28; i++) {
    ctx.strokeStyle = `rgba(12,70,35,${0.18 + Math.random() * 0.28})`;
    ctx.lineWidth = 1.2 + Math.random() * 2.2;
    const x = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + (Math.random() - .5) * 40, 128, x + (Math.random() - .5) * 30, 256);
    ctx.stroke();
  }
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(180,255,170,${0.04 + Math.random() * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 14, 2 + Math.random() * 6, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeRockTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#5e5950';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 180; i++) {
    const shade = 72 + Math.floor(Math.random() * 58);
    ctx.fillStyle = `rgb(${shade},${shade - 4},${shade - 10})`;
    const w = 6 + Math.random() * 28;
    const h = 4 + Math.random() * 22;
    ctx.beginPath();
    ctx.ellipse(Math.random() * 256, Math.random() * 256, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(40,36,30,${0.12 + Math.random() * 0.22})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 256, Math.random() * 256);
    ctx.lineTo(Math.random() * 256, Math.random() * 256);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeRockGeometry() {
  // Flat facets + irregular vertices — chunky stone, not a smooth pebble.
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

function makeBlob(stage, isPlayer=false) {
  const group = new THREE.Group();
  const data = STAGES[stage];
  let material;
  if (stage === 4) {
    const rainbowMap = makeRainbowTexture();
    material = new THREE.MeshStandardMaterial({
      map: rainbowMap, color:0xffffff, roughness:.28, metalness:.08,
      emissive:0xffffff, emissiveMap: rainbowMap, emissiveIntensity:.55
    });
  } else if (stage === 0) {
    material = new THREE.MeshStandardMaterial({
      map: makeVoidTexture(), color:0xc9a0ff, roughness:.32, metalness:.05,
      emissive:0x4a1f86, emissiveIntensity:.28
    });
  } else if (stage === 1) {
    material = new THREE.MeshStandardMaterial({
      map: makeWaterTexture(), color:0xb8e7ff, roughness:.28, metalness:.08,
      emissive:0x0a4f9a, emissiveIntensity:.2
    });
  } else if (stage === 2) {
    material = new THREE.MeshStandardMaterial({
      map: makeLeafTexture(), color:0x7dffb0, roughness:.42, metalness:0,
      emissive:0x145c32, emissiveIntensity:.22
    });
  } else if (stage === 3) {
    material = new THREE.MeshStandardMaterial({
      map: makeRockTexture(), color:0x9a9386, roughness:.92, metalness:0,
      flatShading: true, emissive:0x2a2620, emissiveIntensity:.08
    });
  } else if (stage === 5) {
    material = new THREE.MeshStandardMaterial({
      color:0xfff6d0, roughness:.22, metalness:.12,
      emissive:0xffe08a, emissiveIntensity:.55
    });
  } else {
    material = new THREE.MeshStandardMaterial({ color:data.color, roughness:.34, metalness:0, emissive:0x000000, emissiveIntensity:.45 });
  }
  let body;
  if (stage === 3) {
    body = new THREE.Mesh(makeRockGeometry(), material);
    body.scale.set(1.12, .95, 1.05);
  } else {
    body = new THREE.Mesh(new THREE.SphereGeometry(1,32,24), material);
    body.scale.set(1, .82, 1);
  }
  body.castShadow = true; body.receiveShadow = true; group.add(body);
  const eyeWhite = new THREE.MeshStandardMaterial({color:0xffffff, roughness:.3});
  const pupilMat = new THREE.MeshStandardMaterial({color:0x102033, roughness:.25});
  for (const x of [-.28,.28]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.135,16,12), eyeWhite);
    eye.position.set(x,.17,.82); eye.scale.set(1,1.12,.5); group.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(.065,12,10), pupilMat);
    pupil.position.set(x+.018,.16,.89); group.add(pupil);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(.022,8,8), new THREE.MeshBasicMaterial({color:0xffffff}));
    shine.position.set(x-.018,.205,.93); group.add(shine);
  }
  if (stage === 0) {
    const sparkMat = new THREE.MeshBasicMaterial({ color:0xf0d7ff, transparent:true, opacity:.85 });
    [[-.4,.5,.55,.07],[.42,.4,.5,.055],[-.1,.7,.35,.045],[.25,.15,.7,.04]].forEach(([x,y,z,r])=>{
      const spark = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), sparkMat);
      spark.position.set(x,y,z);
      group.add(spark);
    });
  }
  if (stage === 1) {
    const bubbleMat = new THREE.MeshStandardMaterial({
      color:0xd7f2ff, emissive:0x6ec8ff, emissiveIntensity:.35, roughness:.2, metalness:.05,
      transparent:true, opacity:.7
    });
    [[-.45, .55, .55, .16], [.5, .35, .4, .12], [.15, .75, .2, .1]].forEach(([x, y, z, r]) => {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), bubbleMat);
      bubble.position.set(x, y, z);
      group.add(bubble);
    });
  }
  if (stage === 2) {
    const leafMat = new THREE.MeshStandardMaterial({
      color:0x2fbf6e, emissive:0x146b38, emissiveIntensity:.2, roughness:.45, metalness:0
    });
    const sprout = new THREE.Mesh(new THREE.SphereGeometry(.28, 14, 10), leafMat);
    sprout.scale.set(.55, 1.15, .35);
    sprout.position.set(0, .95, -.05);
    group.add(sprout);
    for (const side of [-1, 1]) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(.36, 14, 10), leafMat);
      leaf.scale.set(.85, .28, .45);
      leaf.position.set(side * .78, .2, .1);
      leaf.rotation.z = side * -.55;
      leaf.rotation.y = side * .25;
      group.add(leaf);
    }
  }
  if (stage === 4) {
    const ringColors=[0xff1a1a,0xff8a1a,0xffe01a,0x2adf4a,0x1a8cff,0x7a3dff,0xff1ad6];
    ringColors.forEach((c,i)=>{
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.88+i*.04,.06,8,48),new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.35,roughness:.3}));
      ring.rotation.x=Math.PI/2 + i*.11; ring.rotation.y=i*.38; ring.position.y=.02; group.add(ring);
    });
  }
  const angelParts = { glow:null, halos:[], wings:[], light:null };
  if (stage === 5) {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 24, 18),
      new THREE.MeshBasicMaterial({ color:0xfff1b0, transparent:true, opacity:.18, depthWrite:false })
    );
    glow.scale.set(1, .85, 1); group.add(glow);
    angelParts.glow = glow;

    const haloMat = new THREE.MeshStandardMaterial({ color:0xffe27a, emissive:0xffd24a, emissiveIntensity:.9, roughness:.25, metalness:.15 });
    const halo = new THREE.Mesh(new THREE.TorusGeometry(.72, .06, 12, 56), haloMat);
    halo.position.y = 1.32; halo.rotation.x = Math.PI / 2; group.add(halo);
    const haloInner = new THREE.Mesh(new THREE.TorusGeometry(.52, .03, 10, 48), new THREE.MeshStandardMaterial({
      color:0xfff6c8, emissive:0xffe9a0, emissiveIntensity:.75, roughness:.3
    }));
    haloInner.position.y = 1.32; haloInner.rotation.x = Math.PI / 2; group.add(haloInner);
    angelParts.halos.push(halo, haloInner);

    const wingMat = new THREE.MeshStandardMaterial({ color:0xfffaf0, emissive:0xffe9b8, emissiveIntensity:.28, roughness:.4, metalness:.05 });
    for (const side of [-1, 1]) {
      const upper = new THREE.Mesh(new THREE.SphereGeometry(.55, 20, 14), wingMat);
      upper.scale.set(.38, .14, 1.2);
      upper.position.set(side * 1.05, .38, -.08);
      upper.rotation.z = side * .42;
      upper.rotation.y = side * -.18;
      upper.userData = { side, kind:'upper', baseZ: side * .42, baseY: side * -.18 };
      group.add(upper);
      angelParts.wings.push(upper);
      const lower = new THREE.Mesh(new THREE.SphereGeometry(.42, 18, 12), wingMat);
      lower.scale.set(.32, .12, .95);
      lower.position.set(side * .95, .08, -.02);
      lower.rotation.z = side * .22;
      lower.userData = { side, kind:'lower', baseZ: side * .22, baseY: 0 };
      group.add(lower);
      angelParts.wings.push(lower);
    }

    const light = new THREE.PointLight(0xffe7a0, 0, 28);
    light.position.set(0, 1.2, 0);
    group.add(light);
    angelParts.light = light;
  }
  group.userData = { body, stage, isPlayer, angelParts };
  return group;
}

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071321);
  scene.fog = new THREE.Fog(0x071321, 35, 90);
  camera = new THREE.PerspectiveCamera(52, innerWidth/innerHeight, .1, 180);
  camera.position.set(0,17,20);
  renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  document.getElementById('world').appendChild(renderer.domElement);
  clock = new THREE.Clock();

  const hemi = new THREE.HemisphereLight(0xb8dcff,0x1a2938,2.0); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff,3.0); sun.position.set(-12,24,10); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-45; sun.shadow.camera.right=45; sun.shadow.camera.top=45; sun.shadow.camera.bottom=-45; scene.add(sun);
  const fill = new THREE.PointLight(0x3a9cff,35,55); fill.position.set(15,9,-12); scene.add(fill);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x10263a,roughness:.92,metalness:.05}));
  floor.rotation.x=-Math.PI/2; floor.position.y=-.16; floor.receiveShadow=true; scene.add(floor);
  const grid = new THREE.GridHelper(ARENA*2,34,0x2a5974,0x1b3a50); grid.position.y=-.145; scene.add(grid);
  const boundary = new THREE.Mesh(new THREE.TorusGeometry(ARENA,.16,10,160),new THREE.MeshStandardMaterial({color:0x47b8d7,emissive:0x14546a,emissiveIntensity:.65}));
  boundary.rotation.x=Math.PI/2; boundary.position.y=-.08; scene.add(boundary);
  for(let i=0;i<70;i++){
    const star=new THREE.Mesh(new THREE.SphereGeometry(.035+Math.random()*.045,6,6),new THREE.MeshBasicMaterial({color:0x8ccfff,transparent:true,opacity:.45}));
    star.position.set((Math.random()-.5)*95,2+Math.random()*17,(Math.random()-.5)*95); scene.add(star);
  }
  window.addEventListener('resize',onResize);
  renderer.setAnimationLoop(renderThree);
}
function onResize(){ if(!camera||!renderer)return; camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); }
function easeOutCubic(x){ return 1 - Math.pow(1 - x, 3); }
function clearAngelXform(){
  if(!angelXform) return;
  for(const p of angelXform.particles){
    scene.remove(p); if(p.geometry)p.geometry.dispose(); if(p.material)p.material.dispose();
  }
  angelXform = null;
}
function startAngelTransform(){
  clearAngelXform();
  const particles = [];
  for(let i=0;i<36;i++){
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(.06 + Math.random()*.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: i%3===0 ? 0xfff6c8 : (i%3===1 ? 0xffd24a : 0xffffff), transparent:true, opacity:.95 })
    );
    const ang = (i / 36) * Math.PI * 2;
    p.userData = {
      ang,
      spin: 1.5 + Math.random() * 2.5,
      rise: 1.2 + Math.random() * 2.4,
      radius: 0.4 + Math.random() * 1.6
    };
    scene.add(p);
    particles.push(p);
  }
  angelXform = { start: performance.now(), duration: 2400, particles };
  const parts = playerGroup?.userData?.angelParts;
  if(parts?.wings){
    for(const wing of parts.wings){
      wing.scale.multiplyScalar(0.05);
      wing.rotation.z = wing.userData.side * 0.05;
    }
  }
  if(parts?.halos){
    for(const h of parts.halos){ h.scale.set(0.1,0.1,0.1); h.material.emissiveIntensity = 0; }
  }
  if(parts?.glow){ parts.glow.material.opacity = 0; }
  if(parts?.light){ parts.light.intensity = 0; }
}
function updateAngelTransform(t){
  if(!angelXform || !player || !playerGroup) return false;
  const elapsed = performance.now() - angelXform.start;
  const u = Math.min(1, elapsed / angelXform.duration);
  const e = easeOutCubic(u);
  const pulse = 1 + Math.sin(u * Math.PI) * 0.55;
  const lift = e * 1.35;
  playerGroup.position.set(player.x, player.radius * .77 + lift + Math.sin(t * 8) * .04, player.z);
  playerGroup.rotation.y = player.facing + e * Math.PI * 2.2;
  const s = player.radius * pulse;
  playerGroup.scale.set(s, s * (1.05 + e * .15), s);

  const parts = playerGroup.userData.angelParts || {};
  if(parts.wings){
    for(const wing of parts.wings){
      const open = easeOutCubic(Math.min(1, Math.max(0, (u - .15) / .55)));
      const base = wing.userData.kind === 'upper'
        ? { x:.38, y:.14, z:1.2 }
        : { x:.32, y:.12, z:.95 };
      wing.scale.set(base.x * open, base.y * open, base.z * open);
      wing.rotation.z = wing.userData.side * (0.05 + (Math.abs(wing.userData.baseZ) - 0.05) * open);
      if(wing.userData.kind === 'upper') wing.rotation.y = wing.userData.baseY * open;
    }
  }
  if(parts.halos){
    const hOpen = easeOutCubic(Math.min(1, Math.max(0, (u - .2) / .5)));
    parts.halos.forEach((h, i)=>{
      const sc = 0.1 + 0.9 * hOpen;
      h.scale.set(sc, sc, sc);
      h.rotation.z = t * (1.8 + i);
      if(h.material) h.material.emissiveIntensity = (i === 0 ? .9 : .75) * hOpen;
    });
  }
  if(parts.glow?.material){
    parts.glow.material.opacity = 0.08 + 0.28 * Math.sin(u * Math.PI);
    const g = 1 + e * .35;
    parts.glow.scale.set(g, g * .85, g);
  }
  if(parts.light) parts.light.intensity = 18 * Math.sin(u * Math.PI) + 4 * e;

  for(const p of angelXform.particles){
    const { ang, spin, rise, radius } = p.userData;
    const a = ang + t * spin;
    const r = radius * (0.35 + e * 1.4);
    p.position.set(
      player.x + Math.cos(a) * r,
      player.radius * .77 + lift + rise * e + Math.sin(t * 6 + ang) * .15,
      player.z + Math.sin(a) * r
    );
    const fade = u < .7 ? 1 : 1 - (u - .7) / .3;
    p.material.opacity = fade;
    const ps = 0.6 + (1 - u) * 0.8;
    p.scale.setScalar(ps);
  }

  const desired = new THREE.Vector3(player.x + 1.2, 14.2 - e * 1.5, player.z + 16.5 - e * 2.5);
  camera.position.lerp(desired, .12);
  camera.lookAt(player.x, lift, player.z);

  if(u >= 1){
    clearAngelXform();
    const won = blobWin();
    showEnd(true, won.title, won.body);
    return true;
  }
  return true;
}
function renderThree(){
  if(!renderer)return;
  const t=clock.getElapsedTime();
  if(updateAngelTransform(t)){
    renderer.render(scene,camera);
    return;
  }
  if(player && playerGroup){
    playerGroup.position.set(player.x,player.radius*.77+Math.sin(t*5)*.055,player.z);
    playerGroup.rotation.y=player.facing;
    const squash=1+Math.sin(t*7)*.025; playerGroup.scale.set(player.radius*squash,player.radius*(1/squash),player.radius*squash);
  }
  for(const b of bots){ if(!b.alive)continue; b.group.position.set(b.x,b.radius*.77+Math.sin(t*4+b.phase)*.045,b.z); b.group.rotation.y=b.facing; const s=1+Math.sin(t*5+b.phase)*.025; b.group.scale.set(b.radius*s,b.radius/s,b.radius*s); }
  if(player){
    const target=new THREE.Vector3(player.x,0,player.z);
    const desired=new THREE.Vector3(player.x+1.5,15.5,player.z+19.5);
    camera.position.lerp(desired,.075); camera.lookAt(target);
  }
  renderer.render(scene,camera);
}
function makeEntity(stage,x,z,isPlayer=false){
  const group=makeBlob(stage,isPlayer); scene.add(group);
  return {stage,x,z,radius:STAGES[stage].radius,speed:STAGES[stage].speed,group,alive:true,facing:0,vx:0,vz:0,phase:Math.random()*Math.PI*2,think:0,tx:x,tz:z};
}
function clearEntities(){
  clearAngelXform();
  if(playerGroup){scene.remove(playerGroup);disposeGroup(playerGroup);playerGroup=null;}
  bots.forEach(b=>{scene.remove(b.group);disposeGroup(b.group);}); bots=[];
}
function disposeGroup(g){g.traverse(o=>{if(o.geometry)o.geometry.dispose(); if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}});}
function spawnGame(){
  clearEntities();
  player={stage:1,x:0,z:0,radius:STAGES[1].radius,speed:STAGES[1].speed,facing:0,vx:0,vz:0};
  playerGroup=makeBlob(1,true); scene.add(playerGroup);
  const purpleCount = Math.floor(BOT_COUNT / 2);
  const stages = [
    ...Array(purpleCount).fill(0),
    ...Array(BOT_COUNT - purpleCount).fill(1)
  ];
  stages.sort(()=>Math.random()-.5);
  stages.forEach(stage=>{
    let x,z; do{x=(Math.random()-.5)*ARENA*1.75;z=(Math.random()-.5)*ARENA*1.75;}while(Math.hypot(x,z)<5);
    bots.push(makeEntity(stage,x,z));
  });
  running=true; duelBot=null; duelBusy=false;
  updateHud(true);
}
function evolvePlayer(stage){
  player.stage=stage; player.radius=STAGES[stage].radius; player.speed=STAGES[stage].speed;
  const old=playerGroup; scene.remove(old); disposeGroup(old);
  playerGroup=makeBlob(stage,true); scene.add(playerGroup);
  updateHud(true);
}
function canEat(predatorStage,preyStage){
  if(predatorStage===4) return preyStage<4;
  // Two Purples fuse: the eater evolves into Blue.
  if(predatorStage===0) return preyStage===0;
  return preyStage===predatorStage-1;
}
function removeBot(bot){
  if(!bot.alive)return;
  bot.alive=false; scene.remove(bot.group); disposeGroup(bot.group);
}
function playerEat(bot){
  removeBot(bot);
  if(player.stage<4) evolvePlayer(player.stage+1);
  checkVictory();
}
function loseGame(reason, copy){
  const eaten = blobEaten();
  if(endPanel && !endPanel.hidden && overlay.style.display==='flex' && startPanel.hidden && rpsPanel.hidden)return;
  running=false; showEnd(false, reason || eaten.title, copy || eaten.body);
}
function winGame(){
  if(!running || angelXform)return;
  running=false;
  refreshStick();
  evolvePlayer(5);
  startAngelTransform();
}
function checkVictory(){ if(bots.every(b=>!b.alive)) winGame(); }
function showEnd(won,title,copy){
  overlay.style.display='flex'; startPanel.hidden=true; rpsPanel.hidden=true; endPanel.hidden=false;
  document.getElementById('end-pill').textContent=blobEndPill(won);
  document.getElementById('end-title').textContent=title;
  document.getElementById('end-copy').textContent=copy;
  refreshStick();
}
function resetRpsPanel(){
  const open = blobRpsOpen();
  document.getElementById('rps-pill').textContent=open.pill;
  document.getElementById('rps-title').textContent=open.title;
  document.getElementById('rps-copy').textContent=open.copy;
  document.getElementById('rps-choices').hidden=false;
  document.getElementById('rps-hint').hidden=false;
  document.getElementById('rps-lose-actions').hidden=true;
  rpsResult.textContent='';
}
function showRpsLose(detail){
  duelBot=null; duelBusy=false; running=false;
  document.getElementById('rps-pill').textContent=blobEndPill(false);
  document.getElementById('rps-title').textContent=blobRpsLoseTitle();
  document.getElementById('rps-copy').textContent=detail || blobRpsLoseFallback();
  document.getElementById('rps-choices').hidden=true;
  document.getElementById('rps-hint').hidden=true;
  document.getElementById('rps-lose-actions').hidden=false;
  rpsResult.textContent='';
  overlay.style.display='flex'; startPanel.hidden=true; endPanel.hidden=true; rpsPanel.hidden=false;
  refreshStick();
}
function showRPS(bot){
  if(duelBusy||!running)return;
  duelBusy=true; duelBot=bot; running=false;
  resetRpsPanel();
  overlay.style.display='flex'; startPanel.hidden=true; endPanel.hidden=true; rpsPanel.hidden=false;
  refreshStick();
}
const beats={rock:'scissors',paper:'rock',scissors:'paper'};
function chooseRPS(choice){
  if(!duelBusy||!duelBot||!duelBot.alive)return;
  const botChoice=['rock','paper','scissors'][Math.floor(Math.random()*3)];
  if(choice===botChoice){ rpsResult.textContent=blobRpsTie(choice); return; }
  if(beats[choice]===botChoice){
    rpsResult.textContent=blobRpsWin(choice, botChoice);
    setTimeout(()=>{ if(!duelBot)return; removeBot(duelBot); duelBot=null; duelBusy=false; rpsPanel.hidden=true; overlay.style.display='none'; running=true; refreshStick(); checkVictory(); },900);
  }else{
    showRpsLose(blobRpsLose(choice, botChoice));
  }
}
function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}

const stickEl = document.getElementById('stick');
const stickKnob = document.getElementById('stick-knob');
const stickInput = { dx:0, dz:0, pointerId:null };
const STICK_MAX = 48;

function resetStickKnob(){
  stickInput.dx=0; stickInput.dz=0; stickInput.pointerId=null;
  if(stickKnob) stickKnob.style.transform='translate(0px,0px)';
}
function refreshStick(){
  const show = running && overlay.style.display==='none';
  stickEl.classList.toggle('active', show);
  if(!show) resetStickKnob();
}
function updateStickFromEvent(e){
  const rect=stickEl.getBoundingClientRect();
  const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
  let ox=e.clientX-cx, oy=e.clientY-cy;
  const len=Math.hypot(ox,oy)||1;
  const clamped=Math.min(len, STICK_MAX);
  ox=ox/len*clamped; oy=oy/len*clamped;
  stickKnob.style.transform=`translate(${ox}px,${oy}px)`;
  stickInput.dx=ox/STICK_MAX;
  stickInput.dz=oy/STICK_MAX;
}
stickEl.addEventListener('pointerdown',e=>{
  if(!running||overlay.style.display!=='none')return;
  stickEl.setPointerCapture(e.pointerId);
  stickInput.pointerId=e.pointerId;
  updateStickFromEvent(e);
  e.preventDefault();
});
stickEl.addEventListener('pointermove',e=>{
  if(stickInput.pointerId!==e.pointerId)return;
  updateStickFromEvent(e);
});
function endStick(e){
  if(stickInput.pointerId!==e.pointerId)return;
  resetStickKnob();
}
stickEl.addEventListener('pointerup',endStick);
stickEl.addEventListener('pointercancel',endStick);

function updatePlayer(dt){
  const keys=phaserScene?.keys;
  let dx=0, dz=0;
  const stickMag=Math.hypot(stickInput.dx,stickInput.dz);
  if(stickMag>0.08){
    dx=stickInput.dx; dz=stickInput.dz;
  }else if(keys){
    dx=(keys.d.isDown||keys.right.isDown?1:0)-(keys.a.isDown||keys.left.isDown?1:0);
    dz=(keys.s.isDown||keys.down.isDown?1:0)-(keys.w.isDown||keys.up.isDown?1:0);
  }
  const len=Math.hypot(dx,dz); if(len>0){dx/=len;dz/=len; player.facing=Math.atan2(dx,dz);}
  const accel=player.speed;
  player.vx+=(dx*accel-player.vx)*Math.min(1,dt*7);
  player.vz+=(dz*accel-player.vz)*Math.min(1,dt*7);
  player.x+=player.vx*dt; player.z+=player.vz*dt;
  const limit=ARENA-player.radius*.8;
  player.x=THREE.MathUtils.clamp(player.x,-limit,limit); player.z=THREE.MathUtils.clamp(player.z,-limit,limit);
}
function botCanEatPlayer(bot){return canEat(bot.stage,player.stage);}
function updateBots(dt){
  for(const b of bots){
    if(!b.alive)continue;
    b.think-=dt;
    if(b.think<=0){
      b.think=.25+Math.random()*.45;
      let target=null, best=Infinity;
      const consider=(obj,dist)=>{ if(dist<best){best=dist;target=obj;} };
      if(botCanEatPlayer(b)) consider(player,distance(b,player));
      for(const other of bots){ if(other===b||!other.alive)continue; if(canEat(b.stage,other.stage) || (b.stage===4&&other.stage===4) || (b.stage===0&&other.stage===0)) {const d=distance(b,other); if(d<best)consider(other,d);} }
      if(target && best<13){b.tx=target.x;b.tz=target.z;}
      else if(Math.random()<.72){b.tx=THREE.MathUtils.clamp(b.x+(Math.random()-.5)*15,-ARENA+2,ARENA-2);b.tz=THREE.MathUtils.clamp(b.z+(Math.random()-.5)*15,-ARENA+2,ARENA-2);}
    }
    let dx=b.tx-b.x,dz=b.tz-b.z,dist=Math.hypot(dx,dz);
    if(dist>.2){dx/=dist;dz/=dist;b.facing=Math.atan2(dx,dz);}else{dx=0;dz=0;}
    b.vx+=(dx*b.speed-b.vx)*Math.min(1,dt*2.4); b.vz+=(dz*b.speed-b.vz)*Math.min(1,dt*2.4);
    b.x+=b.vx*dt;b.z+=b.vz*dt;
    const lim=ARENA-b.radius*.8;
    if(b.x>lim||b.x< -lim){b.vx*=-.7;b.tx=-b.tx*.8;b.x=THREE.MathUtils.clamp(b.x,-lim,lim);}
    if(b.z>lim||b.z< -lim){b.vz*=-.7;b.tz=-b.tz*.8;b.z=THREE.MathUtils.clamp(b.z,-lim,lim);}
  }
}
function botEat(bot,prey){
  if(!bot.alive||!prey.alive)return;
  removeBot(prey);
  if(bot.stage<4){bot.stage++;bot.radius=STAGES[bot.stage].radius;bot.speed=STAGES[bot.stage].speed;scene.remove(bot.group);disposeGroup(bot.group);bot.group=makeBlob(bot.stage);scene.add(bot.group);}
}
function resolveCollisions(){
  if(!running)return;
  for(const b of bots){
    if(!b.alive)continue;
    const d=distance(player,b);
    if(d < player.radius+b.radius*.78){
      if(player.stage===4 && b.stage===4){showRPS(b);return;}
      if(canEat(player.stage,b.stage)){playerEat(b);if(!running)return;}
      else if(canEat(b.stage,player.stage)){loseGame();return;}
    }
  }
  for(let i=0;i<bots.length;i++){
    const a=bots[i]; if(!a.alive)continue;
    for(let j=i+1;j<bots.length;j++){
      const b=bots[j];if(!b.alive)continue;
      if(distance(a,b)<(a.radius+b.radius)*.78){
        if((a.stage===4&&b.stage===4)||(a.stage===0&&b.stage===0)){ if(Math.random()<.5)botEat(a,b);else botEat(b,a); }
        else if(canEat(a.stage,b.stage))botEat(a,b);
        else if(canEat(b.stage,a.stage))botEat(b,a);
      }
    }
  }
  checkVictory();
}
function updateHud(force=false){
  if(!phaserScene||!phaserScene.hud||!player)return;
  const now=performance.now(); if(!force&&now-lastHud<100)return;lastHud=now;
  const remaining=bots.filter(b=>b.alive).length;
  phaserScene.hud.setText(blobHudLine(player.stage, player.radius, player.speed, remaining));
  phaserScene.hud.setColor(player.stage===4?'#ffdb72':player.stage===3?'#c4bbae':player.stage===2?'#8df4bc':'#b8e3ff');
}

class OverlayScene extends Phaser.Scene {
  constructor(){super({key:'OverlayScene'});}
  create(){
    this.keys=this.input.keyboard.addKeys({w:'W',a:'A',s:'S',d:'D',up:'UP',down:'DOWN',left:'LEFT',right:'RIGHT'});
    this.hud=this.add.text(118,20,'BLOB EVOLUTION',{fontFamily:'Arial, sans-serif',fontSize:'15px',fontStyle:'bold',color:'#b8e3ff',lineSpacing:5,stroke:'#071321',strokeThickness:4}).setScrollFactor(0);
    this.hud.setDepth(20);
    const hint=this.add.text(118,108,blobHudHint(),{fontFamily:'Arial, sans-serif',fontSize:'10px',color:'#91a9c1',stroke:'#071321',strokeThickness:3,wordWrap:{width:Math.max(160,innerWidth-140)}}).setScrollFactor(0).setDepth(20);
    this.scale.on('resize',size=>{ hint.setWordWrapWidth(Math.max(160,size.width-140)); });
  }
  update(time,delta){
    if(!running||!player)return;
    const dt=Math.min(delta/1000,.04);
    updatePlayer(dt);updateBots(dt);resolveCollisions();updateHud();
  }
}

function startGame(){
  duelBot=null; duelBusy=false;
  resetRpsPanel();
  overlay.style.display='none';startPanel.hidden=true;rpsPanel.hidden=true;endPanel.hidden=true;
  spawnGame();
  refreshStick();
}
applyBlobChrome();
document.getElementById('start-btn').addEventListener('click',startGame);
document.getElementById('restart-btn').addEventListener('click',startGame);
document.getElementById('rps-restart-btn').addEventListener('click',startGame);
document.querySelectorAll('[data-choice]').forEach(btn=>btn.addEventListener('click',()=>chooseRPS(btn.dataset.choice)));

const phaserScene=new OverlayScene();
initThree();
new Phaser.Game({type:Phaser.AUTO,parent:'phaser-ui',width:innerWidth,height:innerHeight,transparent:true,backgroundColor:'rgba(0,0,0,0)',scene:[phaserScene],scale:{mode:Phaser.Scale.RESIZE},render:{transparent:true,antialias:true}});
