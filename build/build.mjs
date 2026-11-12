#!/usr/bin/env node
/* Builds data/graph.json and data/wien.json.

   node build/build.mjs            fetch the current numbers from the Radar's API, then build
   node build/build.mjs --cached   reuse build/cache/

   Who collaborates with whom is not worked out here: the numbers come from
   research.wwtf.at/api/v1/collaboration.json, which the Radar writes with the same code as its
   collaboration page. This script adds names, addresses and the two layouts. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const CACHE = path.join(HERE, 'cache', 'collaboration.json');
const API = 'https://research.wwtf.at/api/v1/collaboration.json';
const KM = 5;                        // scene units per kilometre in the city view
const CENTRE = { lat: 48.2083, lon: 16.3731 };   // Stephansplatz
const CITY_SCALE = 0.6;            // spheres shrink over the map, where they sit closer together
const Q_SITE = { lat: 48.2083572, lon: 16.3776293 };   // Wollzeile 27a, where the exhibition stands (geocoded with Nominatim)
const DOMAINS = ['Physical Sciences', 'Life Sciences', 'Health Sciences', 'Social Sciences'];

if (!process.argv.includes('--cached')) {
  const r = await fetch(API);
  if (!r.ok) throw new Error(`${API}: HTTP ${r.status}`);
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, Buffer.from(await r.arrayBuffer()));
}
const api = JSON.parse(fs.readFileSync(CACHE, 'utf8'));

const meta = JSON.parse(fs.readFileSync(path.join(HERE, 'institutions.json'), 'utf8'));
const coords = JSON.parse(fs.readFileSync(path.join(HERE, 'coords.json'), 'utf8'));
const missing = api.institutions.filter(n => !meta[n.id] || coords[n.id]?.lat == null).map(n => n.id);
if (missing.length) throw new Error('No name or coordinates for: ' + missing.join(', ') + '. Add them to build/institutions.json and rerun build/geocode.py.');

const maxCount = Math.max(...api.institutions.map(n => n.outputs));
const nodes = api.institutions.map(n => ({   // the API lists them largest first
  id: n.id, ...meta[n.id], addr: undefined, count: n.outputs, joint: n.joint, dom: DOMAINS.map(d => n.domains[d]),
  members: n.members,
  r: Math.max(1.3, 6.5 * Math.cbrt(n.outputs / maxCount)),   // volume, not radius, grows with the count
}));
const index = Object.fromEntries(nodes.map((n, i) => [n.id, i]));
const edges = api.pairs.map(p => ({ a: index[p.a], b: index[p.b], n: p.joint }));

layoutNetwork(nodes, edges);
layoutCity(nodes);

const round = v => Math.round(v * 100) / 100;
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data', 'graph.json'), JSON.stringify({
  from: api.from, to: api.to, total: api.outputs, joint: api.joint, perWeek: api.outputs_per_week, cityScale: CITY_SCALE,
  nodes: nodes.map(n => ({ ...n, r: round(n.r), net: n.net.map(round), city: n.city.map(round) })),
  edges,
}));
// The map layers are not committed (see fetch-map.sh); without them the committed wien.json stays.
if (fs.existsSync(path.join(HERE, 'bezirke.geojson'))) fs.writeFileSync(path.join(ROOT, 'data', 'wien.json'), JSON.stringify(buildMap()));
console.log(`${nodes.length} institutions, ${edges.length} partnerships, ${api.joint} of ${api.outputs} outputs joint, ${api.from} to ${api.to}`);

/* Force layout in three dimensions. Deterministic: it starts on a Fibonacci sphere, so the
   exhibit shows the same shape every day until the data changes. */
