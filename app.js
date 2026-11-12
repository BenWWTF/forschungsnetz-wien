import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { STRINGS, TOUR, EGGS, aboutHtml } from './texts.js';

/* Colours are read from the stylesheet, which takes them from design/tokens.css (the Q. styleguide). */
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const TOPIC_COLORS = ['--topic-tech', '--topic-life', '--topic-health', '--topic-society'].map(css);   // physical, life, health, social
const NO_TOPIC = css('--topic-none');
const BG = new THREE.Color('#000000');
const WHITE = new THREE.Color('#ffffff');
const LINE = new THREE.Color(css('--q-purple-40')), LINE_ON = new THREE.Color(css('--q-purple-20'));   // a tint no topic uses
const SEG = 14;                 // cylinder pieces per line, so lines can curve
const IDLE_MS = (+new URLSearchParams(location.search).get('idle') || 90) * 1000;   // ?idle=30 sets the seconds until the exhibit resets itself
const HOME = { net: { pos: [0, 45, 262], target: [0, -6, 0] }, city: { pos: [0, 100, 150], target: [0, 0, 8] } };
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
let still = calm;   // no continuous motion: set by the system preference or by the pause button
const TOUCH = 24;   // px: half a fingertip, the least a sphere offers as a target
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function fail(key) {   // say what went wrong, in both languages, instead of leaving a black page
  document.querySelector('h1').textContent = STRINGS.de.title;
  $('fallback').innerHTML = `${STRINGS.de[key]}<br>${STRINGS.en[key]}`; $('fallback').hidden = false;
  document.body.classList.add('failed');
  throw new Error(key);
}
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: true }); }
catch { fail('noWebgl'); }

const lightColour = c => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b > 0.5;   // White and Lime spheres need black lettering
let graph, wien;
/* The numbers are rebuilt every day on GitHub Pages. A copy of this page on another server asks there
   first, so it stays current without anyone copying files; without a connection, or after four seconds,
   it shows the data/graph.json it was shipped with. */
const LIVE = 'https://benwwtf.github.io/forschungsnetz-wien/';
const json = (u, opt) => fetch(u, opt).then(r => r.ok ? r.json() : Promise.reject(new Error(u)));
const current = location.href.startsWith(LIVE) ? Promise.reject()
  : json(LIVE + 'data/graph.json', { signal: AbortSignal.timeout(4000) }).then(g => Array.isArray(g.nodes) && Array.isArray(g.edges) ? g : Promise.reject());
try { [graph, wien] = await Promise.all([current.catch(() => json('data/graph.json')), json('data/wien.json')]); }
catch { fail('noData'); }
const nodes = graph.nodes, edges = graph.edges;
nodes.forEach((n, i) => {
  n.i = i;
  const top = n.dom.indexOf(Math.max(...n.dom));
  n.color = n.dom[top] ? TOPIC_COLORS[top] : NO_TOPIC;
  n.links = [];
  n.light = lightColour(new THREE.Color(n.color));
});
edges.forEach(e => { nodes[e.a].links.push({ other: e.b, n: e.n }); nodes[e.b].links.push({ other: e.a, n: e.n }); });
nodes.forEach(n => n.links.sort((x, y) => y.n - x.n));
const own = n => n.count - n.joint;   // published without another Vienna institution: drawn as small arcs that leave the sphere and fall back to it

if (new URLSearchParams(location.search).has('kiosk')) document.body.classList.add('kiosk');   // wall screen: every control within a child's reach
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
Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minDistance: 14, maxDistance: 380, autoRotate: !calm, autoRotateSpeed: 0.5 });

