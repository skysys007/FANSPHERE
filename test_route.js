const fs = require('fs');

const numSections = 50;
const angleStep = (2 * Math.PI) / numSections;
const centerX = 600,
  centerY = 500;

function getStadiumRadius(angle, rx, ry) {
  const absCos = Math.max(Math.abs(Math.cos(angle)), 0.0001);
  const absSin = Math.max(Math.abs(Math.sin(angle)), 0.0001);
  const n = 2.8;
  return Math.pow(Math.pow(absCos / rx, n) + Math.pow(absSin / ry, n), -1 / n);
}

const stadiumGraph = { nodes: {}, edges: [] };
const levels = [
  { name: '100', inRx: 220, inRy: 155, outRx: 280, outRy: 205, fill: 'rgba(2, 6, 23, 0.8)' },
  {
    name: 'Suite 3',
    type: 'suite',
    inRx: 282,
    inRy: 207,
    outRx: 310,
    outRy: 225,
    fill: 'rgba(56, 189, 248, 0.15)',
  },
  { name: '200', inRx: 312, inRy: 227, outRx: 380, outRy: 280, fill: 'rgba(2, 6, 23, 0.8)' },
  {
    name: 'Suite 5',
    type: 'suite',
    inRx: 382,
    inRy: 282,
    outRx: 410,
    outRy: 300,
    fill: 'rgba(56, 189, 248, 0.15)',
  },
  {
    name: 'Suite 6',
    type: 'suite',
    inRx: 412,
    inRy: 302,
    outRx: 440,
    outRy: 320,
    fill: 'rgba(56, 189, 248, 0.15)',
  },
  { name: '300', inRx: 442, inRy: 322, outRx: 520, outRy: 380, fill: 'rgba(2, 6, 23, 0.8)' },
];

for (let l = 0; l < levels.length; l++) {
  const lvl = levels[l];
  const midRx = lvl.inRx + (lvl.outRx - lvl.inRx) / 2;
  const midRy = lvl.inRy + (lvl.outRy - lvl.inRy) / 2;

  for (let i = 0; i < numSections; i++) {
    const angle = i * angleStep - Math.PI / 2;
    let normAngle = angle;
    while (normAngle < 0) normAngle += 2 * Math.PI;
    const isSideline = (normAngle > 0.5 && normAngle < 2.6) || (normAngle > 3.6 && normAngle < 5.7);
    if (lvl.type === 'suite' && !isSideline) continue;

    const sectionId =
      lvl.type === 'suite'
        ? `${lvl.name.replace('Suite ', 'S')}-${String(i + 1).padStart(2, '0')}`
        : `${lvl.name.charAt(0)}${String(i + 1).padStart(2, '0')}`;

    const secId = `sec-${sectionId}`;
    const concourseRx = lvl.outRx + 1;
    const concourseRy = lvl.outRy + 1;
    const concourseR = getStadiumRadius(angle, concourseRx, concourseRy);
    const concourseX = centerX + Math.cos(angle) * concourseR;
    const concourseY = centerY + Math.sin(angle) * concourseR;

    stadiumGraph.nodes[secId] = {
      id: secId,
      angle: angle,
      concourseX,
      concourseY,
      level: lvl.name,
      index: i,
    };
  }
}

function connectEdges(idA, idB) {
  const nA = stadiumGraph.nodes[idA];
  const nB = stadiumGraph.nodes[idB];
  if (nA && nB) {
    const dx = nA.concourseX - nB.concourseX;
    const dy = nA.concourseY - nB.concourseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    stadiumGraph.edges.push({ a: idA, b: idB, dist: dist });
    stadiumGraph.edges.push({ a: idB, b: idA, dist: dist });
  }
}

for (let i = 0; i < numSections; i++) {
  const nextI = (i + 1) % numSections;
  const getSecId = (lvlName, idx) =>
    `sec-${lvlName.includes('Suite') ? lvlName.replace('Suite ', 'S') + '-' + String(idx + 1).padStart(2, '0') : lvlName.charAt(0) + String(idx + 1).padStart(2, '0')}`;

  levels.forEach((lvl, levelIdx) => {
    connectEdges(getSecId(lvl.name, i), getSecId(lvl.name, nextI));
  });

  connectEdges(getSecId('100', i), getSecId('200', i));
  connectEdges(getSecId('200', i), getSecId('300', i));
  connectEdges(getSecId('100', i), getSecId('Suite 3', i));
  connectEdges(getSecId('Suite 3', i), getSecId('200', i));
  connectEdges(getSecId('200', i), getSecId('Suite 5', i));
  connectEdges(getSecId('Suite 5', i), getSecId('Suite 6', i));
  connectEdges(getSecId('Suite 6', i), getSecId('300', i));
}

function calculateRoute(startId, endId) {
  const adj = {};
  stadiumGraph.edges.forEach((e) => {
    if (!adj[e.a]) adj[e.a] = [];
    adj[e.a].push({ node: e.b, weight: e.dist });
  });

  const dist = {};
  const prev = {};
  const q = new Set(Object.keys(stadiumGraph.nodes));

  q.forEach((n) => (dist[n] = Infinity));
  dist[startId] = 0;

  while (q.size > 0) {
    let u = null;
    for (const n of q) {
      if (!u || dist[n] < dist[u]) u = n;
    }
    if (dist[u] === Infinity || u === endId) break;
    q.delete(u);

    if (adj[u]) {
      adj[u].forEach((neighbor) => {
        if (q.has(neighbor.node)) {
          const alt = dist[u] + neighbor.weight;
          if (alt < dist[neighbor.node]) {
            dist[neighbor.node] = alt;
            prev[neighbor.node] = u;
          }
        }
      });
    }
  }

  const path = [];
  let curr = endId;
  if (prev[curr] || curr === startId) {
    while (curr) {
      path.unshift(curr);
      curr = prev[curr];
    }
  }
  return path;
}

console.log('Path 301 to 144:', calculateRoute('sec-301', 'sec-144').join(' -> '));
