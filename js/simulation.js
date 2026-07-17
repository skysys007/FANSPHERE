/**
 * Stadium State Simulation System
 * Provides deterministic, realistic stadium state simulation for AI-powered navigation
 * and crowd management across different match phases.
 */

// --- Deterministic Pseudo-Random Generator ---
class PRNG {
  constructor(seed) {
    this.seed = seed;
  }
  
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  range(min, max) {
    return min + this.next() * (max - min);
  }
  
  normal(mean, stdDev) {
    let u = 0, v = 0;
    while(u === 0) u = this.next(); 
    while(v === 0) v = this.next();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = num / 10.0 + 0.5; 
    if (num > 1 || num < 0) return this.normal(mean, stdDev);
    return mean + stdDev * (num - 0.5) * 2;
  }
}

// --- Data Models ---
class EntryGate {
  constructor(id, name, capacity) {
    this.id = id;
    this.name = name;
    this.status = 'closed'; // 'closed', 'open', 'congested'
    this.occupancy = 0;
    this.capacity = capacity;
    this.queueLength = 0;
    this.waitTime = 0;
    this.density = 0.0;
    this.lastUpdated = Date.now();
  }
}

class ExitGate {
  constructor(id, name, capacity) {
    this.id = id;
    this.name = name;
    this.status = 'closed';
    this.occupancy = 0;
    this.capacity = capacity;
    this.queueLength = 0;
    this.waitTime = 0;
    this.density = 0.0;
    this.lastUpdated = Date.now();
  }
}

class Section {
  constructor(id, name, capacity, recommendedEntry, recommendedExit) {
    this.id = id;
    this.name = name;
    this.capacity = capacity;
    this.occupiedSeats = 0;
    this.occupancyRate = 0.0;
    this.crowdDensity = 0.0;
    this.recommendedEntry = recommendedEntry;
    this.recommendedExit = recommendedExit;
    this.profile = 'Concourse';
    
    // Decoupled properties for diverse simulation
    this.targetOccupancyRate = 0.0;
    this.movementSpeed = 1.4;
    this.peopleEnteringPerMin = 0;
    this.peopleLeavingPerMin = 0;
    this.flowDirection = "Static";
    
    this.lastUpdated = Date.now();
  }
}

class Suite {
  constructor(id, name, capacity, nearestEntry, nearestExit) {
    this.id = id;
    this.name = name;
    this.capacity = capacity;
    this.occupied = 0;
    this.occupancyRate = 0.0;
    this.status = 'inactive'; // 'inactive', 'arriving', 'active', 'leaving'
    this.nearestEntry = nearestEntry;
    this.nearestExit = nearestExit;
    this.lastUpdated = Date.now();
  }
}

// --- Navigation Constraints Context ---
const NavigationConfig = {
  dynamicRouting: true,
  routeCostFactors: [
    "distance",
    "crowdDensity",
    "queueLength",
    "waitTime",
    "gateStatus"
  ],
  rerouteOnStateChange: true
};

// --- Simulation Engine ---
class StadiumSimulation {
  constructor(seed = 12345) {
    this.prng = new PRNG(seed);
    this.phase = 'pre_match'; // 'pre_match', 'during_match', 'post_match'
    this.enabled = true;
    this.updateIntervalSeconds = 5;
    this.timer = null;
    this._phaseTickCount = 0; // persistent per-phase tick counter
    
    // Store entities
    this.entryGates = new Map();
    this.exitGates = new Map();
    this.sections = new Map();
    this.suites = new Map();
    
    // Config properties as requested
    this.simulationConfig = {
      enabled: true,
      updateIntervalSeconds: 5,
      deterministic: true,
      realisticVariation: true
    };
    
    this.navigationConfig = NavigationConfig;
    
    this.tickCount = 0;
    
    // Action Overrides
    this.gateModifiers = new Map();
    this.sectionModifiers = new Map();
    this.gateBias = new Map();
    this.sectionBias = new Map();
    
    // Crowd Intelligence Engine
    if (typeof CrowdIntelligenceEngine !== 'undefined') {
      this.intelligenceEngine = new CrowdIntelligenceEngine();
    }
  }
  