const ball = new THREE.SphereGeometry(1, 40, 28);
const cur = nodes.map(n => new THREE.Vector3(...n.net));
const meshes = nodes.map(n => {
  const base = new THREE.Color(n.color);
  const m = new THREE.Mesh(ball, new THREE.MeshStandardMaterial({ color: base, emissive: base, emissiveIntensity: 0.35, roughness: 0.6, metalness: 0 }));
  m.userData.base = base;
  scene.add(m);
  return m;
});
/* A thin light rim, so that dark spheres (Berry on black: 2.1 to 1) still have a visible edge. */
const rimMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide, transparent: true, opacity: 0.55, depthWrite: false });
const rims = nodes.map(() => { const r = new THREE.Mesh(ball, rimMaterial); scene.add(r); return r; });

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
    arcs.push({ i, lean: unit(1), twist: unit(5), rise: 1.5 + 0.35 * seeded(k + 9), span: 0.2 + 0.16 * seeded(k + 11),   // low and narrow: a flare on the surface, not a ring around it
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
  new THREE.PointsMaterial({ map: glow, size: 2.6, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
fleckCloud.frustumCulled = false; fleckCloud.renderOrder = 3; fleckCloud.visible = !still;
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
  const land = mat(new THREE.Color(css('--q-purple')).multiplyScalar(0.3), 0.95), border = mat(css('--q-purple-60'), 0.8, THREE.LineBasicMaterial), water = mat(css('--q-petrol'), 1);
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

/* Pull one, and the others feel it. Every sphere may be displaced from its resting place (`off`).
   A spring pulls it home, and every line passes on part of its neighbour's displacement: more
   along a strong partnership, and more from a big place to a small one than the other way round.
   Nothing here is measured; it is a picture of how a change in one place reaches the rest. */
const off = nodes.map(() => new THREE.Vector3()), vel = nodes.map(() => new THREE.Vector3()), acc = nodes.map(() => new THREE.Vector3());
const rest = nodes.map(() => new THREE.Vector3());
const mass = nodes.map(n => n.r * n.r);
const K_HOME = 22, K_LINK = 26, REACH = 55;
let grab = null;   // { i, plane, target } while a sphere is held
function ripple(dt) {
  if (!grab && !ripple.live) return false;
  const damping = still ? 9.5 : 6;   // a little wobble on the way home, none when motion is reduced
  nodes.forEach((_, i) => acc[i].copy(off[i]).multiplyScalar(-K_HOME).addScaledVector(vel[i], -damping));
  for (const e of edges) {
    const w = strength(e), pull = K_LINK * (0.08 + 0.92 * w * w),   // squared: close partners follow clearly more than loose ones
      d = tmpA.subVectors(off[e.b], off[e.a]), sum = mass[e.a] + mass[e.b];
    acc[e.a].addScaledVector(d, pull * mass[e.b] / sum);    // the heavier partner moves the lighter one
    acc[e.b].addScaledVector(d, -pull * mass[e.a] / sum);
  }
  let energy = 0;
  nodes.forEach((n, i) => {
    if (grab && grab.i === i) {   // the held sphere follows the finger, a big one more sluggishly
      off[i].lerp(grab.target, 1 - Math.exp(-dt * (26 - 2.2 * n.r))); vel[i].set(0, 0, 0);
    } else { vel[i].addScaledVector(acc[i], dt); off[i].addScaledVector(vel[i], dt); }
    energy += off[i].lengthSq() + vel[i].lengthSq();
  });
  ripple.live = grab !== null || energy > 0.002;
  if (!ripple.live) { off.forEach(o => o.set(0, 0, 0)); vel.forEach(v => v.set(0, 0, 0)); placed = false; }   // settle exactly at rest
  return ripple.live;
}

function placeNodes(time) {
  const t = state.mix, at = stalks.geometry.attributes.position;
  const sway = still ? 0 : 1.6 * (1 - t);   // the network breathes; above the map the addresses hold still
  nodes.forEach((n, i) => {
    const p = cur[i].set(...n.net).lerp(tmpA.set(...n.city), t), r = radiusNow(n);
    if (sway) { p.x += sway * Math.sin(time * 0.0006 + i * 1.7); p.y += sway * Math.sin(time * 0.0005 + i * 2.3); p.z += sway * Math.sin(time * 0.0007 + i * 0.9); }
    rest[i].copy(p); p.add(off[i]);
    meshes[i].position.copy(p); meshes[i].scale.setScalar(grab && grab.i === i ? r * 1.12 : r);
    rims[i].position.copy(p); rims[i].scale.setScalar(r + 0.28);
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
    const dir = tmpC.copy(outward[i]).addScaledVector(arc.lean, 0.8).normalize();          // where on the sphere the arc stands
    const side = tmpB.crossVectors(dir, arc.twist).normalize().multiplyScalar(arc.span);  // how far apart its two feet are
    arc.from.copy(dir).add(side).normalize().multiplyScalar(r).add(p);
    arc.to.copy(dir).sub(side).normalize().multiplyScalar(r).add(p);
    arc.top.copy(p).addScaledVector(dir, r * arc.rise);
    const w = 0.03 * r + 0.08;
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
    rims[i].visible = lit;
  });
  edges.forEach((e, k) => {
    // on black, darker reads as fainter: one-off partnerships recede, close ones shine
    if (em) tmpColor.copy(LINE_ON); else tmpColor.copy(LINE).multiplyScalar(0.16 + 0.84 * strength(e));
    for (let s = 0; s < SEG; s++) edgeMesh.setColorAt(k * SEG + s, tmpColor);
  });
  edgeMesh.instanceColor.needsUpdate = true;
  placeEdges();
}

const focusNode = i => ({ nodes: new Set([i]), near: new Set(nodes[i].links.map(l => l.other)), edge: e => e.a === i || e.b === i });
const focusPair = (a, b) => ({ nodes: new Set([a, b]), near: new Set(), edge: e => (e.a === a && e.b === b) || (e.a === b && e.b === a) });

let placed = false;   // false forces one redraw of positions while motion is paused

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
const qSite = new THREE.Vector3(wien.q[0], 1.5, wien.q[1]);   // the Q. on the city map, where the last egg waits
const screen = nodes.map(() => ({ x: 0, y: 0, r: 0, depth: 0, visible: false }));

/* Easter eggs: a button beside its sphere, shown once the camera is close to that place. */
/* Eggs come in stages: the next stage only exists once everything before it has been found.
   Most sit beside a sphere; the very last one sits at the Q. on the city map. */
const eggs = EGGS.map(e => ({ ...e, i: nodes.findIndex(n => n.id === e.node) })).filter(e => e.i >= 0 || e.at === 'q');
const found = new Set();
const unlocked = egg => eggs.every((other, k) => other.stage >= egg.stage || found.has(k));
const inPlay = () => eggs.filter(unlocked).length;
eggs.forEach((egg, k) => {
  egg.el = document.createElement('button'); egg.el.type = 'button'; egg.el.className = 'egg'; egg.el.hidden = true; egg.el.innerHTML = egg.icon;
  egg.el.onclick = () => openEgg(k);
  $('eggs').append(egg.el);
});
function placeEggs() {
  const em = state.emph, card = $('panel').hidden ? null : $('panel').getBoundingClientRect();
  const taken = [];   // two eggs at one place take different corners
  const free = (x, y) => x >= 4 && x <= W - 52 && y >= (upright.matches ? 134 : 100) && y <= H - 64 && !(card && x + 48 > card.left && y + 48 > card.top && x < card.right)
    && !taken.some(([tx, ty]) => Math.abs(tx - x) < 56 && Math.abs(ty - y) < 56);
  for (const egg of eggs) {
    let spot = null;
    if (!unlocked(egg) || state.tour !== null) spot = null;
    else if (egg.at === 'q') {   // beside the marker of the Q., whenever the city map is up
      tmpA.copy(qSite).project(camera);
      const x = (tmpA.x + 1) / 2 * W, y = (1 - tmpA.y) / 2 * H;
      if (state.mix > 0.6 && tmpA.z < 1) spot = [[-24, -24], [30, -24], [-78, -24]].map(([dx, dy]) => [x + dx, y + dy]).find(([sx, sy]) => free(sx, sy)) ?? null;
    } else {
      const s = screen[egg.i], d = s.r * 0.75 + 4;
      // shown for the place a visitor has opened, or when the camera has come close on its own
      const near = s.visible && (em ? em.nodes.has(egg.i) : camera.position.distanceTo(cur[egg.i]) < 110);
      if (near) spot = [[d, -d - 48], [-d - 48, -d - 48], [d, d], [-d - 48, d]].map(([dx, dy]) => [s.x + dx, s.y + dy]).find(([x, y]) => free(x, y)) ?? null;   // a corner of the sphere that is not covered
    }
    egg.el.hidden = !spot;
    if (spot) { taken.push(spot); egg.el.style.transform = `translate(${Math.round(spot[0])}px,${Math.round(spot[1])}px)`; }
  }
}
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
  const wanted = i => i === state.hovered || !em || em.nodes.has(i) || em.near.has(i);   // in the overview every place may show its name, biggest first, as many as fit
  const order = nodes.map((_, i) => i).filter(i => screen[i].visible && wanted(i))
    .sort((a, b) => rank(a) - rank(b));
  function rank(i) { return (i === state.hovered || (em && em.nodes.has(i)) ? -1000 : 0) + i; }
  const shown = new Set();
  for (const i of order) {
    const s = screen[i], l = labels[i];
    if (!l.w) { l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; }
    const strong = em ? em.nodes.has(i) : false, scale = strong ? 1.2 : 1;
    const inside = s.r * 2 > l.w * scale + 10;   // a sphere wide enough carries its own name
    const w = l.w * scale, h = l.h * scale;
    const fits = b => b.x >= 4 && b.x + w <= W - 4 && b.y >= 0 && b.y + h <= H   // never show half a name
      && !placed.some(p => b.x < p.x + p.w + 6 && p.x < b.x + w + 6 && b.y < p.y + p.h && p.y < b.y + h);
    const clear = b => !screen.some((o, j) => j !== i && o.visible && o.x + o.r > b.x && o.x - o.r < b.x + w && o.y + o.r > b.y && o.y - o.r < b.y + h);
    const under = { x: s.x - w / 2, y: inside ? s.y - h / 2 : s.y + s.r + 4 }, beside = { x: s.x + s.r + 6, y: s.y - h / 2 };
    // In or under the sphere; if that is taken, beside it, as long as the name does not land on another sphere.
    const at = fits(under) ? under : !inside && fits(beside) && clear(beside) ? beside : null;
    if (!at) continue;
    const box = { ...at, w, h };
    placed.push(box); shown.add(i);
    l.el.style.transform = `translate(${Math.round(box.x)}px,${Math.round(box.y)}px)`;
    l.el.classList.toggle('strong', strong);
    l.el.classList.toggle('dark', inside && nodes[i].light);
  }
  labels.forEach((l, i) => l.el.classList.toggle('on', shown.has(i)));
  placeEggs();
  const districtsOn = state.mix > 0.6;
  for (const d of districtLabels) {
    tmpA.copy(d.at).project(camera);
    const on = districtsOn && tmpA.z < 1;
    d.el.classList.toggle('on', on);
    if (on) d.el.style.transform = `translate(${Math.round((tmpA.x + 1) / 2 * W - 8)}px,${Math.round((1 - tmpA.y) / 2 * H - 9)}px)`;
  }
}

// ── pointer ────────────────────────────────────────────────────────────────────────────────
function pick(x, y) {
  let hit = null, near = null, nearD = Infinity;
  screen.forEach((s, i) => {
    if (!s.visible) return;
    const d = Math.hypot(s.x - x, s.y - y);
    if (d <= s.r && (hit === null || s.depth < screen[hit].depth)) hit = i;   // truly under the finger: the front one wins
    if (d <= TOUCH && d < nearD) { near = i; nearD = d; }                     // else the closest centre within a fingertip
  });
  if (hit !== null && near !== null && screen[near].depth < screen[hit].depth) return near;   // a small sphere in front of a big one
  return hit ?? near;
}

/* Where several small spheres share one fingertip, a tap cannot mean one of them.
   Returns those spheres, so the camera can move closer instead of guessing. */
function crowdAt(x, y) {
  const close = [];
  screen.forEach((s, i) => { if (s.visible && s.r < TOUCH && Math.hypot(s.x - x, s.y - y) <= TOUCH) close.push(i); });
  return close.length > 1 && camera.position.distanceTo(controls.target) > 40 ? close : null;
}
function zoomInto(group) {
  const centre = new THREE.Vector3(); group.forEach(i => centre.add(cur[i])); centre.divideScalar(group.length);
  const dir = camera.position.clone().sub(controls.target), dist = Math.max(26, dir.length() * 0.45);
  controls.autoRotate = false;
  flyTo(centre.clone().addScaledVector(dir.normalize(), dist), centre, 900);
  toast(t('crowd'), 2600);
}
function tap(x, y) {
  const group = state.emph ? null : crowdAt(x, y), i = pick(x, y);
  if (group && !(i !== null && Math.hypot(screen[i].x - x, screen[i].y - y) <= screen[i].r)) { zoomInto(group); return; }
  if (state.tour !== null) { if (i === null) return; showTour(null); }   // a tap on a sphere during the tour leaves the tour for that place
  select(i);
}

let down = null, lastInput = performance.now();
const canvas = renderer.domElement;
/* Hold a sphere for a moment, then drag: it moves in the plane facing the viewer. A quick drag
   still turns the whole network, a short tap still opens the place. */
const HOLD_MS = 170, ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let holdTimer = null;
function pointOnPlane(e, plane, out) {
  ndc.set(e.clientX / W * 2 - 1, 1 - e.clientY / H * 2); ray.setFromCamera(ndc, camera);
  return ray.ray.intersectPlane(plane, out);
}
function startGrab(i, e) {
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), cur[i]);
  const hit = pointOnPlane(e, plane, new THREE.Vector3()); if (!hit) return;
  grab = { i, plane, target: off[i].clone(), slip: cur[i].clone().sub(hit) };   // slip: where on the sphere the finger landed
  controls.enabled = false; flight = null; down = null;
  canvas.classList.add('grabbing');
}
function endGrab() {
  clearTimeout(holdTimer); holdTimer = null;
  if (!grab) return;
  grab = null; controls.enabled = true; canvas.classList.remove('grabbing');
}
canvas.addEventListener('pointerdown', e => {
  down = { x: e.clientX, y: e.clientY, t: performance.now() }; flight = null; document.body.classList.add('used');
  if (grab || !e.isPrimary) { endGrab(); return; }   // a second finger means zoom, not drag
  const i = pick(e.clientX, e.clientY), em = state.emph;
  if (i !== null && (!em || em.nodes.has(i) || em.near.has(i))) holdTimer = setTimeout(() => { holdTimer = null; startGrab(i, e); }, HOLD_MS);
});
canvas.addEventListener('pointerup', e => {
  const held = grab !== null; endGrab();
  if (held || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8 || performance.now() - down.t > 600) return;
  tap(e.clientX, e.clientY);
});
canvas.addEventListener('pointercancel', endGrab);
canvas.addEventListener('pointermove', e => {
  if (grab) {
    if (pointOnPlane(e, grab.plane, tmpB)) grab.target.copy(tmpB).add(grab.slip).sub(rest[grab.i]).clampLength(0, REACH);
    return;
  }
  if (holdTimer && down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { clearTimeout(holdTimer); holdTimer = null; }   // moved at once: this is a turn
  if (e.pointerType !== 'mouse') return;
  state.hovered = pick(e.clientX, e.clientY);
  canvas.classList.toggle('pick', state.hovered !== null);
});
canvas.addEventListener('pointerleave', () => { state.hovered = null; });
for (const type of ['pointerdown', 'pointermove', 'touchmove', 'scroll', 'keydown', 'wheel']) addEventListener(type, () => { lastInput = performance.now(); }, { passive: true, capture: true });

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
    total: num(graph.total), joint: num(graph.joint), week: num(graph.perWeek), share: Math.round(100 * graph.joint / graph.total) };
};