function layoutNetwork(nodes, edges) {
  const N = nodes.length, pos = [], vel = nodes.map(() => [0, 0, 0]);
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N, rad = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
    pos.push([Math.cos(th) * rad * 50, y * 50, Math.sin(th) * rad * 50]);
  }
  const k = 26, STEPS = 600;
  for (let s = 0; s < STEPS; s++) {
    const alpha = 1 - s / STEPS;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const d = sub(pos[j], pos[i]), len = Math.hypot(...d) || 0.01;
      const f = Math.min((k * k) / (len * len), k) * alpha;
      for (let c = 0; c < 3; c++) { vel[i][c] -= d[c] / len * f; vel[j][c] += d[c] / len * f; }
    }
    for (const e of edges) {
      const d = sub(pos[e.b], pos[e.a]), len = Math.hypot(...d) || 0.01;
      const f = (len - k * 0.9) / len * 0.05 * alpha * Math.min(3, Math.log2(e.n + 1));
      for (let c = 0; c < 3; c++) { vel[e.a][c] += d[c] * f; vel[e.b][c] -= d[c] * f; }
    }
    for (let i = 0; i < N; i++) for (let c = 0; c < 3; c++) {
      vel[i][c] -= pos[i][c] * 0.004 * alpha * (0.4 + nodes[i].count / maxCount);
      pos[i][c] += vel[i][c] * 0.5; vel[i][c] *= 0.6;
    }
  }
  /* The force layout alone gives a ball with the big institutions packed in its core and the
     small ones sticking out on single lines. So it only decides who sits near whom; every node
     is then moved onto the surface of one sphere and spread out there. The lines become chords
     through the inside, none is hidden in a core, and every sphere can be reached from outside. */
  const R = 64, onShell = p => { const l = Math.hypot(...p) || 1; for (let c = 0; c < 3; c++) p[c] *= R / l; };
  pos.forEach(onShell);
  for (let s = 0; s < 500; s++) {
    const alpha = 1 - s / 500, move = nodes.map(() => [0, 0, 0]);
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const d = sub(pos[j], pos[i]), len = Math.hypot(...d) || 0.01;
      const f = 60 * (nodes[i].r + nodes[j].r + 6) / (len * len);   // big spheres claim more room
      for (let c = 0; c < 3; c++) { move[i][c] -= d[c] / len * f; move[j][c] += d[c] / len * f; }
    }
    for (const e of edges) {   // partners stay in the same region of the sphere
      const d = sub(pos[e.b], pos[e.a]), f = 0.004 * Math.log2(e.n + 1);
      for (let c = 0; c < 3; c++) { move[e.a][c] += d[c] * f; move[e.b][c] -= d[c] * f; }
    }
    pos.forEach((p, i) => { for (let c = 0; c < 3; c++) p[c] += move[i][c] * alpha; onShell(p); });
  }
  /* Where a place sits on the sphere carries no meaning, only who is near whom. So the whole
     network may be turned as one piece: here so that the Academy of Sciences faces the visitor
     in the start view (the camera looks from [0, 51, 262] relative to its target). */
  const front = [0, 51, 262], fl = Math.hypot(...front), b = front.map(v => v / fl);
  const a = pos[nodes.findIndex(n => n.id === 'OeAW')].map(v => v / R);
  const axis = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const sin = Math.hypot(...axis), cos = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  if (sin > 1e-6) {
    const k = axis.map(v => v / sin);
    pos.forEach(p => {   // Rodrigues' rotation
      const kxp = [k[1] * p[2] - k[2] * p[1], k[2] * p[0] - k[0] * p[2], k[0] * p[1] - k[1] * p[0]];
      const kp = (k[0] * p[0] + k[1] * p[1] + k[2] * p[2]) * (1 - cos);
      for (let c = 0; c < 3; c++) p[c] = p[c] * cos + kxp[c] * sin + k[c] * kp;
    });
  }
  nodes.forEach((n, i) => { n.net = pos[i]; });
}

/* City view: every institution floats above its address. Height grows with size, which
   pulls the crowded first district apart; spheres are drawn at CITY_SCALE of their radius. */
function layoutCity(nodes) {
  const pos = nodes.map(n => {
    const [x, z] = project(coords[n.id].lat, coords[n.id].lon);
    return [x, n.r * CITY_SCALE + 1 + 13 * Math.sqrt(n.count / maxCount), z];
  });
  separate(pos, nodes.map(n => n.r * CITY_SCALE), 0.8, [1]);   // push apart vertically only
  // The Academy of Sciences stood half behind TU Wien, its bigger neighbour to the south.
  unhide(pos, nodes.map(n => n.r * CITY_SCALE), 0.3, nodes.findIndex(n => n.id === 'OeAW'));
  nodes.forEach((n, i) => { n.city = pos[i]; n.ground = [round2(pos[i][0]), round2(pos[i][2])]; });
}

/* Lifts one sphere until, seen from the start view of the map (camera at [0, 100, 142] from its
   target), it neither hides behind another sphere nor covers one. Height is the free dimension
   in the city view; the address on the ground stays where it is. */
function unhide(pos, radii, gap, i) {
  const view = [0, 100, 142], vl = Math.hypot(...view), v = view.map(c => c / vl);
  const up = [-v[1] * v[0], 1 - v[1] * v[1], -v[1] * v[2]], up2 = 1 - v[1] * v[1];   // "up" as the camera sees it
  for (let pass = 0, moved = true; moved && pass < 100; pass++) {
    moved = false;
    for (let j = 0; j < pos.length; j++) {
      if (j === i) continue;
      const min = radii[i] + radii[j] + gap, d = sub(pos[i], pos[j]), along = d[0] * v[0] + d[1] * v[1] + d[2] * v[2];
      const flat = d.map((c, k) => c - along * v[k]), len2 = flat[0] ** 2 + flat[1] ** 2 + flat[2] ** 2;
      if (len2 >= min * min) continue;
      const dot = flat[0] * up[0] + flat[1] * up[1] + flat[2] * up[2];
      pos[i][1] += (-dot + Math.sqrt(dot * dot + up2 * (min * min - len2))) / up2 + 0.01;
      moved = true;
    }
  }
}