  // Initialization helpers
  addEntryGate(id, name, capacity) {
    this.entryGates.set(id, new EntryGate(id, name, capacity));
  }
  
  addExitGate(id, name, capacity) {
    this.exitGates.set(id, new ExitGate(id, name, capacity));
  }
  
  addSection(id, name, capacity, recEntry = null, recExit = null) {
    const section = new Section(id, name, capacity, recEntry, recExit);
    
    // Map procedural sections to non-seating operational hotspots
    // Concourses (main corridors on each level)
    const concourseIds = ['sec-101','sec-113','sec-126','sec-138','sec-150',
                          'sec-201','sec-213','sec-226','sec-238','sec-250',
                          'sec-301','sec-313','sec-326','sec-338','sec-350'];
    // Food Courts
    const foodCourtIds = ['sec-107','sec-115','sec-132','sec-144',
                          'sec-207','sec-215','sec-232',
                          'sec-315','sec-332'];
    // Stairwells & Escalators
    const stairwellIds = ['sec-104','sec-117','sec-129','sec-142',
                          'sec-204','sec-217','sec-229','sec-242',
                          'sec-304','sec-317','sec-329','sec-342'];
    // Restrooms
    const restroomIds = ['sec-110','sec-122','sec-135','sec-147',
                         'sec-210','sec-222','sec-235',
                         'sec-310','sec-335'];
    // Transit Hubs
    const transitIds = ['sec-140','sec-240','sec-340'];
    
    if (concourseIds.includes(id)) {
       section.profile = 'Concourse';
       const num = id.replace('sec-', '');
       section.name = `Concourse ${num}`;
    } else if (foodCourtIds.includes(id)) {
       section.profile = 'FoodCourt';
       section.name = `Food Court ${id.replace('sec-', '')}`;
    } else if (stairwellIds.includes(id)) {
       section.profile = 'Concourse';
       section.name = `Stairwell ${id.replace('sec-', '')}`;
    } else if (restroomIds.includes(id)) {
       section.profile = 'Concourse';
       section.name = `Restroom Area ${id.replace('sec-', '')}`;
    } else if (transitIds.includes(id)) {
       section.profile = 'TransitHub';
       section.name = `Transit Hub ${id.replace('sec-', '')}`;
    } else if (id.startsWith('sec-')) {
       section.profile = 'Seating';
    } else if (id.includes('food') || name.toLowerCase().includes('food')) {
       section.profile = 'FoodCourt';
    } else if (id.includes('metro') || id.includes('transit')) {
       section.profile = 'TransitHub';
    } else {
       section.profile = 'Concourse';
    }
    
    // Initialize targets — stadium starts EMPTY, fills during pre_match
    // Store the eventual full-capacity target for use during simulation
    if (section.profile === 'Seating') {
       section._fullTarget = this.prng.range(0.75, 1.0);
       section.movementSpeed = this.prng.range(0.0, 0.3).toFixed(2);
    } else if (section.profile === 'FoodCourt') {
       section._fullTarget = this.prng.range(0.3, 0.9);
       section.movementSpeed = this.prng.range(0.2, 1.0).toFixed(2);
    } else if (section.profile === 'TransitHub') {
       section._fullTarget = this.prng.range(0.2, 0.8);
       section.movementSpeed = this.prng.range(0.2, 1.2).toFixed(2);
    } else {
       section._fullTarget = this.prng.range(0.2, 0.7);
       section.movementSpeed = this.prng.range(0.2, 1.5).toFixed(2);
    }
    
    // Start near-empty — fans arrive during pre_match phase
    section.targetOccupancyRate = this.prng.range(0.02, 0.08);
    section.occupancyRate = section.targetOccupancyRate;
    section.occupiedSeats = Math.floor(capacity * section.occupancyRate);
    
    this.sections.set(id, section);
  }
  
  addSuite(id, name, capacity, nearEntry = null, nearExit = null) {
    this.suites.set(id, new Suite(id, name, capacity, nearEntry, nearExit));
  }

