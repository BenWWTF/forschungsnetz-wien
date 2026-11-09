import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { STRINGS, TOUR, aboutHtml } from './texts.js';

const TOPIC_COLORS = ['#2f6fd0', '#35b58a', '#b8336a', '#f2c94c'];   // physical, life, health, social (validated for colour-vision deficiencies)
const NO_TOPIC = '#7d8aa5';
const BG = new THREE.Color('#000000');
const WHITE = new THREE.Color('#ffffff');
const SEG = 14;                 // cylinder pieces per line, so lines can curve
const IDLE_MS = (+new URLSearchParams(location.search).get('idle') || 90) * 1000;   // ?idle=30 sets the seconds until the exhibit resets itself
const HOME = { net: { pos: [0, 45, 262], target: [0, -6, 0] }, city: { pos: [0, 100, 150], target: [0, 0, 8] } };
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: true }); }
catch { $('fallback').textContent = STRINGS.de.noWebgl; $('fallback').hidden = false; throw new Error('WebGL unavailable'); }

const [graph, wien] = await Promise.all(['data/graph.json', 'data/wien.json'].map(u => fetch(u).then(r => r.json())));
const nodes = graph.nodes, edges = graph.edges;
nodes.forEach((n, i) => {
  n.i = i;
  const top = n.dom.indexOf(Math.max(...n.dom));
  n.color = n.dom[top] ? TOPIC_COLORS[top] : NO_TOPIC;
  n.links = [];
});
edges.forEach(e => { nodes[e.a].links.push({ other: e.b, n: e.n }); nodes[e.b].links.push({ other: e.a, n: e.n }); });
nodes.forEach(n => n.links.sort((x, y) => y.n - x.n));
const own = n => n.count - n.joint;   // published without another Vienna institution: drawn as small arcs that leave the sphere and fall back to it

const state = { lang: 'de', view: 'net', mix: 0, selected: null, hovered: null, tour: null, list: false, emph: null };

// ── scene ──────────────────────────────────────────────────────────────────────────────────
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = BG;
scene.fog = new THREE.Fog(BG, 200, 520);
const camera = new THREE.PerspectiveCamera(42, 1, 1, 1200);
camera.position.set(...HOME.net.pos);
scene.add(camera, new THREE.AmbientLight(0xffffff, 1.5));
const lamp = new THREE.DirectionalLight(0xffffff, 2.2);
lamp.position.set(-0.5, 0.8, 1);
camera.add(lamp);   // light travels with the viewer, so no sphere is ever in the dark

const controls = new OrbitControls(camera, renderer.domElement);
Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minDistance: 35, maxDistance: 380, autoRotate: !calm, autoRotateSpeed: 0.5 });

const ball = new THREE.SphereGeometry(1, 40, 28);
const cur = nodes.map(n => new THREE.Vector3(...n.net));
const meshes = nodes.map(n => {
  const base = new THREE.Color(n.color);
  const m = new THREE.Mesh(ball, new THREE.MeshStandardMaterial({ color: base, emissive: base, emissiveIntensity: 0.35, roughness: 0.6, metalness: 0 }));
  m.userData.base = base;
  scene.add(m);
  return m;
});

/* One width scale for lines and rings, so a ring can be compared with the lines next to it. */
const maxJoint = Math.max(...edges.map(e => e.n));
const strength = e => Math.log2(e.n + 1) / Math.log2(maxJoint + 1);   // 0…1
const width = count => 0.06 + 0.85 * Math.pow(Math.log2(count + 1) / Math.log2(maxJoint + 1), 1.6);