let toastTimer = null;
function toast(text, ms) {
  const el = $('toast');
  clearTimeout(toastTimer);
  if (!text) { if (el.matches(':popover-open')) el.hidePopover(); return; }
  el.textContent = text;
  if (!el.matches(':popover-open')) el.showPopover();
  if (ms) toastTimer = setTimeout(() => toast(null), ms);
}

function showFound() {
  const el = $('foundCount'); el.hidden = !found.size;
  el.textContent = '★ ' + fill(t('eggCount'), { n: found.size, all: inPlay() });
  eggs.forEach((egg, k) => { egg.el.classList.toggle('done', found.has(k)); egg.el.setAttribute('aria-label', `${t('eggLabel')}: ${egg[state.lang].title}`); });
}
function openEgg(k) {
  const egg = eggs[k], before = inPlay(), wasNew = !found.has(k);
  found.add(k); showFound();
  // finishing a stage brings the next one into play; the card says where to look
  const opened = wasNew && inPlay() > before ? eggs.find((o, j) => unlocked(o) && !found.has(j)) : null;
  const more = opened ? `<p class="all">${t(opened.at === 'q' ? (document.body.classList.contains('kiosk') ? 'eggNextHere' : 'eggNextQ') : 'eggNext').replace('{place}', opened.i >= 0 ? esc(nodes[opened.i].id) : '')}</p>` : '';
  $('eggBody').innerHTML = `<p><span class="tag">${egg.at === 'q' ? t('eggLast') : fill(t('eggFound'), { n: found.size, all: before })}</span></p><div class="art">${egg.icon}</div>
    <h2>${egg[state.lang].title}</h2>${egg[state.lang].text.map(p => `<p>${p}</p>`).join('')}${more}`;
  if (wasNew && found.size === eggs.length) partyPending = true;
  if (!$('egg').open) $('egg').showModal();
}
/* Everything found: when the last card closes, the lines light up in Lime, one after the other. */
let partyPending = false, partyUntil = 0;
$('egg').addEventListener('close', () => { if (partyPending) { partyPending = false; if (!still) partyUntil = performance.now() + 4500; } });
const LIME = new THREE.Color(css('--q-lime'));
function sparkle(now) {
  if (now > partyUntil || state.emph) { partyUntil = 0; paint(); return; }
  edges.forEach((e, k) => {
    const wave = 0.5 + 0.5 * Math.sin(now * 0.007 - k * 0.3);
    tmpColor.copy(LINE).lerp(LIME, wave).multiplyScalar(0.25 + 0.75 * wave);
    for (let s = 0; s < SEG; s++) edgeMesh.setColorAt(k * SEG + s, tmpColor);
  });
  edgeMesh.instanceColor.needsUpdate = true;
}