  setPhase(phase) {
    if (['pre_match', 'during_match', 'post_match'].includes(phase)) {
      this.phase = phase;
      this._phaseTickCount = 0; // reset per-phase counter on phase change
      this.updateState(); // force immediate update on phase change
    }
  }

  start() {
    if (!this.enabled || this.timer) return;
    this.timer = setInterval(() => this.updateState(), this.updateIntervalSeconds * 1000);
    this.updateState(); // run once immediately
  }
  
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  // Core logic to process realistic simulation based on phases
  updateState() {
    const now = Date.now();
    this.tickCount++;
    
    // Initialize Critical Incident Manager
    if (!this.criticalManager) {
       this.criticalManager = {
          activeCriticals: new Set(),
          cooldowns: new Map(),   // Cooldowns prevent re-targeting a recently resolved zone
          expiryTimers: new Map(), // Natural expiry for unresolved incidents
          maxCriticals: 10
       };
    }
    
    // Clear expired cooldowns (zones that were resolved and finished their cooldown period)
    for (const [id, expiryTime] of this.criticalManager.cooldowns.entries()) {
       if (now > expiryTime) {
          this.criticalManager.cooldowns.delete(id);
       }
    }
    
    // Auto-expire unresolved incidents that have been active too long (natural resolution)
    for (const [id, expiryTime] of this.criticalManager.expiryTimers.entries()) {
       if (now > expiryTime) {
          this.criticalManager.activeCriticals.delete(id);
          this.criticalManager.expiryTimers.delete(id);
          this.criticalManager.cooldowns.set(id, now + 60000); // 1 min cooldown before it can be re-targeted
       }
    }
    
    // Base curves for each phase
    let entryGateActivity = 0; // 0 to 1
    let sectionTargetFill = 0; // 0 to 1
    let suiteTargetFill = 0;
    let exitGateActivity = 0;
    
    this._phaseTickCount++;
    
    switch(this.phase) {
      case 'pre_match': {
        // Fans arriving over ~120 ticks (~10 min at 5s intervals)
        // Stadium goes from ~5% to ~95% capacity
        const arrivalProgress = Math.min(this._phaseTickCount / 120, 1.0);
        // Entry gates ramp up then taper as stadium fills
        const arrivalCurve = Math.sin(arrivalProgress * Math.PI); // bell curve: peaks mid-arrival
        entryGateActivity = 0.3 + (0.7 * arrivalCurve);
        // Sections gradually fill towards their full targets
        sectionTargetFill = 0.05 + (0.90 * arrivalProgress);
        suiteTargetFill = 0.05 + (0.85 * arrivalProgress);
        // Small trickle of exits (people leaving to move cars, forgot something, etc.)
        exitGateActivity = 0.02 + (0.04 * arrivalProgress);
        break;
      }
        
      case 'during_match':
        // Stadium is mostly full but there IS movement:
        // People go to restrooms, concessions, move around concourses
        entryGateActivity = 0.08 + this.prng.range(-0.03, 0.05); // Small trickle of latecomers
        sectionTargetFill = 0.92 + this.prng.range(-0.04, 0.06);  // High but with natural fluctuation
        suiteTargetFill = 0.90 + this.prng.range(-0.05, 0.08);
        exitGateActivity = 0.04 + this.prng.range(-0.02, 0.03); // Minor early leavers
        break;
        
      case 'post_match': {
        // Fans leaving over ~80 ticks (~7 min at 5s intervals)
        // Massive initial rush then tapers
        const leaveProgress = Math.min(this._phaseTickCount / 80, 1.0);
        // Entry: almost nobody, maybe a few people picking up others
        entryGateActivity = 0.02 * (1 - leaveProgress);
        // Sections drain: fast initial drop then slower tail
        const drainCurve = 1 - Math.pow(1 - leaveProgress, 0.6); // fast start, slow tail
        sectionTargetFill = 0.95 - (0.88 * drainCurve);
        suiteTargetFill = 0.95 - (0.92 * drainCurve);
        // Exit gates: massive rush that gradually tapers
        exitGateActivity = 0.4 + (0.6 * (1 - leaveProgress) * Math.sin(Math.min(leaveProgress * 3, 1) * Math.PI / 2));
        break;
      }
    }

    // =============================================
    // REALISTIC GATE CROWD FLOW MODEL
    // =============================================
    // Initialize gate spike tracker (temporary surges at 1-2 gates)
    if (!this._gateSpikeTracker) {
       this._gateSpikeTracker = { entrySpike: null, exitSpike: null, spikeExpiry: 0 };
    }
    
    // Expire old spikes and randomly create new ones
    if (now > this._gateSpikeTracker.spikeExpiry) {
       this._gateSpikeTracker.entrySpike = null;
       this._gateSpikeTracker.exitSpike = null;
       // 25% chance to create a new spike each time one expires
       if (this.prng.range(0,1) < 0.25) {
          const entryArr = [...this.entryGates.keys()];
          const exitArr = [...this.exitGates.keys()];
          if (entryArr.length > 0) this._gateSpikeTracker.entrySpike = entryArr[Math.floor(this.prng.range(0, entryArr.length))];
          if (exitArr.length > 0) this._gateSpikeTracker.exitSpike = exitArr[Math.floor(this.prng.range(0, exitArr.length))];
          this._gateSpikeTracker.spikeExpiry = now + this.prng.range(15000, 45000); // Spike lasts 15-45 seconds
       } else {
          this._gateSpikeTracker.spikeExpiry = now + this.prng.range(10000, 25000); // Check again in 10-25s
       }
    }
    
    // Assign gate personalities (main, secondary, vip) on first run
    if (!this._gatePersonalities) {
       this._gatePersonalities = new Map();
       let idx = 0;
       for (const gate of this.entryGates.values()) {
          // First gate is main, last is VIP, rest are secondary
          const personality = idx === 0 ? 'main' : (idx === this.entryGates.size - 1 ? 'vip' : 'secondary');
          this._gatePersonalities.set(gate.id, personality);
          idx++;
       }
       idx = 0;
       for (const gate of this.exitGates.values()) {
          const personality = idx === 0 ? 'main' : (idx === this.exitGates.size - 1 ? 'vip' : 'secondary');
          this._gatePersonalities.set(gate.id, personality);
          idx++;
       }
    }
    
    // Helper: get phase-based queue range for a gate
    // 85,000 capacity stadium — queue ranges reflect realistic crowd volumes
    // Pre-match: heavy inbound traffic across all gates, scaled by gate personality
    // Post-match: heavy outbound traffic with surge patterns
    const getEntryRange = (personality) => {
       switch(this.phase) {
          case 'pre_match': {
            // Scale with entryGateActivity (ramps up then tapers)
            const scale = entryGateActivity;
            return personality === 'main' 
              ? [Math.floor(120 * scale), Math.floor(350 * scale)] 
              : (personality === 'vip' 
                ? [Math.floor(15 * scale), Math.floor(60 * scale)] 
                : [Math.floor(50 * scale), Math.floor(180 * scale)]);
          }
          case 'during_match': return personality === 'main' ? [2, 8] : (personality === 'vip' ? [0, 3] : [1, 5]);
          case 'post_match': return [0, 3]; // Almost nobody entering post-match
          default: return [0, 10];
       }
    };
    const getExitRange = (personality) => {
       switch(this.phase) {
          case 'pre_match': {
            // Small but nonzero — people leaving to move cars, forgot tickets, etc.
            const scale = exitGateActivity;
            return personality === 'main'
              ? [Math.floor(5 * scale), Math.floor(25 * scale)]
              : (personality === 'vip'
                ? [Math.floor(1 * scale), Math.floor(8 * scale)]
                : [Math.floor(3 * scale), Math.floor(15 * scale)]);
          }
          case 'during_match': return personality === 'main' ? [3, 8] : (personality === 'vip' ? [0, 3] : [1, 5]);
          case 'post_match': {
            // Massive outflow scaled with exitGateActivity
            const scale = exitGateActivity;
            return personality === 'main' 
              ? [Math.floor(150 * scale), Math.floor(400 * scale)] 
              : (personality === 'vip' 
                ? [Math.floor(20 * scale), Math.floor(80 * scale)] 
                : [Math.floor(80 * scale), Math.floor(250 * scale)]);
          }
          default: return [0, 10];
       }
    };
    
    // Process Entry Gates
    for (const gate of this.entryGates.values()) {
      const personality = this._gatePersonalities.get(gate.id) || 'secondary';
      const [rangeMin, rangeMax] = getEntryRange(personality);
      
      // Independent target with ±15% jitter
      let targetQueue = this.prng.range(rangeMin, rangeMax);
      
      // Apply temporary spike if this gate is the spiked one
      if (this._gateSpikeTracker.entrySpike === gate.id && this.phase === 'during_match') {
         targetQueue = this.prng.range(8, 18); // Temporary spike (late arrivals, re-entry)
      }
      
      // Smooth interpolation (gradual change, not instant)
      const prevQueue = gate.queueLength || 0;
      gate.queueLength = Math.max(0, Math.round(prevQueue * 0.7 + targetQueue * 0.3));
      
      // Add micro-jitter so no two refreshes are identical
      gate.queueLength = Math.max(0, gate.queueLength + Math.floor(this.prng.range(-2, 3)));
      
      gate.density = Math.min(1, gate.queueLength / gate.capacity);
      gate.status = gate.queueLength > 80 ? 'congested' : (gate.queueLength > 2 ? 'open' : 'closed');
      
      // Apply Action Overrides
      if (this.gateModifiers.has(gate.id)) {
        const mod = this.gateModifiers.get(gate.id);
        if (mod.statusOverride) gate.status = mod.statusOverride;
        if (mod.queueMultiplier !== undefined) gate.queueLength = Math.floor(gate.queueLength * mod.queueMultiplier);
      }
      
      gate.waitTime = Math.floor(gate.queueLength * 0.15);
      gate.occupancy = gate.queueLength;
      gate.lastUpdated = now;
    }
    
    // Process Exit Gates
    for (const gate of this.exitGates.values()) {
      const personality = this._gatePersonalities.get(gate.id) || 'secondary';
      const [rangeMin, rangeMax] = getExitRange(personality);
      
      // Independent target with ±15% jitter
      let targetQueue = this.prng.range(rangeMin, rangeMax);
      
      // Apply temporary spike if this gate is the spiked one
      if (this._gateSpikeTracker.exitSpike === gate.id && this.phase === 'during_match') {
         targetQueue = this.prng.range(8, 15); // Temporary spike (restroom break wave, early leavers)
      }
      
      // Smooth interpolation
      const prevQueue = gate.queueLength || 0;
      gate.queueLength = Math.max(0, Math.round(prevQueue * 0.7 + targetQueue * 0.3));
      
      // Add micro-jitter
      gate.queueLength = Math.max(0, gate.queueLength + Math.floor(this.prng.range(-2, 3)));
      
      gate.density = Math.min(1, gate.queueLength / gate.capacity);
      gate.status = gate.queueLength > 80 ? 'congested' : (gate.queueLength > 2 ? 'open' : 'closed');
      
      if (this.gateModifiers.has(gate.id)) {
        const mod = this.gateModifiers.get(gate.id);
        if (mod.statusOverride) gate.status = mod.statusOverride;
        if (mod.queueMultiplier !== undefined) gate.queueLength = Math.floor(gate.queueLength * mod.queueMultiplier);
      }
      
      gate.waitTime = Math.floor(gate.queueLength * 0.1); 
      gate.occupancy = gate.queueLength;
      gate.lastUpdated = now;
    }
    
    // Critical Incident Manager: Determine if we should spike a zone
    let availableNonSeating = [];
    for (const section of this.sections.values()) {
       if (section.profile !== 'Seating' && 
           !this.criticalManager.activeCriticals.has(section.id) && 
           !this.criticalManager.cooldowns.has(section.id)) {
          
          // Any non-seating zone can dynamically spawn a congestion hotspot at any time in real-life scenarios.
          // Removed phase-based restrictions to allow full organic randomness across pre, during, and post match.

          availableNonSeating.push(section.id);
       }
    }
    
    // Maintain massive widespread chaos across up to 10 areas simultaneously
    const currentCriticals = this.criticalManager.activeCriticals.size;
    if (currentCriticals < this.criticalManager.maxCriticals && availableNonSeating.length > 0) {
       // High spawn probability that only tapers off as the stadium approaches max criticals
       const spawnChance = 0.8 * (1.0 - (currentCriticals / this.criticalManager.maxCriticals));
       if (this.prng.range(0, 1) < spawnChance) {
          const randomIdx = Math.floor(this.prng.range(0, availableNonSeating.length));
          const targetId = availableNonSeating[randomIdx];
          this.criticalManager.activeCriticals.add(targetId);
          // Natural expiry: incidents persist for 15 to 30 minutes if no operator action is taken
          this.criticalManager.expiryTimers.set(targetId, now + this.prng.range(900000, 1800000));
       }
    }
    
    // Process Sections
    for (const section of this.sections.values()) {
      // 1. Calculate random micro-variations (jitter) — wider ranges for more organic feel
      const occJitter = this.prng.range(-0.04, 0.04);
      const speedJitter = this.prng.range(-0.08, 0.08);
      
      // 2. Determine base targets based on profile AND phase
      // Use the section's full target (set at init) scaled by the phase's sectionTargetFill
      const fullTarget = section._fullTarget || 0.5;
      let targetOcc = fullTarget * sectionTargetFill;
      let targetSpeed = parseFloat(section.movementSpeed);
      
      // Slowly drift the base targets to create natural evolution
      section.targetOccupancyRate = Math.max(0, Math.min(1, targetOcc + this.prng.range(-0.02, 0.02)));
      
      if (section.profile === 'Seating') {
         targetOcc = Math.max(0.0, Math.min(0.98, targetOcc));
         targetSpeed = Math.max(0.02, Math.min(0.25, 0.12 + speedJitter * 0.3));
      } else if (section.profile === 'FoodCourt') {
         targetOcc = Math.max(0.0, Math.min(0.88, targetOcc));
         targetSpeed = Math.max(0.15, Math.min(0.9, 0.5 + speedJitter));
      } else if (section.profile === 'TransitHub') {
         targetOcc = Math.max(0.0, Math.min(0.75, targetOcc));
         targetSpeed = Math.max(0.2, Math.min(1.1, 0.65 + speedJitter));
      } else {
         // Concourse / General
         targetOcc = Math.max(0.0, Math.min(0.72, targetOcc));
         targetSpeed = Math.max(0.2, Math.min(1.3, 0.7 + speedJitter));
      }
      
      // 3. Apply Critical Incident Overrides
      let isCritical = this.criticalManager.activeCriticals.has(section.id);
      
      // Check if action modifier resolves it
      if (this.sectionModifiers.has(section.id)) {
         const mod = this.sectionModifiers.get(section.id);
         if (mod.targetOffset < 0 && isCritical) {
            // Action is being taken to resolve this critical zone
            this.criticalManager.activeCriticals.delete(section.id);
            this.criticalManager.expiryTimers.delete(section.id); // Clear the auto-expire timer
            this.criticalManager.cooldowns.set(section.id, now + 90000); // 90s cooldown before re-targeting
            isCritical = false;
            targetOcc = Math.max(0, targetOcc + mod.targetOffset);
            targetSpeed = Math.min(1.5, targetSpeed + 0.5); // speed up
         }
      }
      
      if (isCritical) {
         // Force Critical properties
         targetOcc = Math.max(0.85, Math.min(1.0, targetOcc + 0.3));
         targetSpeed = this.prng.range(0.05, 0.2); // Extremely slow
      }
      
      // 4. Smooth interpolation towards target rate (simulating gradual movement)
      const previousOccupancyRate = section.occupancyRate;
      section.occupancyRate = section.occupancyRate * 0.9 + (targetOcc + occJitter) * 0.1;
      section.occupancyRate = Math.max(0, Math.min(1, section.occupancyRate));
      section.occupiedSeats = Math.floor(section.capacity * section.occupancyRate);
      
      const delta = section.occupancyRate - previousOccupancyRate;
      const peopleDelta = Math.floor(delta * section.capacity);
      
      // 5. Calculate independent Inflow and Outflow — always some movement
      let baseFlow = Math.floor(this.prng.range(8, 35));
      if (section.profile === 'Seating') baseFlow = Math.floor(this.prng.range(2, 15));
      if (section.profile === 'FoodCourt') baseFlow = Math.floor(this.prng.range(15, 50));
      if (section.profile === 'Concourse') baseFlow = Math.floor(this.prng.range(10, 40));
      
      if (peopleDelta > 0) {
         section.peopleEnteringPerMin = baseFlow + (peopleDelta * 12);
         section.peopleLeavingPerMin = baseFlow;
         section.flowDirection = "Inbound";
      } else if (peopleDelta < 0) {
         section.peopleEnteringPerMin = baseFlow;
         section.peopleLeavingPerMin = baseFlow + (Math.abs(peopleDelta) * 12);
         section.flowDirection = "Outbound";
      } else {
         section.peopleEnteringPerMin = baseFlow;
         section.peopleLeavingPerMin = baseFlow;
         section.flowDirection = "Static";
      }
      
      // 6. Finalize Speed and Density
      section.movementSpeed = targetSpeed.toFixed(2);
      
      // Crowd density correlates with occupancy rate, but is artificially high if critical
      section.crowdDensity = isCritical ? 0.95 : Math.max(0, Math.min(1, section.occupancyRate + Math.abs(delta) * 2));
      
      section.lastUpdated = now;
    }
    
    // Process Suites
    for (const suite of this.suites.values()) {
      const noise = this.prng.range(-0.08, 0.08);
      const targetRate = Math.max(0, Math.min(1, suiteTargetFill + noise));
      
      suite.occupancyRate = suite.occupancyRate * 0.85 + targetRate * 0.15;
      suite.occupied = Math.floor(suite.capacity * suite.occupancyRate);
      
      if (this.phase === 'pre_match' && suite.occupancyRate > 0.1) suite.status = 'arriving';
      else if (this.phase === 'during_match') suite.status = 'active';
      else if (this.phase === 'post_match') suite.status = 'leaving';
      else suite.status = 'inactive';
      
      suite.lastUpdated = now;
    }
    
    // Generate Crowd Intelligence
    if (this.intelligenceEngine) {
      const intelligenceOutput = this.intelligenceEngine.process(this);
      
      // Dispatch event to front-end UI
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('crowdIntelligenceUpdated', { 
          detail: intelligenceOutput 
        });
        window.dispatchEvent(event);
      }
    }
  }

  // Exposed method for "Take Action" Engine Lifecycle
  applyLifecycleModifiers(activeActions) {
    this.gateModifiers.clear();
    this.sectionModifiers.clear();
    
    for (const [locationId, action] of activeActions.entries()) {
      if (action.phase === 'cooldown') continue; // Stop applying artificial fixes
      
      const isGate = locationId.includes('Gate');
      const rawId = locationId.replace('Section ', '').replace('Entry Gate ', '').replace('Exit Gate ', '').replace('Gate ', '');
      
      // Calculate dynamic modifier strength based on progress (0-100)
      const strength = Math.min(1, action.progress / 100);
      
      if (isGate) {
         if (action.actionId === 'openGate') {
            // Gradually reduce queue multiplier down to 0.4
            this.gateModifiers.set(rawId, { statusOverride: 'open', queueMultiplier: 1.0 - (0.6 * strength) });
         } else if (action.actionId === 'closeGate') {
            this.gateModifiers.set(rawId, { statusOverride: 'closed', queueMultiplier: 1.0 - (0.9 * strength) });
         }
      } else {
         if (action.actionId === 'redirectCrowd' || action.actionId === 'rerouteTraffic') {
            // Gradually push target flow offset to -0.35
            this.sectionModifiers.set(rawId, { targetOffset: -0.35 * strength });
         }
      }
    }
  }
}

// Export for module usage (if environment supports it) or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    EntryGate, ExitGate, Section, Suite, 
    StadiumSimulation, NavigationConfig 
  };
} else if (typeof window !== 'undefined') {
  window.StadiumSimulation = StadiumSimulation;
  window.StadiumEntities = { EntryGate, ExitGate, Section, Suite };
  window.NavigationConfig = NavigationConfig;
}
