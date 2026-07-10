// ============================================================
// SmartStadium AI — Crowd Simulation Web Worker
// ============================================================
// Runs ALL math off the main thread. The main thread only does
// DOM painting. Communication via postMessage:
//
//   Main → Worker:  { type: 'init', payload: { apiKey, teamId } }
//   Main → Worker:  { type: 'start', payload: { intervalMs } }
//   Main → Worker:  { type: 'stop' }
//
//   Worker → Main:  { type: 'snapshot', payload: { ...crowdData } }
//   Worker → Main:  { type: 'baseline', payload: { ...baseline } }
//   Worker → Main:  { type: 'error', payload: { message } }
// ============================================================

// ── Constants ────────────────────────────────────────────────
const STADIUM_CAPACITY = 82500;
const GATES = {
  'gate-amex':    { name: 'AMEX Gate',    direction: 'North', shareWeight: 0.25 },
  'gate-hcl':     { name: 'HCLTech Gate', direction: 'East',  shareWeight: 0.20 },
  'gate-verizon': { name: 'Verizon Gate', direction: 'East',  shareWeight: 0.20 },
  'gate-metlife': { name: 'MetLife Gate', direction: 'South', shareWeight: 0.20 },
  'gate-moodys':  { name: "Moody's Gate", direction: 'West',  shareWeight: 0.15 }
};

// ── State ────────────────────────────────────────────────────
let baseline = {
  capacity: STADIUM_CAPACITY,
  kickoffTime: null,
  matchStatus: 'NS',
  homeTeam: 'Team A',
  awayTeam: 'Team B',
  apiSource: false
};

let tickInterval = null;