/* Five quick taps on the Q. give away where something is still hidden. */
let logoTaps = [];
document.querySelector('.mark').addEventListener('click', () => {
  const now = performance.now(); logoTaps = [...logoTaps.filter(x => now - x < 3000), now];
  if (logoTaps.length < 5) return;
  logoTaps = [];
  const next = eggs.find((egg, k) => unlocked(egg) && !found.has(k));
  toast(!next ? t('eggAll') : next.at === 'q' ? t('eggHintQ') : fill(t('eggHint'), { place: nodes[next.i].id }), 5000);
});

let opener = null;   // what had focus before a card opened, to hand it back on closing
function select(i) {
  if (i === null && state.selected === null && !state.list) return;
  state.selected = i; state.list = false;
  state.emph = i === null ? null : focusNode(i);
  controls.autoRotate = !still && i === null;
  paint(); renderPanel(true);
  if (i === null) flyHome(); else flyToNode(i);
}

function renderPanel(takeFocus = false) {
  const panel = $('panel'), i = state.selected, wasOpen = !panel.hidden;
  panel.hidden = i === null && !state.list;
  if (!wasOpen && !panel.hidden) opener = document.activeElement;
  if (wasOpen && panel.hidden && opener?.isConnected && panel.contains(document.activeElement)) opener.focus();
  document.body.classList.toggle('busy', !panel.hidden || state.tour !== null);
  if (panel.hidden) return;
  const close = `<button type="button" class="btn close" id="panelClose" aria-label="${t('close')}">×</button>`;
  if (i === null) {
    panel.innerHTML = `<div class="head on-light">${close}<h2>${fill(t('listTitle'), facts())}</h2><p class="also">${fill(t('listNote'), facts())}</p>
      <input type="search" id="listFilter" class="filter" placeholder="${t('search')}" aria-label="${t('search')}" autocomplete="off"></div>
      <div class="body"><p class="note" id="noMatch" hidden>${t('noMatch')}</p><div class="rows">${nodes.map(n => `<button type="button" class="row" data-node="${n.i}">${dot(n.color)}<span>${esc(n.id)}</span><span class="n">${num(n.count)}</span></button>`).join('')}</div></div>`;
  } else {
    const n = nodes[i], name = state.lang === 'de' ? n.name : n.en, sum = n.dom.reduce((a, b) => a + b, 0);
    const pct = Math.round(100 * n.joint / n.count);
    const mix = n.dom.map((v, d) => ({ v, d })).filter(x => x.v).sort((a, b) => b.v - a.v);
    panel.innerHTML = `<div class="head on-light has-badge">${close}<p class="tag">${t('kind')[n.type]}</p><h2>${esc(name)}</h2>
      ${name !== n.id ? `<p class="also">${t('short')} ${esc(n.id)}</p>` : ''}
      ${n.members.length ? `<p class="also">${t('members')} ${esc(n.members.join(', '))}</p>` : ''}
      <p class="badge"><b>${num(n.count)}</b><span>${fill(t('heroUnit'), facts())}</span></p></div>
      <div class="body"><h3>${t('togetherTitle')}</h3>
      <div class="together"><i style="width:${pct}%"></i></div>
      <p class="note">${fill(t('togetherNote'), { n: `<b>${num(n.joint)}</b>`, pct })}${own(n) ? ' ' + fill(t('ringNote'), { n: num(own(n)) }) : ''}</p>
      ${sum ? `<h3>${t('topicsTitle')}</h3>
      <div class="mix">${mix.map(x => `<i style="flex:${x.v};background:${TOPIC_COLORS[x.d]}"></i>`).join('')}</div>
      <ul class="mix-key">${mix.map(x => `<li>${dot(TOPIC_COLORS[x.d])}<span>${t('topics')[x.d]}</span><span class="n">${Math.round(100 * x.v / sum)} %</span></li>`).join('')}</ul>` : ''}
      <h3>${t('partnersTitle')}</h3>
      <div class="rows">${n.links.slice(0, 8).map(l => `<button type="button" class="row" data-node="${l.other}">${dot(nodes[l.other].color)}<span>${esc(nodes[l.other].id)}</span><span class="n">${num(l.n)}</span></button>`).join('')}</div>
      <p class="note">${fill(t('partnersNote'), { n: n.links.length })}</p></div>`;
  }
  panel.scrollTop = 0;
  if (takeFocus) panel.focus({ preventScroll: true });
  const filter = $('listFilter');
  if (filter) filter.oninput = () => {
    const q = filter.value.trim().toLowerCase(); let any = false;
    panel.querySelectorAll('.row[data-node]').forEach(row => { const n = nodes[+row.dataset.node], show = !q || [n.id, n.name, n.en].some(x => x.toLowerCase().includes(q)); row.hidden = !show; any ||= show; });
    const egg = q.length >= 3 ? eggs.findIndex(e => unlocked(e) && e.keys.some(key => key.startsWith(q) || q.includes(key))) : -1;   // a few words open a hidden door
    panel.querySelector('.egg-row')?.remove();
    if (egg >= 0) { const row = document.createElement('button'); row.type = 'button'; row.className = 'row egg-row'; row.textContent = t('eggRow'); row.onclick = () => openEgg(egg); panel.querySelector('.rows').prepend(row); }
    $('noMatch').hidden = any || egg >= 0;
  };
  $('panelClose').onclick = () => select(null);
  panel.querySelectorAll('[data-node]').forEach(b => { b.onclick = () => select(+b.dataset.node); });
}

