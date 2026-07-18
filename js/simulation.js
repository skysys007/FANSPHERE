/**
 * High-Fidelity Stadium Crowd Simulation Engine
 * Event-driven, conservation-based model.
 */

class StadiumSimulation {
  constructor(seed = 12345) {
    this.seed = seed;
    this.entryGates = new Map();
    this.exitGates = new Map();
    this.sections = new Map();
    this.suites = new Map();
    
    this.phase = 'pre_match'; // pre_match, during_match, post_match
    this.isRunning = false;
    this.intervalId = null;
    this.tickCount = 0;
    
    this.tickRate = 5000; // 5 seconds per tick real time
    this.simSpeedMultiplier = 3; // 1 tick (5s) = 15s simulation time (4x slower than before)
    
    // Overall stats
    this.totalEntered = 0;
    this.totalExited = 0;

    // Attach intelligence engine if available globally
    if (typeof window !== 'undefined' && window.CrowdIntelligenceEngine) {
      this.intelligenceEngine = new window.CrowdIntelligenceEngine();
    }
  }

  // --- Entity Management API ---

  addEntryGate(id, name, capacity) {
    this.entryGates.set(id, {
      id,
      name,
      capacity,       // Maximum people processed per minute
      occupancy: 0,   // Rate of people currently flowing through
      queueLength: 0, // Number of people waiting outside
      waitTime: 0,    // Estimated wait time in minutes
      density: 0,     // 0-1 percentage of max queue threshold
      status: 'normal',// 'normal', 'congested', 'critical'
      // Internal tracking
      totalProcessed: 0
    });
  }

  addExitGate(id, name, capacity) {
    this.exitGates.set(id, {
      id,
      name,
      capacity,
      occupancy: 0,
      queueLength: 0,
      waitTime: 0,
      density: 0,
      status: 'normal',
      totalProcessed: 0
    });
  }

  addSection(id, name, capacity) {
    this.sections.set(id, {
      id,
      name,
      capacity,
      occupiedSeats: 0,
      crowdDensity: 0, // Used by index.html (0-100)
      occupancyRate: 0, // 0-1 value
      peopleEnteringPerMin: 0,
      peopleLeavingPerMin: 0,
      movementSpeed: 1.4, // m/s
      flowDirection: 'Static'
    });
  }

  addSuite(id, name, capacity) {
    this.suites.set(id, {
      id,
      name,
      capacity,
      occupiedSeats: 0,
      occupancyRate: 0 // 0-1 value
    });
  }

  // --- Simulation Control API ---

  setPhase(phase) {
    console.log(`[Simulation] Phase changed to: ${phase}`);
    this.phase = phase;
    
    // Trigger event-based anomalies
    if (phase === 'halftime') {
       // Optional: implement halftime logic if needed
    } else if (phase === 'during_match') {
       // Instantly fast-forward section occupancy to 90-95% when entering during match phase
       this.sections.forEach(sec => {
          const targetOccupancy = sec.capacity * (0.90 + Math.random() * 0.05);
          if (sec.occupiedSeats < targetOccupancy) {
             sec.occupiedSeats = targetOccupancy;
             this._updateSectionMetrics(sec);
          }
       });
       // Clear queues
       this.entryGates.forEach(gate => {
          gate.queueLength = 0;
          gate.occupancy = 0;
          gate.density = 0;
          gate.status = 'normal';
       });
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[Simulation] Engine started");
    this.intervalId = setInterval(() => this.tick(), this.tickRate);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    console.log("[Simulation] Engine stopped");
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  // --- Core Physics Engine ---

  tick() {
    this.tickCount++;
    const minElapsed = (this.tickRate / 1000 / 60) * this.simSpeedMultiplier; // Simulation minutes passed

    // 1. Spawning / External Flow Model
    this.processExternalFlow(minElapsed);

    // 2. Internal Flow Distribution (Gates -> Sections)
    this.processInternalFlow(minElapsed);

    // 3. Update Intelligence Engine
    if (this.intelligenceEngine) {
       const intelOutput = this.intelligenceEngine.process(this);
       if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('crowdIntelligenceUpdated', { detail: intelOutput }));
       }
    }
    
    // 4. Update UI event
    if (typeof window !== 'undefined') {
       window.dispatchEvent(new CustomEvent('sim-tick', { detail: this }));
    }
  }

