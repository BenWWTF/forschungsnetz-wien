#!/usr/bin/env node
/* Builds data/graph.json and data/wien.json.

   node build/build.mjs            fetch the current Radar dataset, then build
   node build/build.mjs --cached   reuse build/cache/

   The graph rule (who counts as collaborating) is not reimplemented here: the script runs
   radar-collab.js from research.wwtf.at, so the numbers match the Radar's collaboration page. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const CACHE = path.join(HERE, 'cache');
const SOURCE = 'https://research.wwtf.at/';
const FILES = ['research-data.csv', 'radar-collab.js', 'collab-umbrellas.json'];
const SINCE = '2026-04-13';          // first complete week in the dataset, same cut as the Radar page
const KM = 5;                        // scene units per kilometre in the city view
const CENTRE = { lat: 48.2083, lon: 16.3731 };   // Stephansplatz
const CITY_SCALE = 0.6;            // spheres shrink over the map, where they sit closer together
const Q_SITE = { lat: 48.2083572, lon: 16.3776293 };   // Wollzeile 27a, where the exhibition stands (geocoded with Nominatim)
const DOMAINS = ['Physical Sciences', 'Life Sciences', 'Health Sciences', 'Social Sciences'];

fs.mkdirSync(CACHE, { recursive: true });
if (!process.argv.includes('--cached')) {
  for (const f of FILES) {
    const r = await fetch(SOURCE + f);
    if (!r.ok) throw new Error(`${f}: HTTP ${r.status}`);
    fs.writeFileSync(path.join(CACHE, f), Buffer.from(await r.arrayBuffer()));
  }
}
const read = f => fs.readFileSync(path.join(CACHE, f), 'utf8');

const sandbox = { window: {} };
vm.runInNewContext(read('radar-collab.js'), sandbox);
const RC = sandbox.window.RadarCollab;
RC.setUmbrellas(JSON.parse(read('collab-umbrellas.json')));
const papers = RC.parsePapers(read('research-data.csv')).filter(p => p.Date >= SINCE);
const graph = RC.buildGraph(papers, true);

const meta = JSON.parse(fs.readFileSync(path.join(HERE, 'institutions.json'), 'utf8'));
const coords = JSON.parse(fs.readFileSync(path.join(HERE, 'coords.json'), 'utf8'));
const missing = graph.nodes.filter(n => !meta[n.id] || coords[n.id]?.lat == null).map(n => n.id);
if (missing.length) throw new Error('No name or coordinates for: ' + missing.join(', ') + '. Add them to build/institutions.json and rerun build/geocode.py.');

// topic mix per node: every output of the institution, not only the joint ones
const domainsOf = Object.fromEntries(graph.nodes.map(n => [n.id, [0, 0, 0, 0]]));
for (const p of papers) {
  const d = DOMAINS.indexOf(p.Domain);
  if (d < 0) continue;
  for (const g of new Set((p._institutions || []).map(l => RC.groupOf(l, true)))) if (domainsOf[g]) domainsOf[g][d]++;
}

const maxCount = Math.max(...graph.nodes.map(n => n.count));
const nodes = graph.nodes.sort((a, b) => b.count - a.count).map(n => ({
  id: n.id, ...meta[n.id], addr: undefined, count: n.count, joint: n.joint, dom: domainsOf[n.id],
  members: RC.labelsOfGroup(n.id, true, papers).filter(l => l !== n.id).sort(),
  r: Math.max(1.3, 6.5 * Math.cbrt(n.count / maxCount)),   // volume, not radius, grows with the count
}));
const index = Object.fromEntries(nodes.map((n, i) => [n.id, i]));
const edges = graph.edges.map(e => ({ a: index[e.source], b: index[e.target], n: e.count })).sort((x, y) => y.n - x.n);

layoutNetwork(nodes, edges);
layoutCity(nodes);

const dates = papers.map(p => p.Date).sort();
const round = v => Math.round(v * 100) / 100;
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data', 'graph.json'), JSON.stringify({
  from: dates[0], to: dates.at(-1), total: graph.total, joint: graph.jointAll, cityScale: CITY_SCALE,
  nodes: nodes.map(n => ({ ...n, r: round(n.r), net: n.net.map(round), city: n.city.map(round) })),
  edges,
}));
fs.writeFileSync(path.join(ROOT, 'data', 'wien.json'), JSON.stringify(buildMap()));
console.log(`${nodes.length} institutions, ${edges.length} partnerships, ${graph.jointAll} of ${graph.total} outputs joint, ${dates[0]} to ${dates.at(-1)}`);

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
  nodes.forEach((n, i) => { n.city = pos[i]; n.ground = [round2(pos[i][0]), round2(pos[i][2])]; });
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