function softDot() {   // round, soft-edged sprite for the travelling lights
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.35, 'rgba(255,255,255,.45)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const glow = softDot();

/* In-house work, drawn like the prominences of the sun: small arcs that rise from a sphere and
   fall back to it. The more a place publishes without a Vienna partner, the more arcs (1 to 7). */
const ASEG = 8;
const maxOwn = Math.max(...nodes.map(own));
const seeded = k => { const x = Math.sin(k * 127.1) * 43758.5453; return x - Math.floor(x); };   // repeatable pseudo-random 0…1
const arcs = [];
nodes.forEach((n, i) => {
  if (!own(n)) return;
  const count = Math.max(1, Math.round(7 * Math.log2(own(n) + 1) / Math.log2(maxOwn + 1)));
  for (let j = 0; j < count; j++) {
    const k = i * 31 + j * 7, unit = o => new THREE.Vector3(seeded(k + o) - 0.5, seeded(k + o + 1) - 0.5, seeded(k + o + 2) - 0.5).normalize();
    arcs.push({ i, lean: unit(1), twist: unit(5), rise: 1.9 + 0.9 * seeded(k + 9), span: 0.4 + 0.3 * seeded(k + 11),
      from: new THREE.Vector3(), top: new THREE.Vector3(), to: new THREE.Vector3() });
  }
});
const arcMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 5, 1, true),
  new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false }), arcs.length * ASEG);
arcMesh.frustumCulled = false; arcMesh.renderOrder = 2;
scene.add(arcMesh);
const outward = nodes.map(() => new THREE.Vector3());   // away from the centre of the network, upward above the map

/* Small lights that travel along the lines, in both directions, and around the rings. */
const flecks = [];
edges.forEach((e, k) => { const count = 1 + Math.round(3 * strength(e)); for (let j = 0; j < count; j++) flecks.push({ edge: k, u0: (j + (k * 0.37) % 1) / count, dir: (j + k) % 2 ? 1 : -1 }); });
arcs.forEach((a, k) => flecks.push({ arc: k, u0: seeded(k + 3) }));
const fleckCloud = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(flecks.length * 3), 3)),
  new THREE.PointsMaterial({ map: glow, size: 2.4, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
fleckCloud.frustumCulled = false; fleckCloud.renderOrder = 3; fleckCloud.visible = !calm;
scene.add(fleckCloud);
const curve = edges.map(() => new THREE.Vector3());   // bezier control point of every line, kept for the flecks

const edgeMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 6, 1, true),
  new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, depthWrite: false }), edges.length * SEG);
edgeMesh.frustumCulled = false;
edgeMesh.renderOrder = 2;   // after the ghost spheres
scene.add(edgeMesh);

const stalks = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodes.length * 6), 3)),
  new THREE.LineBasicMaterial({ color: 0xbdbdbd, transparent: true, opacity: 0, depthWrite: false }));
stalks.frustumCulled = false;
scene.add(stalks);

const map = buildMap();
scene.add(map.group);

