// ============================================================
// SmartStadium AI — Hybrid Crowd Data Service
// ============================================================
// Strategy:
//   1. Fetch real baseline data from API-Football (free tier)
//      → stadium capacity, next fixture kickoff time
//   2. Use a deterministic time-based simulation to generate
//      "live" crowd metrics (attendance, gate traffic, density)
//   3. Falls back gracefully to synthetic defaults if the API
//      is unavailable or rate-limited.
// ============================================================

const CrowdDataService = (() => {
  // ── Configuration ──────────────────────────────────────────
  // API-Football (via api-sports.io) free tier: 100 req/day
  // We only call it ONCE at init to fetch the next fixture.
  const API_FOOTBALL_KEY = ''; // User can paste their free key here
  const TEAM_ID = 85; // Closest real team for demo (e.g., PSG=85)

  // ── MetLife Stadium Constants ──────────────────────────────
  const STADIUM_CAPACITY = 82500;
  const GATES = {
    'gate-amex':    { name: 'AMEX Gate',    direction: 'North', shareWeight: 0.25, position: 'top' },
    'gate-hcl':     { name: 'HCLTech Gate', direction: 'East',  shareWeight: 0.20, position: 'top-right' },
    'gate-verizon': { name: 'Verizon Gate', direction: 'East',  shareWeight: 0.20, position: 'bottom-right' },
    'gate-metlife': { name: 'MetLife Gate', direction: 'South', shareWeight: 0.20, position: 'bottom' },
    'gate-moodys':  { name: "Moody's Gate", direction: 'West',  shareWeight: 0.15, position: 'bottom-left' }
  };

  // ── State ──────────────────────────────────────────────────
  let baseline = {
    capacity: STADIUM_CAPACITY,
    kickoffTime: null,   // Will be set by API or synthetic
    matchStatus: 'NS',   // NS = Not Started
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    apiSource: false      // Was the data from a real API?
  };

  let currentCrowdData = null;
  let updateInterval = null;
  let listeners = [];

  // ── Public API ─────────────────────────────────────────────

  /**
   * Initialize the service. Tries to fetch real data from
   * API-Football, falls back to synthetic schedule.
   */
  async function init() {
    if (API_FOOTBALL_KEY) {
      try {
        const data = await fetchFromApiFootball();
        if (data) {
          baseline.capacity = data.capacity || STADIUM_CAPACITY;
          baseline.kickoffTime = data.kickoffTime;
          baseline.matchStatus = data.status;
          baseline.homeTeam = data.homeTeam;
          baseline.awayTeam = data.awayTeam;
          baseline.apiSource = true;
          console.log('[CrowdDataService] ✅ API-Football baseline loaded:', baseline);
        }
      } catch (err) {
        console.warn('[CrowdDataService] ⚠️ API-Football unavailable, using synthetic data:', err.message);
      }
    }

    // If no API data, generate a synthetic "next match" ~2 hours from now
    if (!baseline.kickoffTime) {
      const now = new Date();
      // Set kickoff to be 1.5 hours from now for a compelling demo
      baseline.kickoffTime = now.getTime() + (1.5 * 60 * 60 * 1000);
      baseline.homeTeam = 'USA';
      baseline.awayTeam = 'Mexico';
      baseline.apiSource = false;
      console.log('[CrowdDataService] 🔄 Using synthetic baseline — Kickoff in ~1.5 hours');
    }

    // Generate the first snapshot immediately
    currentCrowdData = generateCrowdSnapshot();
    return currentCrowdData;
  }

  /**
   * Start the live update loop. Calls all registered listeners
   * with fresh crowd data every `intervalMs` milliseconds.
   */
  function startLiveUpdates(intervalMs = 3000) {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(() => {
      currentCrowdData = generateCrowdSnapshot();
      listeners.forEach(fn => fn(currentCrowdData));
    }, intervalMs);
  }

  /**
   * Stop live updates.
   */
  function stopLiveUpdates() {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }

  /**
   * Register a callback that fires on each crowd data update.
   * @param {Function} fn - Receives the crowd snapshot object
   */
  function onUpdate(fn) {
    listeners.push(fn);
  }

  /**
   * Get the current crowd data snapshot (without waiting for next tick).
   */
  function getCurrentData() {
    return currentCrowdData;
  }

  /**
   * Get the baseline match info.
   */
  function getBaseline() {
    return { ...baseline };
  }

  // ── API-Football Integration ───────────────────────────────

  async function fetchFromApiFootball() {
    const url = `https://v3.football.api-sports.io/fixtures?team=${TEAM_ID}&next=1`;
    const response = await fetch(url, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();

    if (!json.response || json.response.length === 0) {
      throw new Error('No upcoming fixtures found');
    }

    const fixture = json.response[0];
    return {
      capacity: fixture.fixture.venue?.capacity || STADIUM_CAPACITY,
      kickoffTime: new Date(fixture.fixture.date).getTime(),
      status: fixture.fixture.status?.short || 'NS',
      homeTeam: fixture.teams?.home?.name || 'Home',
      awayTeam: fixture.teams?.away?.name || 'Away'
    };
  }

  // ── Crowd Simulation Engine ────────────────────────────────
  // This is the core "synthetic live data" generator.
  // It produces deterministic-but-varied numbers based on:
  //   • Time relative to kickoff
  //   • Gate-specific traffic share weights
  //   • Pseudo-random fluctuation seeded by the current second

  function generateCrowdSnapshot() {
    const now = Date.now();
    const timeToKickoff = baseline.kickoffTime - now;
    const hoursToKickoff = timeToKickoff / (1000 * 60 * 60);
    const minutesToKickoff = timeToKickoff / (1000 * 60);

    // ── Phase-based fill curve ────────────────────────────
    let fillPercentage;
    let phase;

    if (hoursToKickoff > 3) {
      // Stadium just opened / very early
      fillPercentage = 0.02 + (0.05 * Math.random());
      phase = 'pre-open';
    } else if (hoursToKickoff > 2) {
      // Early arrivals (3h → 2h before)
      const progress = 1 - (hoursToKickoff - 2); // 0→1
      fillPercentage = 0.05 + (progress * 0.15);
      phase = 'early-arrival';
    } else if (hoursToKickoff > 1) {
      // Steady stream (2h → 1h before)
      const progress = 1 - (hoursToKickoff - 1); // 0→1
      fillPercentage = 0.20 + (progress * 0.35);
      phase = 'steady-flow';
    } else if (hoursToKickoff > 0.25) {
      // Rush hour (1h → 15min before)
      const progress = 1 - ((hoursToKickoff - 0.25) / 0.75); // 0→1
      fillPercentage = 0.55 + (progress * 0.35);
      phase = 'rush-hour';
    } else if (hoursToKickoff > 0) {
      // Final surge (15min → kickoff)
      const progress = 1 - (hoursToKickoff / 0.25); // 0→1
      fillPercentage = 0.90 + (progress * 0.07);
      phase = 'final-surge';
    } else if (hoursToKickoff > -2) {
      // Match in progress (first 2 hours after kickoff)
      fillPercentage = 0.95 + (0.03 * Math.random());
      phase = 'match-live';
    } else {
      // Post-match exit
      const hoursSinceEnd = Math.abs(hoursToKickoff) - 2;
      fillPercentage = Math.max(0.05, 0.95 - (hoursSinceEnd * 0.4));
      phase = 'post-match';
    }

    // Add micro-fluctuation (+/- 1.5%) to simulate "live" jitter
    const jitter = (seededRandom(now) * 0.03) - 0.015;
    fillPercentage = clamp(fillPercentage + jitter, 0, 1);

    const totalAttendance = Math.floor(baseline.capacity * fillPercentage);

    // ── Per-gate traffic ──────────────────────────────────
    const gateData = {};
    let totalTrafficPerMin = 0;

    Object.entries(GATES).forEach(([gateId, gate]) => {
      // Each gate's share fluctuates around its base weight
      const gateJitter = (seededRandom(now + gateId.charCodeAt(5) * 1000) * 0.06) - 0.03;
      const dynamicShare = clamp(gate.shareWeight + gateJitter, 0.05, 0.50);

      // Traffic per minute peaks during rush hour, drops during match
      let baseTrafficPerMin;
      if (phase === 'pre-open') baseTrafficPerMin = 5;
      else if (phase === 'early-arrival') baseTrafficPerMin = 30;
      else if (phase === 'steady-flow') baseTrafficPerMin = 80;
      else if (phase === 'rush-hour') baseTrafficPerMin = 180;
      else if (phase === 'final-surge') baseTrafficPerMin = 250;
      else if (phase === 'match-live') baseTrafficPerMin = 15;
      else baseTrafficPerMin = 120; // post-match exit

      const gateTraffic = Math.floor(baseTrafficPerMin * dynamicShare);
      totalTrafficPerMin += gateTraffic;

      // Wait time in minutes (higher traffic = longer wait)
      const waitTime = phase === 'match-live'
        ? Math.floor(1 + Math.random() * 2)
        : Math.floor(2 + (gateTraffic / 50) * 8 + Math.random() * 3);

      // Congestion level
      const congestion = gateTraffic > 60 ? 'high' : gateTraffic > 25 ? 'medium' : 'low';

      gateData[gateId] = {
        name: gate.name,
        direction: gate.direction,
        trafficPerMin: gateTraffic,
        waitTimeMin: waitTime,
        congestion,
        share: dynamicShare
      };
    });

    // ── Section-level density (for heatmap coloring) ─────
    // Sections near active gates fill faster
    const sectionDensity = {};
    for (let i = 1; i <= 50; i++) {
      const secId = `sec-1${String(i).padStart(2, '0')}`;
      // Base density from global fill
      let density = fillPercentage;
      // Sections near north (AMEX) gate get a boost
      if (i <= 10 || i >= 45) density *= 1.1;
      // Sections near east gates
      if (i >= 10 && i <= 25) density *= 1.05;
      // Add per-section jitter
      density += (seededRandom(now + i * 137) * 0.1) - 0.05;
      sectionDensity[secId] = clamp(density, 0, 1);
    }

    return {
      timestamp: now,
      phase,
      minutesToKickoff: Math.round(minutesToKickoff),
      hoursToKickoff: hoursToKickoff.toFixed(1),

      // Global metrics
      totalAttendance,
      capacity: baseline.capacity,
      fillPercentage: Math.round(fillPercentage * 100),
      totalTrafficPerMin,

      // Per-gate breakdown
      gates: gateData,

      // Section density map
      sectionDensity,

      // Match info
      matchInfo: {
        homeTeam: baseline.homeTeam,
        awayTeam: baseline.awayTeam,
        status: baseline.matchStatus,
        apiSource: baseline.apiSource
      }
    };
  }

  // ── Utilities ──────────────────────────────────────────────

  /** Simple seeded pseudo-random using timestamp */
  function seededRandom(seed) {
    const x = Math.sin(seed * 0.001) * 10000;
    return x - Math.floor(x);
  }

  /** Clamp value between min and max */
  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  // ── Public Interface ───────────────────────────────────────
  return {
    init,
    startLiveUpdates,
    stopLiveUpdates,
    onUpdate,
    getCurrentData,
    getBaseline
  };
})();

// Make it available globally for the inline script in index.html
window.CrowdDataService = CrowdDataService;