  processExternalFlow(minElapsed) {
    if (this.phase === 'pre_match') {
      // Spawn new arrivals outside entry gates
      this.entryGates.forEach(gate => {
        // High arrival rate (bursty)
        const arrivalRatePerMin = gate.capacity * (0.8 + Math.random() * 0.6); // 80% to 140% of capacity
        const arrivals = Math.floor(arrivalRatePerMin * minElapsed);
        
        gate.queueLength += arrivals;
        
        // Process queue
        let maxCanProcess = Math.floor(gate.capacity * minElapsed);
        // Lifecycle modifiers can temporarily modify gate capacity (e.g. if 'openGate' action was triggered)
        if (gate.capacityModifier) maxCanProcess = Math.floor(maxCanProcess * gate.capacityModifier);

        const processed = Math.min(gate.queueLength, maxCanProcess);
        
        gate.queueLength -= processed;
        gate.occupancy = processed / minElapsed; // flow rate
        gate.totalProcessed += processed;
        this.totalEntered += processed;
        
        gate.waitTime = gate.queueLength / gate.capacity;
        gate.density = Math.min(1.0, gate.queueLength / (gate.capacity * 2)); // 2x cap is 100% density
        gate.status = gate.queueLength > gate.capacity * 0.8 ? 'congested' : 'normal';
      });
    } else if (this.phase === 'post_match') {
      // Process exits
      this.exitGates.forEach(gate => {
        let maxCanProcess = Math.floor(gate.capacity * minElapsed);
        if (gate.capacityModifier) maxCanProcess = Math.floor(maxCanProcess * gate.capacityModifier);

        const processed = Math.min(gate.queueLength, maxCanProcess);
        
        gate.queueLength -= processed;
        gate.occupancy = processed / minElapsed;
        gate.totalProcessed += processed;
        this.totalExited += processed;
        
        gate.waitTime = gate.queueLength / gate.capacity;
        gate.density = Math.min(1.0, gate.queueLength / (gate.capacity * 2));
        gate.status = gate.queueLength > gate.capacity * 0.8 ? 'congested' : 'normal';
      });
      
      // Clear entry gates queues slowly if any left
      this.entryGates.forEach(gate => {
         gate.queueLength = Math.max(0, gate.queueLength - Math.floor(100 * minElapsed));
         gate.density = 0;
         gate.status = 'normal';
      });
    } else {
       // during_match: gate influx should not arise as people are already seated
       this.entryGates.forEach(gate => {
         gate.occupancy = 0.5 + Math.random(); // Extremely minimal trickle
         gate.queueLength = Math.max(0, gate.queueLength - Math.floor(50 * minElapsed));
         gate.density = 0;
         gate.status = 'normal';
       });
    }
  }

  processInternalFlow(minElapsed) {
    if (this.phase === 'pre_match') {
      // People move from entry gates into sections
      // Calculate total new people entering the stadium this tick
      let newlyEntered = 0;
      this.entryGates.forEach(g => { newlyEntered += g.occupancy * minElapsed; });

      // Distribute them among unfilled sections, favoring a few "critical" bottleneck areas
      const unfilledSections = Array.from(this.sections.values()).filter(s => s.occupiedSeats < s.capacity);
      if (unfilledSections.length > 0 && newlyEntered > 0) {
        
        // Pick permanent hotspots if not picked yet
        if (!this.criticalSectionIds) {
           this.criticalSectionIds = new Set(unfilledSections.map(s => s.id).sort(() => 0.5 - Math.random()).slice(0, 6));
        }
        
        const hotspots = unfilledSections.filter(s => this.criticalSectionIds.has(s.id));
        const normals = unfilledSections.filter(s => !this.criticalSectionIds.has(s.id));
        
        // 45% of incoming crowd rushes to the 6 hotspot sections (simulating main concourses)
        let hotspotPeople = hotspots.length > 0 ? newlyEntered * 0.45 : 0;
        let normalPeople = newlyEntered - hotspotPeople;

        const distributeTo = (targets, peopleCount) => {
           if (targets.length === 0 || peopleCount <= 0) return;
           let perTarget = Math.floor(peopleCount / targets.length);
           if (perTarget === 0) perTarget = 1;
           
           targets.forEach(sec => {
              if (peopleCount <= 0) return;
              const space = sec.capacity - sec.occupiedSeats;
              const entering = Math.min(space, perTarget, peopleCount);
              
              sec.peopleEnteringPerMin = entering / minElapsed;
              sec.peopleLeavingPerMin = 0;
              sec.occupiedSeats += entering;
              peopleCount -= entering;
              
              sec.flowDirection = 'Entering';
              sec.movementSpeed = 1.2 + (Math.random() * 0.4);
              this._updateSectionMetrics(sec);
           });
        };

        // Shuffle slightly to vary which gets the remainder
        hotspots.sort(() => 0.5 - Math.random());
        normals.sort(() => 0.5 - Math.random());

        distributeTo(hotspots, hotspotPeople);
        distributeTo(normals, normalPeople);
      }
    } else if (this.phase === 'during_match') {
      // Minor shuffling, but with occasional congestion spikes and rare critical anomalies
      this.sections.forEach(sec => {
        const rand = Math.random();
        const isCriticalEvent = rand < 0.02; // 2% chance for a severe incident (massive crowd surge)
        const isBusy = rand >= 0.02 && rand < 0.10; // 8% chance for standard busy concourse
        
        if (isCriticalEvent) {
           // Massive localized traffic spike simulating an incident or major bathroom/concession rush
           sec.peopleEnteringPerMin = 80 + Math.random() * 60; // 80-140 per min entering
           sec.peopleLeavingPerMin = 5 + Math.random() * 10;   // barely anyone leaving the area
           sec.movementSpeed = 0.05 + (Math.random() * 0.1); // Standstill traffic
           sec.flowDirection = 'Entering';
        } else if (isBusy) {
           sec.peopleEnteringPerMin = 20 + Math.random() * 30; // 20-50 per min
           sec.peopleLeavingPerMin = 20 + Math.random() * 30;
           sec.movementSpeed = 0.2 + (Math.random() * 0.3); // Slow speed due to crowding
           sec.flowDirection = Math.random() > 0.5 ? 'Entering' : 'Exiting';
        } else {
           sec.peopleEnteringPerMin = Math.random() * 5;
           sec.peopleLeavingPerMin = Math.random() * 5;
           sec.movementSpeed = 0.8 + (Math.random() * 0.4); 
           sec.flowDirection = 'Static';
        }
        
        // Allow occupancy to organically drift based on the simulated flows
        sec.occupiedSeats += (sec.peopleEnteringPerMin - sec.peopleLeavingPerMin) * minElapsed;
        sec.occupiedSeats = Math.max(0, Math.min(sec.capacity, sec.occupiedSeats));
        
        this._updateSectionMetrics(sec);
      });
    } else if (this.phase === 'post_match') {
      // People leave sections and go to exit gates
      let totalLeavingThisTick = 0;
      
      this.sections.forEach(sec => {
         // Drain sections aggressively
         const leaveRatePerMin = sec.capacity * (0.1 + Math.random() * 0.2); // 10-30% leave per min
         const leaving = Math.min(sec.occupiedSeats, Math.floor(leaveRatePerMin * minElapsed));
         
         sec.peopleEnteringPerMin = 0;
         sec.peopleLeavingPerMin = leaving / minElapsed;
         sec.occupiedSeats -= leaving;
         
         totalLeavingThisTick += leaving;
         
         sec.flowDirection = 'Exiting';
         sec.movementSpeed = 0.8 + (Math.random() * 0.4); // Slower exit due to crowding
         
         this._updateSectionMetrics(sec);
      });
      
      // Route exiting people to exit gates' queues
      const exits = Array.from(this.exitGates.values());
      if (exits.length > 0 && totalLeavingThisTick > 0) {
         const perGate = Math.floor(totalLeavingThisTick / exits.length);
         exits.forEach(gate => {
            gate.queueLength += perGate;
         });
      }
    }

    // Process suites similarly (simplified)
    this.suites.forEach(suite => {
       if (this.phase === 'pre_match') {
          const fillRate = suite.capacity * 0.05 * minElapsed;
          suite.occupiedSeats = Math.min(suite.capacity, suite.occupiedSeats + fillRate);
       } else if (this.phase === 'post_match') {
          const emptyRate = suite.capacity * 0.1 * minElapsed;
          suite.occupiedSeats = Math.max(0, suite.occupiedSeats - emptyRate);
       }
       suite.occupancyRate = suite.capacity > 0 ? (suite.occupiedSeats / suite.capacity) : 0;
    });
  }