function buildMap() {
  const group = new THREE.Group(), fades = [];
  const mat = (color, opacity, Type = THREE.MeshBasicMaterial) => {
    const m = new Type({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    fades.push([m, opacity]);
    return m;
  };
  const flat = (ring, material, y) => {   // polygon on the ground; ring is [[x, z], …]
    const g = new THREE.ShapeGeometry(new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z))));
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, material); m.position.y = y; group.add(m);
  };
  const land = mat('#1c1830', 0.9), border = mat('#7e60e2', 0.75, THREE.LineBasicMaterial), water = mat('#2a86c8', 0.9);
  for (const d of wien.districts) {
    flat(d.ring, land, 0);
    group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(d.ring.map(([x, z]) => new THREE.Vector3(x, 0.05, z))), border));
  }
  wien.lakes.forEach(ring => flat(ring, water, 0.08));
  for (const r of wien.rivers) {   // a river is a line in the source data: draw it as a ribbon of its real width
    const pts = r.line, pos = [], idx = [];
    pts.forEach(([x, z], i) => {
      const [ax, az] = pts[Math.max(0, i - 1)], [bx, bz] = pts[Math.min(pts.length - 1, i + 1)];
      const len = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / len * r.w / 2, nz = (bx - ax) / len * r.w / 2;
      pos.push(x + nx, 0.08, z + nz, x - nx, 0.08, z - nz);
      if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    group.add(new THREE.Mesh(g, water));
  }
  group.visible = false;
  return { group, fade(t) { group.visible = t > 0.01; fades.forEach(([m, o]) => { m.opacity = o * t; }); } };
}

// ── positions, lines, highlight ────────────────────────────────────────────────────────────
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const UP = new THREE.Vector3(0, 1, 0), AXIS_Z = new THREE.Vector3(0, 0, 1), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpC = new THREE.Vector3();
const dummy = new THREE.Object3D(), tmpColor = new THREE.Color();
const radiusNow = n => n.r * (1 - (1 - graph.cityScale) * state.mix);
const bezier = (a, ctrl, b, u, out) => out.copy(a).multiplyScalar((1 - u) * (1 - u)).addScaledVector(ctrl, 2 * u * (1 - u)).addScaledVector(b, u * u);

function placeNodes(time) {
  const t = state.mix, at = stalks.geometry.attributes.position;
  const sway = calm ? 0 : 1.6 * (1 - t);   // the network breathes; above the map the addresses hold still
  nodes.forEach((n, i) => {
    const p = cur[i].set(...n.net).lerp(tmpA.set(...n.city), t), r = radiusNow(n);
    if (sway) { p.x += sway * Math.sin(time * 0.0006 + i * 1.7); p.y += sway * Math.sin(time * 0.0005 + i * 2.3); p.z += sway * Math.sin(time * 0.0007 + i * 0.9); }
    meshes[i].position.copy(p); meshes[i].scale.setScalar(r);
    outward[i].copy(p).normalize().lerp(UP, t).normalize();
    at.setXYZ(2 * i, n.ground[0], 0, n.ground[1]);
    at.setXYZ(2 * i + 1, p.x, p.y, p.z);
  });
  at.needsUpdate = true;
  stalks.material.opacity = 0.55 * t * t; stalks.visible = t > 0.01;
  map.fade(t);
  placeEdges();
}

function placeEdges() {
  const t = state.mix, em = state.emph;
  edges.forEach((e, k) => {
    const a = cur[e.a], b = cur[e.b];
    // in the network a line bows outward, away from the centre; above the map it arches upward
    const ctrl = curve[k].addVectors(a, b).multiplyScalar(0.5 * (1 + 0.32 * (1 - t)));
    ctrl.y += (a.distanceTo(b) * 0.3 + 2) * t;
    const hidden = em && !em.edge(e);   // lines outside the focus vanish
    const w = width(e.n) * (1 - 0.45 * t);
    for (let s = 0; s < SEG; s++) {
      bezier(a, ctrl, b, s / SEG, tmpA); bezier(a, ctrl, b, (s + 1) / SEG, tmpB);
      const len = tmpA.distanceTo(tmpB);
      dummy.position.addVectors(tmpA, tmpB).multiplyScalar(0.5);
      dummy.quaternion.setFromUnitVectors(UP, tmpB.sub(tmpA).normalize());
      if (hidden) dummy.scale.setScalar(0); else dummy.scale.set(w, len * 1.04, w);   // slight overlap hides the joints
      dummy.updateMatrix();
      edgeMesh.setMatrixAt(k * SEG + s, dummy.matrix);
    }
  });
  arcs.forEach((arc, k) => {
    const i = arc.i, p = cur[i], r = radiusNow(nodes[i]), hidden = em && !em.nodes.has(i) && !em.near.has(i);
    const dir = tmpC.copy(outward[i]).addScaledVector(arc.lean, 1.1).normalize();          // where on the sphere the arc stands
    const side = tmpB.crossVectors(dir, arc.twist).normalize().multiplyScalar(arc.span);  // how far apart its two feet are
    arc.from.copy(dir).add(side).normalize().multiplyScalar(r).add(p);
    arc.to.copy(dir).sub(side).normalize().multiplyScalar(r).add(p);
    arc.top.copy(p).addScaledVector(dir, r * arc.rise);
    const w = 0.035 * r + 0.1;
    for (let s = 0; s < ASEG; s++) {
      bezier(arc.from, arc.top, arc.to, s / ASEG, tmpA); bezier(arc.from, arc.top, arc.to, (s + 1) / ASEG, tmpB);
      const len = tmpA.distanceTo(tmpB);
      dummy.position.addVectors(tmpA, tmpB).multiplyScalar(0.5);
      dummy.quaternion.setFromUnitVectors(UP, tmpB.sub(tmpA).normalize());
      if (hidden) dummy.scale.setScalar(0); else dummy.scale.set(w, len * 1.06, w);
      dummy.updateMatrix();
      arcMesh.setMatrixAt(k * ASEG + s, dummy.matrix);
    }
  });
  arcMesh.instanceMatrix.needsUpdate = true;
  edgeMesh.instanceMatrix.needsUpdate = true;
  edgeMesh.material.opacity = em ? 0.95 : 0.9 - 0.4 * t;   // over the map the arcs step back until a place is chosen
}

function moveFlecks(time) {
  const em = state.emph, at = fleckCloud.geometry.attributes.position, sec = time / 1000;
  flecks.forEach((f, j) => {
    if (f.edge !== undefined) {
      const e = edges[f.edge], a = cur[e.a], b = cur[e.b];
      if (em && !em.edge(e)) { at.setXYZ(j, 0, 1e6, 0); return; }
      let u = (f.u0 + sec * 9 / (a.distanceTo(b) + 1)) % 1;   // the same speed on every line
      if (f.dir < 0) u = 1 - u;
      bezier(a, curve[f.edge], b, u, tmpA);
    } else {
      const arc = arcs[f.arc];
      if (em && !em.nodes.has(arc.i) && !em.near.has(arc.i)) { at.setXYZ(j, 0, 1e6, 0); return; }
      bezier(arc.from, arc.top, arc.to, (f.u0 + sec * 0.22) % 1, tmpA);
    }
    at.setXYZ(j, tmpA.x, tmpA.y, tmpA.z);
  });
  at.needsUpdate = true;
  fleckCloud.material.size = 2.4 * (1 - 0.4 * state.mix);
}

/* emph: null, or { nodes: Set (lit), near: Set (lit), edge: e => bool }. Everything else recedes. */
function paint() {
  const em = state.emph;
  nodes.forEach((n, i) => {
    const m = meshes[i].material, lit = !em || em.nodes.has(i) || em.near.has(i);
    // places outside the focus turn into ghosts, so they never hide what is being shown
    m.transparent = !lit; m.opacity = lit ? 1 : 0.16; m.depthWrite = lit; m.needsUpdate = true;
    meshes[i].renderOrder = lit ? 0 : 1;
    m.emissiveIntensity = em && em.nodes.has(i) ? 0.6 : 0.35;
  });
  edges.forEach((e, k) => {
    // a line runs from the colour of one place to the colour of the other. On black, darker reads
    // as fainter: one-off partnerships recede, close ones shine
    const from = meshes[e.a].userData.base, to = meshes[e.b].userData.base, shine = em ? 1 : 0.2 + 0.8 * strength(e);
    for (let s = 0; s < SEG; s++) edgeMesh.setColorAt(k * SEG + s, tmpColor.copy(from).lerp(to, (s + 0.5) / SEG).lerp(WHITE, 0.25).multiplyScalar(shine));
  });
  edgeMesh.instanceColor.needsUpdate = true;
  placeEdges();
}

const focusNode = i => ({ nodes: new Set([i]), near: new Set(nodes[i].links.map(l => l.other)), edge: e => e.a === i || e.b === i });
const focusPair = (a, b) => ({ nodes: new Set([a, b]), near: new Set(), edge: e => (e.a === a && e.b === b) || (e.a === b && e.b === a) });

// ── camera moves ───────────────────────────────────────────────────────────────────────────
let flight = null, mixing = null;

function flyTo(pos, target, ms = 1300) {
  if (calm) { camera.position.copy(pos); controls.target.copy(target); return; }
  flight = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(), start: performance.now(), ms };
}
const upright = matchMedia('(max-width: 900px) and (orientation: portrait)');   // the phone layout of style.css