// ── Utilities ────────────────────────────────────────────────
function seededRandom(seed) {
  const x = Math.sin(seed * 0.001) * 10000;
  return x - Math.floor(x);
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

// ── Simulation Engine ────────────────────────────────────────
function generateCrowdSnapshot() {
  const now = Date.now();
  const timeToKickoff = baseline.kickoffTime - now;
  const hoursToKickoff = timeToKickoff / (1000 * 60 * 60);
  const minutesToKickoff = timeToKickoff / (1000 * 60);

  let fillPercentage;
  let phase;

  if (hoursToKickoff > 3) {
    fillPercentage = 0.02 + (0.05 * seededRandom(now));
    phase = 'pre-open';
  } else if (hoursToKickoff > 2) {
    const progress = 1 - (hoursToKickoff - 2);
    fillPercentage = 0.05 + (progress * 0.15);
    phase = 'early-arrival';
  } else if (hoursToKickoff > 1) {
    const progress = 1 - (hoursToKickoff - 1);
    fillPercentage = 0.20 + (progress * 0.35);
    phase = 'steady-flow';
  } else if (hoursToKickoff > 0.25) {
    const progress = 1 - ((hoursToKickoff - 0.25) / 0.75);
    fillPercentage = 0.55 + (progress * 0.35);
    phase = 'rush-hour';
  } else if (hoursToKickoff > 0) {
    const progress = 1 - (hoursToKickoff / 0.25);
    fillPercentage = 0.90 + (progress * 0.07);
    phase = 'final-surge';
  } else if (hoursToKickoff > -2) {
    fillPercentage = 0.95 + (0.03 * seededRandom(now));
    phase = 'match-live';
  } else {
    const hoursSinceEnd = Math.abs(hoursToKickoff) - 2;
    fillPercentage = Math.max(0.05, 0.95 - (hoursSinceEnd * 0.4));
    phase = 'post-match';
  }

  const jitter = (seededRandom(now) * 0.03) - 0.015;
  fillPercentage = clamp(fillPercentage + jitter, 0, 1);
  const totalAttendance = Math.floor(baseline.capacity * fillPercentage);

  // Per-gate traffic
  const gateData = {};
  let totalTrafficPerMin = 0;

  const gateEntries = Object.entries(GATES);
  for (let g = 0; g < gateEntries.length; g++) {
    const [gateId, gate] = gateEntries[g];
    const gateJitter = (seededRandom(now + gateId.charCodeAt(5) * 1000) * 0.06) - 0.03;
    const dynamicShare = clamp(gate.shareWeight + gateJitter, 0.05, 0.50);

    let baseTrafficPerMin;
    if (phase === 'pre-open') baseTrafficPerMin = 5;
    else if (phase === 'early-arrival') baseTrafficPerMin = 30;
    else if (phase === 'steady-flow') baseTrafficPerMin = 80;
    else if (phase === 'rush-hour') baseTrafficPerMin = 180;
    else if (phase === 'final-surge') baseTrafficPerMin = 250;
    else if (phase === 'match-live') baseTrafficPerMin = 15;
    else baseTrafficPerMin = 120;

    const gateTraffic = Math.floor(baseTrafficPerMin * dynamicShare);
    totalTrafficPerMin += gateTraffic;

    const waitTime = phase === 'match-live'
      ? Math.floor(1 + seededRandom(now + g * 77) * 2)
      : Math.floor(2 + (gateTraffic / 50) * 8 + seededRandom(now + g * 99) * 3);

    const congestion = gateTraffic > 60 ? 'high' : gateTraffic > 25 ? 'medium' : 'low';

    gateData[gateId] = {
      name: gate.name,
      direction: gate.direction,
      trafficPerMin: gateTraffic,
      waitTimeMin: waitTime,
      congestion,
      share: dynamicShare
    };
  }

  // Section-level density
  const sectionDensity = {};
  for (let i = 1; i <= 50; i++) {
    const secId = `sec-1${String(i).padStart(2, '0')}`;
    let density = fillPercentage;
    if (i <= 10 || i >= 45) density *= 1.1;
    if (i >= 10 && i <= 25) density *= 1.05;
    density += (seededRandom(now + i * 137) * 0.1) - 0.05;
    sectionDensity[secId] = clamp(density, 0, 1);
  }

  return {
    timestamp: now,
    phase,
    minutesToKickoff: Math.round(minutesToKickoff),
    hoursToKickoff: hoursToKickoff.toFixed(1),
    totalAttendance,
    capacity: baseline.capacity,
    fillPercentage: Math.round(fillPercentage * 100),
    totalTrafficPerMin,
    gates: gateData,
    sectionDensity,
    matchInfo: {
      homeTeam: baseline.homeTeam,
      awayTeam: baseline.awayTeam,
      status: baseline.matchStatus,
      apiSource: baseline.apiSource
    }
  };
}

// ── API-Football fetch (runs inside worker so main thread stays free) ──
async function fetchFromApiFootball(apiKey, teamId) {
  const url = `https://v3.football.api-sports.io/fixtures?team=${teamId}&next=1`;
  const response = await fetch(url, {
    headers: { 'x-apisports-key': apiKey }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  if (!json.response || json.response.length === 0) throw new Error('No upcoming fixtures');

  const fixture = json.response[0];
  return {
    capacity: fixture.fixture.venue?.capacity || STADIUM_CAPACITY,
    kickoffTime: new Date(fixture.fixture.date).getTime(),
    status: fixture.fixture.status?.short || 'NS',
    homeTeam: fixture.teams?.home?.name || 'Home',
    awayTeam: fixture.teams?.away?.name || 'Away'
  };
}

// ── Message Handler ──────────────────────────────────────────
self.onmessage = async function(e) {
  const { type, payload } = e.data;

  switch (type) {

    case 'init': {
      // Try real API first, fallback to synthetic
      if (payload?.apiKey) {
        try {
          const data = await fetchFromApiFootball(payload.apiKey, payload.teamId || 85);
          baseline.capacity = data.capacity || STADIUM_CAPACITY;
          baseline.kickoffTime = data.kickoffTime;
          baseline.matchStatus = data.status;
          baseline.homeTeam = data.homeTeam;
          baseline.awayTeam = data.awayTeam;
          baseline.apiSource = true;
        } catch (err) {
          self.postMessage({ type: 'error', payload: { message: `API fallback: ${err.message}` } });
        }
      }

      // Synthetic fallback
      if (!baseline.kickoffTime) {
        baseline.kickoffTime = Date.now() + (1.5 * 60 * 60 * 1000);
        baseline.homeTeam = 'USA';
        baseline.awayTeam = 'Mexico';
        baseline.apiSource = false;
      }

      // Send baseline info back
      self.postMessage({ type: 'baseline', payload: { ...baseline } });

      // Send first snapshot immediately
      self.postMessage({ type: 'snapshot', payload: generateCrowdSnapshot() });
      break;
    }

    case 'start': {
      const intervalMs = payload?.intervalMs || 3000;
      if (tickInterval) clearInterval(tickInterval);

      tickInterval = setInterval(() => {
        self.postMessage({ type: 'snapshot', payload: generateCrowdSnapshot() });
      }, intervalMs);
      break;
    }

    case 'stop': {
      if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
      }
      break;
    }
  }
};