  _updateSectionMetrics(sec) {
     sec.occupancyRate = sec.capacity > 0 ? (sec.occupiedSeats / sec.capacity) : 0;
     sec.crowdDensity = sec.occupancyRate * 100;
  }
  
  // Hook for crowd intelligence to dynamically alter simulation
  applyLifecycleModifiers(activeActions) {
     // Reset modifiers
     this.entryGates.forEach(g => g.capacityModifier = 1.0);
     this.exitGates.forEach(g => g.capacityModifier = 1.0);
     this.sections.forEach(s => s.flowModifier = 1.0);

     if (!activeActions) return;

     activeActions.forEach((action, locationKey) => {
        // locationKey looks like "Section node-112" or "Entry Gate node-1"
        if (action.actionId === 'openGate' && locationKey.includes('Gate')) {
           const idMatch = locationKey.match(/Gate (.+)/);
           if (idMatch) {
              const gateId = idMatch[1];
              // Boost capacity by 40% when resolving/resolved
              if (action.phase === 'resolving' || action.phase === 'resolved') {
                 if (this.entryGates.has(gateId)) this.entryGates.get(gateId).capacityModifier = 1.4;
                 if (this.exitGates.has(gateId)) this.exitGates.get(gateId).capacityModifier = 1.4;
              }
           }
        } else if (action.actionId === 'redirectCrowd' && locationKey.includes('Section')) {
           const idMatch = locationKey.match(/Section (.+)/);
           if (idMatch) {
              const secId = idMatch[1];
              if (action.phase === 'resolving') {
                 if (this.sections.has(secId)) {
                    const sec = this.sections.get(secId);
                    // Dramatically increase people leaving and reduce occupancy to simulate rerouting
                    const leaving = Math.floor(sec.occupiedSeats * 0.15);
                    sec.occupiedSeats -= leaving;
                    sec.peopleLeavingPerMin += leaving * 2;
                    this._updateSectionMetrics(sec);
                 }
              }
           }
        }
     });
  }
}

// Export for module usage or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StadiumSimulation };
} else if (typeof window !== 'undefined') {
  window.StadiumSimulation = StadiumSimulation;
}