function home() {
  const h = HOME[state.view], pos = new THREE.Vector3(...h.pos), target = new THREE.Vector3(...h.target);
  if (upright.matches) {   // narrow screen: step back until the width fits, and sit above the bottom row
    if (state.view === 'net') target.y -= 12; else target.z += 16;
    pos.sub(new THREE.Vector3(...h.target)).multiplyScalar(state.view === 'net' ? 1.08 : 1.25).add(target);
  }
  const dir = pos.clone().sub(target), dist = dir.length(), shift = cardShift(dir.normalize(), dist);
  return [pos.add(shift), target.add(shift)];
}
function flyHome() { flyTo(...home()); }

/* How far the camera must step aside so that what it looks at sits in the part of the screen
   an open card leaves free. Measured from the card itself, so every layout is covered:
   side panel, bottom sheet, tour card. */
function cardShift(dir, dist) {
  const card = state.tour !== null ? $('tour') : $('panel');
  if (card.hidden) return new THREE.Vector3();
  const r = card.getBoundingClientRect(), viewH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const right = new THREE.Vector3().crossVectors(UP, dir).normalize();
  if (r.left < W / 2 && r.right > W / 2) return new THREE.Vector3().crossVectors(dir, right).multiplyScalar(-(H - r.top) / 2 / H * viewH);   // card below
  return right.multiplyScalar((W - r.left) / 2 / W * viewH * camera.aspect);                                                                 // card at the right
}
matchMedia('(orientation: portrait)').addEventListener('change', () => setTimeout(() => { if (state.selected === null) flyHome(); else flyToNode(state.selected); }, 100));   // after the layout has turned