function showTour(step) {
  state.tour = step;
  const open = step !== null;
  $('tour').hidden = !open; $('dock').hidden = open;
  if (!open) { state.emph = null; controls.autoRotate = !still; paint(); setView('net'); flyHome(); renderPanel(); return; }
  state.selected = null; state.list = false; renderPanel();
  const s = TOUR[step], f = facts();
  $('tourCount').textContent = fill(t('step'), { i: step + 1, n: TOUR.length });
  $('tourTitle').textContent = s[state.lang].title;
  $('tourBody').innerHTML = s[state.lang].body.map(p => `<p>${fill(p, f)}</p>`).join('')
    + (s.show === 'topics' ? `<ul>${TOPIC_COLORS.map((c, d) => `<li>${dot(c)}${t('topics')[d]}</li>`).join('')}</ul>` : '');
  $('tourBack').hidden = step === 0;
  $('tourNext').textContent = step === TOUR.length - 1 ? t('tourDone') : t('next');
  controls.autoRotate = !still;
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
  $('lang').textContent = state.lang === 'de' ? 'English' : 'Deutsch'; $('lang').lang = state.lang === 'de' ? 'en' : 'de';
  $('pause').setAttribute('aria-label', t(still ? 'play' : 'pause')); $('pause').textContent = still ? '▶' : '❙❙'; $('pause').setAttribute('aria-pressed', still);
  $('subtitle').textContent = fill(t('subtitle'), facts());
  $('bandTrack').innerHTML = [0, 1].map(() => t('band').map(item => `<span>${fill(item, facts())}</span>`).join('')).join('');   // twice, for a seamless loop
  $('legendTopics').innerHTML = TOPIC_COLORS.map((c, d) => `<li>${dot(c)}${t('topics')[d]}</li>`).join('');
  showFound();
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
$('listOpen').onclick = () => { if (state.selected !== null) select(null); state.list = !state.list; renderPanel(true); };
$('homeBtn').onclick = () => {   // back to the overview of the current view, whatever the visitor did to the camera
  if (state.tour !== null) { showTour(null); return; }
  if (state.selected !== null || state.list) select(null); else { controls.autoRotate = !still; flyHome(); }
};
function setStill(on) {
  still = on;
  document.body.classList.toggle('still', on);
  controls.autoRotate = !on && state.selected === null;
  if (on) { controls.enableDamping = false; controls.update(); controls.enableDamping = true; }   // drop the rotation still in the damping
  fleckCloud.visible = !on; placed = false;
  $('pause').setAttribute('aria-pressed', on); $('pause').setAttribute('aria-label', t(on ? 'play' : 'pause')); $('pause').textContent = on ? '▶' : '❙❙';
}
$('pause').onclick = () => setStill(!still);
$('aboutOpen').onclick = () => $('about').showModal();
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('about').open && !$('egg').open) { if (state.tour !== null) showTour(null); else if (state.selected !== null || state.list) select(null); } });