function separate(pos, radii, gap, axes) {
  for (let pass = 0; pass < 200; pass++) {
    let moved = false;
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
      const d = sub(pos[j], pos[i]), len = Math.hypot(...d) || 0.01, min = radii[i] + radii[j] + gap;
      if (len >= min) continue;
      moved = true;
      if (axes.length === 3) {
        for (let c = 0; c < 3; c++) { const push = d[c] / len * (min - len) / 2; pos[i][c] -= push; pos[j][c] += push; }
      } else {   // lift the higher one until the pair clears
        const hi = pos[j][1] >= pos[i][1] ? j : i, lo = hi === j ? i : j;
        const flat = Math.hypot(pos[hi][0] - pos[lo][0], pos[hi][2] - pos[lo][2]);
        pos[hi][1] = pos[lo][1] + Math.sqrt(Math.max(0, min * min - flat * flat)) + 0.01;
      }
    }
    if (!moved) break;
  }
}

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function round2(v) { return Math.round(v * 100) / 100; }
function project(lat, lon) {   // east = +x, south = +z, scene units
  return [(lon - CENTRE.lon) * 111.32 * Math.cos(CENTRE.lat * Math.PI / 180) * KM, -(lat - CENTRE.lat) * 111.32 * KM];
}

/* Districts and the main waters from data.wien.gv.at (WFS, CC BY 4.0), simplified. */
function buildMap() {
  const geo = name => JSON.parse(fs.readFileSync(path.join(HERE, name + '.geojson'), 'utf8')).features;
  const line = (ring, tol) => simplify(ring.map(([lon, lat]) => project(lat, lon)), tol).map(p => p.map(round2));
  const districts = geo('bezirke').map(f => {
    const ring = line(f.geometry.coordinates[0], 0.15);
    return { nr: f.properties.BEZNR, name: f.properties.NAMEK, ring, at: centroid(ring) };
  }).sort((a, b) => a.nr - b.nr);
  const WIDTH = { 'Donau': 0.3, 'Neue Donau': 0.18, 'Donaukanal': 0.06, 'Wienfluss': 0.035 };   // km
  const parts = (g, single) => g.type === single ? [g.coordinates] : g.coordinates;   // Multi* → list of parts
  const rivers = geo('FLIESSGEWOGD').filter(f => WIDTH[f.properties.NAME])
    .flatMap(f => parts(f.geometry, 'LineString').map(l => ({ w: WIDTH[f.properties.NAME] * KM, line: line(l, 0.08) })));
  const lakes = geo('STEHENDEGEWOGD').filter(f => f.properties.NAME === 'Alte Donau')
    .flatMap(f => parts(f.geometry, 'Polygon').map(poly => line(poly[0], 0.08)));
  return { districts, rivers, lakes, q: project(Q_SITE.lat, Q_SITE.lon).map(round2) };
}

function centroid(ring) {
  let a = 0, cx = 0, cz = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, z1] = ring[i], [x2, z2] = ring[(i + 1) % ring.length], w = x1 * z2 - x2 * z1;
    a += w; cx += (x1 + x2) * w; cz += (z1 + z2) * w;
  }
  return [round2(cx / (3 * a)), round2(cz / (3 * a))];
}

function simplify(pts, tol) {   // Douglas-Peucker
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length), last = pts.length - 1; keep[0] = keep[last] = 1;
  let stack = [[0, last]];
  if (pts[0][0] === pts[last][0] && pts[0][1] === pts[last][1]) {   // closed ring: split at the point farthest from the start
    let far = 0, at = 0;
    pts.forEach((q, i) => { const d = Math.hypot(q[0] - pts[0][0], q[1] - pts[0][1]); if (d > far) { far = d; at = i; } });
    keep[at] = 1; stack = [[0, at], [at, last]];
  }
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, az] = pts[a], [bx, bz] = pts[b], dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz) || 1e-9;
    let worst = 0, at = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * dz - (pts[i][1] - az) * dx) / len;
      if (d > worst) { worst = d; at = i; }
    }
    if (worst > tol) { keep[at] = 1; stack.push([a, at], [at, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