function flyToNode(i) {
  const n = nodes[i], target = new THREE.Vector3(...(state.view === 'net' ? n.net : n.city));
  const dir = camera.position.clone().sub(controls.target).normalize();
  if (state.view === 'city') { dir.y = Math.max(dir.y, 0.45); dir.normalize(); }
  const dist = state.view === 'net' ? 125 : 90;
  flyFacing(target, dir, dist);
}

/* Look at `target` from direction `dir`, clear of any open card. */
function flyFacing(target, dir, dist) {
  const centre = target.clone().add(cardShift(dir, dist));
  flyTo(centre.clone().addScaledVector(dir, dist), centre);
}

function setView(view) {
  if (view === state.view) return;
  state.view = view;
  $('viewNet').setAttribute('aria-pressed', view === 'net'); $('viewCity').setAttribute('aria-pressed', view === 'city');
  controls.maxPolarAngle = view === 'city' ? 1.42 : Math.PI;
  mixing = { from: state.mix, to: view === 'city' ? 1 : 0, start: performance.now(), ms: calm ? 1 : 1600 };
  if (state.selected !== null) flyToNode(state.selected); else flyHome();
}

// ── labels ─────────────────────────────────────────────────────────────────────────────────
const labelBox = $('labels');
const labels = nodes.map(n => { const el = document.createElement('div'); el.className = 'lbl'; el.textContent = n.id; labelBox.append(el); return { el, w: 0, h: 0 }; });
const districtLabels = wien.districts.map(d => { const el = document.createElement('div'); el.className = 'lbl district'; el.textContent = d.nr + '.'; labelBox.append(el); return { el, at: new THREE.Vector3(d.at[0], 0, d.at[1]) }; });
const screen = nodes.map(() => ({ x: 0, y: 0, r: 0, depth: 0, visible: false }));
let W = 1, H = 1;

function project() {
  const focal = H / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  nodes.forEach((n, i) => {
    tmpA.copy(cur[i]).applyMatrix4(camera.matrixWorldInverse);
    const s = screen[i];
    s.depth = -tmpA.z; s.visible = s.depth > 1;
    if (!s.visible) return;
    s.x = W / 2 + tmpA.x / s.depth * focal; s.y = H / 2 - tmpA.y / s.depth * focal; s.r = radiusNow(n) / s.depth * focal;
  });
}