/* An exhibit must find its way back to the start when a visitor walks off: first a warning
   with a countdown, then everything returns to the opening state, the language included. */
const WARN_MS = Math.min(15_000, IDLE_MS / 2);
function resetIfIdle(now) {
  const idle = now - lastInput;
  const touched = state.tour !== null || state.selected !== null || state.list || state.view !== 'net' || state.lang !== 'de' || $('about').open || $('egg').open || found.size > 0
    || camera.position.distanceTo(tmpA.set(...HOME.net.pos)) > 150;
  if (!touched || idle < IDLE_MS - WARN_MS) { if (warned) { warned = false; toast(null); } return; }
  if (idle < IDLE_MS) { warned = true; toast(fill(t('idleNote'), { s: Math.ceil((IDLE_MS - idle) / 1000) })); return; }
  lastInput = now; warned = false; toast(null);
  $('about').close(); $('egg').close();
  found.clear(); partyPending = false; showFound();
  document.body.classList.remove('used');
  if (state.lang !== 'de') { state.lang = 'de'; applyTexts(); }
  if (state.tour !== null) showTour(null); else { setView('net'); if (state.selected !== null || state.list) select(null); else flyHome(); }
}
let warned = false;

// ── loop ───────────────────────────────────────────────────────────────────────────────────
function resize() {
  W = innerWidth; H = innerHeight;
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  camera.fov = W < H ? 58 : 42;   // portrait screens need a wider view to hold the whole network
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

let lastFrame = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  if (mixing) {
    const u = Math.min(1, (now - mixing.start) / mixing.ms);
    state.mix = mixing.from + (mixing.to - mixing.from) * ease(u);
    if (u === 1) mixing = null;
  }
  let moving = false;   // physics in steps of at most 1/60 s, so a slow screen does not slow the springs down
  for (let left = Math.min(0.1, (now - lastFrame) / 1000); left > 1e-4; left -= 1 / 60) moving = ripple(Math.min(left, 1 / 60));
  lastFrame = now;
  if (mixing || !still || !placed || moving) { placeNodes(now); moveFlecks(now); placed = true; }
  if (partyUntil) sparkle(now);
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