function drawLabels() {
  const em = state.emph, placed = [];
  const wanted = i => i === state.hovered || (em ? em.nodes.has(i) || em.near.has(i) : i < 14);
  const order = nodes.map((_, i) => i).filter(i => screen[i].visible && wanted(i))
    .sort((a, b) => rank(a) - rank(b));
  function rank(i) { return (i === state.hovered || (em && em.nodes.has(i)) ? -1000 : 0) + i; }
  const shown = new Set();
  for (const i of order) {
    const s = screen[i], l = labels[i];
    if (!l.w) { l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; }
    const strong = em ? em.nodes.has(i) : false, scale = strong ? 1.2 : 1;
    const inside = s.r * 2 > l.w * scale + 10;   // a sphere wide enough carries its own name
    const box = { x: s.x - l.w * scale / 2, y: inside ? s.y - l.h * scale / 2 : s.y + s.r + 4, w: l.w * scale, h: l.h * scale };
    if (box.x + box.w < 0 || box.x > W || box.y < 0 || box.y > H) continue;
    if (placed.some(p => box.x < p.x + p.w + 6 && p.x < box.x + box.w + 6 && box.y < p.y + p.h && p.y < box.y + box.h)) continue;
    placed.push(box); shown.add(i);
    l.el.style.transform = `translate(${Math.round(box.x)}px,${Math.round(box.y)}px)`;
    l.el.classList.toggle('strong', strong);
  }
  labels.forEach((l, i) => l.el.classList.toggle('on', shown.has(i)));
  const districtsOn = state.mix > 0.6;
  for (const d of districtLabels) {
    tmpA.copy(d.at).project(camera);
    const on = districtsOn && tmpA.z < 1;
    d.el.classList.toggle('on', on);
    if (on) d.el.style.transform = `translate(${Math.round((tmpA.x + 1) / 2 * W - 8)}px,${Math.round((1 - tmpA.y) / 2 * H - 9)}px)`;
  }
}

// ── pointer ────────────────────────────────────────────────────────────────────────────────
function pick(x, y) {   // nearest sphere under the finger, with a generous minimum target
  let best = null;
  screen.forEach((s, i) => {
    if (!s.visible || Math.hypot(s.x - x, s.y - y) > Math.max(s.r, 24)) return;
    if (best === null || s.depth < screen[best].depth) best = i;
  });
  return best;
}
let down = null, lastInput = performance.now();
const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; flight = null; });
canvas.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8 || performance.now() - down.t > 600) return;
  if (state.tour !== null) return;
  select(pick(e.clientX, e.clientY));
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  state.hovered = pick(e.clientX, e.clientY);
  canvas.classList.toggle('pick', state.hovered !== null && state.tour === null);
});
canvas.addEventListener('pointerleave', () => { state.hovered = null; });
for (const type of ['pointerdown', 'keydown', 'wheel']) addEventListener(type, () => { lastInput = performance.now(); }, { passive: true, capture: true });

// ── panel, tour, texts ─────────────────────────────────────────────────────────────────────
const t = key => STRINGS[state.lang][key];
const num = v => v.toLocaleString(state.lang === 'de' ? 'de-DE' : 'en-GB');
const since = () => new Date(graph.from).toLocaleDateString(state.lang === 'de' ? 'de-DE' : 'en-GB', { month: 'long', year: 'numeric' });
const dot = color => `<span class="dot" style="background:${color}"></span>`;
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
const facts = () => {
  const big = nodes[0], pair = edges[0];
  return { places: nodes.length, pairs: edges.length, since: since(), big: esc(big.id), bigCount: num(big.count),
    pairA: esc(nodes[pair.a].id), pairB: esc(nodes[pair.b].id), pairCount: num(pair.n),
    total: num(graph.total), joint: num(graph.joint), share: Math.round(100 * graph.joint / graph.total) };
};

function select(i) {
  if (i === null && state.selected === null && !state.list) return;
  state.selected = i; state.list = false;
  state.emph = i === null ? null : focusNode(i);
  controls.autoRotate = !calm && i === null;
  paint(); renderPanel();
  if (i === null) flyHome(); else flyToNode(i);
}

function renderPanel() {
  const panel = $('panel'), i = state.selected;
  panel.hidden = i === null && !state.list;
  document.body.classList.toggle('busy', !panel.hidden || state.tour !== null);
  if (panel.hidden) return;
  const close = `<button type="button" class="btn close" id="panelClose" aria-label="${t('close')}">×</button>`;
  if (i === null) {
    panel.innerHTML = `${close}<h2>${fill(t('listTitle'), facts())}</h2><p class="note">${fill(t('listNote'), facts())}</p>
      <div class="rows" style="margin-top:14px">${nodes.map(n => `<button type="button" class="row" data-node="${n.i}">${dot(n.color)}<span>${esc(n.id)}</span><span class="n">${num(n.count)}</span></button>`).join('')}</div>`;
  } else {
    const n = nodes[i], name = state.lang === 'de' ? n.name : n.en, sum = n.dom.reduce((a, b) => a + b, 0);
    const pct = Math.round(100 * n.joint / n.count);
    const mix = n.dom.map((v, d) => ({ v, d })).filter(x => x.v).sort((a, b) => b.v - a.v);
    panel.innerHTML = `${close}<p class="kind">${t('kind')[n.type]}</p><h2>${esc(name)}</h2>
      ${name !== n.id ? `<p class="also">${t('short')} ${esc(n.id)}</p>` : ''}
      ${n.members.length ? `<p class="also">${t('members')} ${esc(n.members.join(', '))}</p>` : ''}
      <p class="hero"><b>${num(n.count)}</b><span>${fill(t('heroUnit'), facts())}</span></p>
      <h3>${t('togetherTitle')}</h3>
      <div class="together"><i style="width:${pct}%"></i></div>
      <p class="note">${fill(t('togetherNote'), { n: `<b>${num(n.joint)}</b>`, pct })}${own(n) ? ' ' + fill(t('ringNote'), { n: num(own(n)) }) : ''}</p>
      ${sum ? `<h3>${t('topicsTitle')}</h3>
      <div class="mix">${mix.map(x => `<i style="flex:${x.v};background:${TOPIC_COLORS[x.d]}"></i>`).join('')}</div>
      <ul class="mix-key">${mix.map(x => `<li>${dot(TOPIC_COLORS[x.d])}<span>${t('topics')[x.d]}</span><span class="n">${Math.round(100 * x.v / sum)} %</span></li>`).join('')}</ul>` : ''}
      <h3>${t('partnersTitle')}</h3>
      <div class="rows">${n.links.slice(0, 8).map(l => `<button type="button" class="row" data-node="${l.other}">${dot(nodes[l.other].color)}<span>${esc(nodes[l.other].id)}</span><span class="n">${num(l.n)}</span></button>`).join('')}</div>
      <p class="note">${fill(t('partnersNote'), { n: n.links.length })}</p>`;
  }
  panel.scrollTop = 0;
  $('panelClose').onclick = () => select(null);
  panel.querySelectorAll('[data-node]').forEach(b => { b.onclick = () => select(+b.dataset.node); });
}

function showTour(step) {
  state.tour = step;
  const open = step !== null;
  $('tour').hidden = !open; $('dock').hidden = open;
  if (!open) { state.emph = null; controls.autoRotate = !calm; paint(); setView('net'); flyHome(); renderPanel(); return; }
  state.selected = null; state.list = false; renderPanel();
  const s = TOUR[step], f = facts();
  $('tourCount').textContent = fill(t('step'), { i: step + 1, n: TOUR.length });
  $('tourTitle').textContent = s[state.lang].title;
  $('tourBody').innerHTML = s[state.lang].body.map(p => `<p>${fill(p, f)}</p>`).join('')
    + (s.show === 'topics' ? `<ul>${TOPIC_COLORS.map((c, d) => `<li>${dot(c)}${t('topics')[d]}</li>`).join('')}</ul>` : '');
  $('tourBack').hidden = step === 0;
  $('tourNext').textContent = step === TOUR.length - 1 ? t('tourDone') : t('next');
  controls.autoRotate = !calm;
  setView(s.show === 'city' ? 'city' : 'net');
  state.emph = s.show === 'pair' ? focusPair(edges[0].a, edges[0].b) : null;
  paint();
  if (s.show === 'biggest') flyToNode(0);
  else if (s.show === 'pair') {
    const a = new THREE.Vector3(...nodes[edges[0].a].net), b = new THREE.Vector3(...nodes[edges[0].b].net);
    const along = b.clone().sub(a).normalize(), dir = camera.position.clone().sub(controls.target);
    dir.addScaledVector(along, -dir.dot(along)).normalize();   // side-on, so the line is seen at full length
    flyFacing(a.add(b).multiplyScalar(0.5), dir, 100);
  } else flyHome();
}

function applyTexts() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-t-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.tLabel)); });
  document.title = t('docTitle');
  $('lang').textContent = state.lang === 'de' ? 'English' : 'Deutsch';
  $('subtitle').textContent = fill(t('subtitle'), facts());
  $('legendTopics').innerHTML = TOPIC_COLORS.map((c, d) => `<li>${dot(c)}${t('topics')[d]}</li>`).join('');
  $('aboutBody').innerHTML = aboutHtml(state.lang, { ...facts(), to: new Date(graph.to).toLocaleDateString(state.lang === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) });
  renderPanel();
  if (state.tour !== null) showTour(state.tour);
}

$('viewNet').onclick = () => setView('net');
$('viewCity').onclick = () => setView('city');
$('lang').onclick = () => { state.lang = state.lang === 'de' ? 'en' : 'de'; applyTexts(); };
$('tourStart').onclick = () => showTour(0);
$('tourBack').onclick = () => showTour(state.tour - 1);
$('tourNext').onclick = () => showTour(state.tour === TOUR.length - 1 ? null : state.tour + 1);
$('tourClose').onclick = () => showTour(null);
$('listOpen').onclick = () => { state.list = !state.list; renderPanel(); };
$('aboutOpen').onclick = () => $('about').showModal();
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('about').open) { if (state.tour !== null) showTour(null); else if (state.selected !== null || state.list) select(null); } });

/* An exhibit must find its way back to the start when a visitor walks off. */
function resetIfIdle(now) {
  if (now - lastInput < IDLE_MS) return;
  lastInput = now;
  const touched = state.tour !== null || state.selected !== null || state.list || state.view !== 'net' || $('about').open
    || camera.position.distanceTo(tmpA.set(...HOME.net.pos)) > 150;
  if (!touched) return;
  $('about').close();
  if (state.tour !== null) showTour(null); else { setView('net'); select(null); }
}

// ── loop ───────────────────────────────────────────────────────────────────────────────────
function resize() {
  W = innerWidth; H = innerHeight;
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  camera.fov = W < H ? 58 : 42;   // portrait screens need a wider view to hold the whole network
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

let placed = false;
function frame(now) {
  requestAnimationFrame(frame);
  if (mixing) {
    const u = Math.min(1, (now - mixing.start) / mixing.ms);
    state.mix = mixing.from + (mixing.to - mixing.from) * ease(u);
    if (u === 1) mixing = null;
  }
  if (mixing || !calm || !placed) { placeNodes(now); moveFlecks(now); placed = true; }
  if (flight) {
    const u = Math.min(1, (now - flight.start) / flight.ms), k = ease(u);
    camera.position.lerpVectors(flight.p0, flight.p1, k);
    controls.target.lerpVectors(flight.t0, flight.t1, k);
    if (u === 1) flight = null;
  }
  controls.autoRotateSpeed = state.view === 'city' ? 0.3 : 0.5;
  controls.update();
  camera.updateMatrixWorld();
  renderer.render(scene, camera);
  project();
  drawLabels();
  resetIfIdle(now);
}

document.fonts.ready.then(() => labels.forEach(l => { l.w = 0; }));   // label widths were measured in the fallback font
resize();
{ const [pos, target] = home(); camera.position.copy(pos); controls.target.copy(target); }
placeNodes(0);
arcs.forEach((arc, k) => { for (let s = 0; s < ASEG; s++) arcMesh.setColorAt(k * ASEG + s, tmpColor.copy(meshes[arc.i].userData.base).lerp(WHITE, 0.45)); });
paint();
applyTexts();
requestAnimationFrame(frame);
