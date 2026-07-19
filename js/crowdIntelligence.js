/**
 * Crowd Intelligence Engine
 * Analyzes stadium and section occupancy, calculates density, predicts trends,
 * and generates alerts and recommendations based on crowd data.
 */

class CrowdIntelligenceEngine {
  constructor() {
    this.history = {
      sections: {}, // id -> array of occupancy rates { time, rate }
      stadium: []   // array of overall occupancy rates { time, rate }
    };
    this.maxHistoryLength = 12; // 1 minute of 5s ticks
    this.actionLog = [];
    this.activeActions = new Map(); // tracking lifecycle
    this.zoneStateHistory = new Map(); // tracking hysteresis
  }

  process(simulationState) {
    const timestamp = new Date().toISOString();
    
    // Update Lifecycles
    this._updateLifecycles(simulationState);
    
    // Map input data
    const inputData = this._mapSimulationStateToInput(simulationState, timestamp);

    // Run Engine Analysis
    const output = this._generateIntelligence(inputData);
    
    return output;
  }

  _updateLifecycles(simContext) {
    const now = Date.now();
    for (const [locationId, action] of this.activeActions.entries()) {
      const elapsedMs = now - action.startTime;
      
      if (elapsedMs < 5000) {
        action.phase = 'taking_action';
        action.progress = Math.floor((elapsedMs / 20000) * 100);
      } else if (elapsedMs < 20000) {
        action.phase = 'resolving';
        action.progress = Math.floor((elapsedMs / 20000) * 100);
      } else if (elapsedMs < 25000) {
        action.phase = 'resolved';
        action.progress = 100;
        if (!action.logged) {
          const actionNames = {
            'redirectCrowd': 'Redirect Crowd',
            'openGate': 'Open Additional Gate',
            'closeGate': 'Temporarily Close Gate',
            'rerouteTraffic': 'Reroute Traffic'
          };
          this.actionLog.push({
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second:'2-digit' }),
            action: actionNames[action.actionId] || action.actionId,
            location: locationId,
            status: 'Resolved'
          });
          action.logged = true;
        }
      } else if (elapsedMs < 120000) {
        action.phase = 'cooldown';
      } else {
        this.activeActions.delete(locationId);
      }
    }
    
    // Push lifecycle states to simulation for interpolation
    if (simContext && typeof simContext.applyLifecycleModifiers === 'function') {
       simContext.applyLifecycleModifiers(this.activeActions);
    }
  }

  _mapSimulationStateToInput(sim, timestamp) {
    // Stadium total
    let totalCapacity = 0;
    let totalOccupied = 0;
    let entryFlow = 0;
    let exitFlow = 0;

    const sections = [];
    sim.sections.forEach(section => {
      totalCapacity += section.capacity;
      totalOccupied += section.occupiedSeats;
      
      sections.push({
        id: section.id,
        name: section.name,
        capacity: section.capacity,
        occupied: section.occupiedSeats,
        available: section.capacity - section.occupiedSeats,
        occupancyPercentage: section.capacity > 0 ? (section.occupiedSeats / section.capacity) * 100 : 0,
        entryRate: section.peopleEnteringPerMin || 0,
        exitRate: section.peopleLeavingPerMin || 0,
        movementSpeed: section.movementSpeed || "1.4",
        flowDirection: section.flowDirection || "Static",
        queueLength: 0 // Sections usually don't have queues in this sim scale
      });
    });

    const gates = [];
    sim.entryGates.forEach(gate => {
      entryFlow += gate.occupancy;
      gates.push({
        id: gate.id,
        type: "Entry",
        capacityPerMinute: gate.capacity,
        currentFlow: gate.occupancy,
        queueLength: gate.queueLength,
        estimatedWaitTime: gate.waitTime
      });
    });
    
    const exits = [];
    sim.exitGates.forEach(gate => {
      exitFlow += gate.occupancy;
      exits.push({
        id: gate.id,
        queueLength: gate.queueLength,
        currentFlow: gate.occupancy
      });
      gates.push({
        id: gate.id,
        type: "Exit",
        capacityPerMinute: gate.capacity,
        currentFlow: gate.occupancy,
        queueLength: gate.queueLength,
        estimatedWaitTime: gate.waitTime
      });
    });

    return {
      timestamp,
      phase: sim.phase,
      stadium: {
        id: "metlife-stadium",
        name: "FANSPHERE Stadium",
        capacity: totalCapacity,
        occupied: totalOccupied,
        available: totalCapacity - totalOccupied,
        occupancyPercentage: totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0,
        entryRate: entryFlow,
        exitRate: exitFlow,
        totalMovementRate: entryFlow + exitFlow
      },
      sections,
      gates,
      corridors: [], // Not supported natively in sim, omitting
      stairs: [],    // Not supported natively in sim, omitting
      exits
    };
  }

  _generateIntelligence(input) {
    const output = {
      stadiumSummary: {},
      sections: [],
      alerts: [],
      recommendedRoutes: [],
      actionLog: this.actionLog.slice(-5) // Send 5 most recent
    };
    
    const resolvingAlerts = [];
    const newAlerts = [];

    const now = Date.now();

    // Overall Stadium Processing
    const overallDensity = this._classifyDensity(input.stadium.occupancyPercentage);
    
    // Save history for predictions
    this.history.stadium.push({ time: now, val: input.stadium.occupancyPercentage });
    if (this.history.stadium.length > this.maxHistoryLength) this.history.stadium.shift();
    
    let avgStadiumScore = 0;

    // Sections Processing
    input.sections.forEach(sec => {
      if (!this.history.sections[sec.id]) this.history.sections[sec.id] = [];
      const history = this.history.sections[sec.id];
      history.push({ time: now, val: sec.occupancyPercentage });
      if (history.length > this.maxHistoryLength) history.shift();

      // Decouple Occupancy and Congestion
      const occupancyPercentage = sec.occupancyPercentage;
      
      // Congestion is based on movement restriction
      const speedRaw = parseFloat(sec.movementSpeed);
      let isSeating = sec.id.startsWith('sec-');
      
      // Dynamic bottleneck override: If traffic is at a standstill with high occupancy, treat it as a congested concourse
      if (speedRaw < 0.2 && occupancyPercentage > 60) {
         isSeating = false;
      }
      
      // PROBABILITY DISTRIBUTION FOR CONGESTION (Gaussian / Box-Muller)
      // Generates high variance and high peak amplitudes organically
      const gaussian = (mean, stdev) => {
          const u = 1 - Math.random();
          const v = Math.random();
          return mean + stdev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      };
      
      let meanCongestion = 0;
      let variance = 0;
      
      if (occupancyPercentage < 60) {
          meanCongestion = 12;
          variance = 15; // High base variance
      } else if (occupancyPercentage < 82) {
          meanCongestion = 45;
          variance = 30; // Massive variance (huge swings mimicking organic flow)
      } else {
          meanCongestion = 88;
          variance = 25; // High peak amplitude
      }
      
      // Shift distribution mean based on bottlenecks
      const netFlow = sec.entryRate - sec.exitRate;
      meanCongestion += (netFlow / 10) * 6; 
      
      // Global chaos modifiers: apply aggressive distribution shifts to any active non-seating zone, regardless of phase
      if (!isSeating) {
         meanCongestion += 25; 
         variance += 15; // Chaotic variance applies in pre, during, and post match equally
      }
      
      if (isSeating) {
         meanCongestion *= 0.3;
         variance *= 0.5;
      } else {
         meanCongestion *= 1.2;
         variance *= 1.3;
      }
      
      let finalCongestion = gaussian(meanCongestion, variance);
      
      // Organic ceiling
      if (finalCongestion > 95) {
         finalCongestion = 90 + Math.random() * 5.8; 
      }
      
      const rawTarget = Math.max(0, finalCongestion);
      
      // Hysteresis Tracking & Temporal Smoothing
      let stateTracker = this.zoneStateHistory.get(sec.id) || { critical: 0, congested: 0, busy: 0, lastScore: rawTarget };
      
      // Smooth out the probability curve so congestion "stays" and breathes instead of flickering
      const congestionScore = (stateTracker.lastScore * 0.85) + (rawTarget * 0.15);
      stateTracker.lastScore = congestionScore;
      
      avgStadiumScore += congestionScore;

      // Strict conditions for Critical: lowered to 65% per operator requirements
      if (congestionScore > 65) stateTracker.critical++; else stateTracker.critical = 0;
      if (congestionScore > 50) stateTracker.congested++; else stateTracker.congested = 0;
      if (congestionScore > 35) stateTracker.busy++; else stateTracker.busy = 0;
      
      this.zoneStateHistory.set(sec.id, stateTracker);
      
      // Determine Status with Hysteresis
      let status = "Comfortable";
      
      // Instant critical if severely over threshold
      if (congestionScore > 65) {
         status = "Critical";
      } else if (stateTracker.critical >= 3) {
         status = "Critical";
      } else if (stateTracker.congested >= 3) {
         status = isSeating ? "Full" : "Congested";
      } else if (stateTracker.busy >= 2) {
         status = "Busy";
      } else if (occupancyPercentage > 95) {
         status = "Full"; 
      } else if (occupancyPercentage > 88) {
         status = "Busy";
      }
      
      const riskLevel = status === "Critical" ? "Critical" : status === "Congested" ? "High" : status === "Full" ? "Medium" : status === "Busy" ? "Medium" : "Low";
      


      // Linear Regression Prediction (simplified)
      const pred5 = this._predict(history, 5 * 60 * 1000);
      const pred10 = this._predict(history, 10 * 60 * 1000);

      let recommendedAction = "No action required.";
      let actionId = null;
      let aiExplanation = "Normal crowd flow.";
      let actionImpact = null;

      const locationKey = `Section ${sec.id}`;
      const activeAction = this.activeActions.get(locationKey);

      // Collect raw incidents if Critical
      if (status === "Critical") {
        if (activeAction && activeAction.phase !== 'cooldown') {
          let msg = "Monitoring crowd movement...";
          if (activeAction.phase === 'taking_action') msg = "Deploying staff and redirecting spectators...";
          if (activeAction.phase === 'resolving') msg = "Opening alternate routes. Crowd conditions improving...";
          if (activeAction.phase === 'resolved') msg = "Issue resolved successfully.";
          
          resolvingAlerts.push({
            severity: "Resolving",
            location: locationKey,
            message: msg,
            lifecyclePhase: activeAction.phase,
            progress: activeAction.progress
          });
        } else {
          // Push to raw sections list for clustering
          if (!this._rawIncidents) this._rawIncidents = [];
          this._rawIncidents.push({
             type: 'section',
             id: sec.id,
             score: congestionScore,
             speedRaw: speedRaw,
             locationKey: locationKey,
             actionId: "redirectCrowd"
          });
        }
      } else if (activeAction && activeAction.phase !== 'cooldown') {
         // Keep displaying resolving UI even if metrics dropped below critical
         let msg = "Monitoring crowd movement...";
         if (activeAction.phase === 'taking_action') msg = "Deploying staff and redirecting spectators...";
         if (activeAction.phase === 'resolving') msg = "Opening alternate routes. Crowd conditions improving...";
         if (activeAction.phase === 'resolved') msg = "Issue resolved successfully.";
         
         resolvingAlerts.push({
           severity: "Resolving",
           location: locationKey,
           message: msg,
           lifecyclePhase: activeAction.phase,
           progress: activeAction.progress
         });
      }

      output.sections.push({
        id: sec.id,
        displayName: sec.name || sec.id,
        occupancyPercentage,
        congestionPercentage: congestionScore,
        crowdStatus: status,
        enteringPerMin: sec.entryRate,
        leavingPerMin: sec.exitRate,
        movementSpeed: sec.movementSpeed,
        movementDirection: sec.flowDirection,
        riskLevel
      });
    });

    avgStadiumScore = input.sections.length > 0 ? avgStadiumScore / input.sections.length : 0;
    
    // Gate Analysis for Alerts
    input.gates.forEach(gate => {
      const locationKey = `${gate.type} Gate ${gate.id}`;
      const activeAction = this.activeActions.get(locationKey);
      
      if (activeAction && activeAction.phase !== 'cooldown') {
        let msg = "Monitoring crowd movement...";
        if (activeAction.phase === 'taking_action') msg = "Deploying staff to manage queue...";
        if (activeAction.phase === 'resolving') msg = "Queue is reducing. Directing attendees...";
        if (activeAction.phase === 'resolved') msg = "Gate queue issue resolved.";
        
        resolvingAlerts.push({
          severity: "Resolving",
          location: locationKey,
          message: msg,
          lifecyclePhase: activeAction.phase,
          progress: activeAction.progress
        });
      } else if (gate.queueLength > 60) {
        const formattedWait = (() => {
          if (gate.estimatedWaitTime === null || gate.estimatedWaitTime === undefined || isNaN(gate.estimatedWaitTime)) return '—';
          const totalSeconds = Math.round(gate.estimatedWaitTime * 60);
          const min = Math.floor(totalSeconds / 60);
          const sec = totalSeconds % 60;
          return min > 0 ? `${min} min ${sec} sec` : `${sec} sec`;
        })();
        const formattedQueue = isNaN(gate.queueLength) ? '—' : `${Math.round(gate.queueLength)} people`;
        
        newAlerts.push({
          severity: "Critical",
          score: gate.queueLength * 3,
          location: locationKey,
          message: `Queue length critical (${formattedQueue}). Wait time: ~${formattedWait}.`,
          recommendedAction: "Open additional gate or route visitors to another gate.",
          actionId: "openGate",
          aiExplanation: `Queue at ${gate.type} Gate ${gate.id} is unsafely long. Opening an additional gate is expected to reduce wait times by 40%.`,
          actionImpact: { queueReduction: "40%", travelTimeReduction: "5 min" }
        });
      }
    });

    // Merge clustered incidents
    if (this._rawIncidents && this._rawIncidents.length > 0) {
       const mergedIncidents = new Map();
       this._rawIncidents.forEach(inc => {
          // Identify general zone area by stripping non-digits
          const level = Math.floor(parseInt(inc.id.replace(/\D/g, ''))/100) * 100;
          const clusterKey = isNaN(level) ? "Concourse Area" : `Level ${level} Area`;
          
          if (!mergedIncidents.has(clusterKey)) {
             mergedIncidents.set(clusterKey, {
                count: 1,
                ids: [inc.id],
                maxScore: inc.score,
                minSpeed: inc.speedRaw,
                location: clusterKey,
                actionTarget: `Section ${inc.id}` // target the first one found
             });
          } else {
             const existing = mergedIncidents.get(clusterKey);
             existing.count++;
             existing.ids.push(inc.id);
             existing.maxScore = Math.max(existing.maxScore, inc.score);
             existing.minSpeed = Math.min(existing.minSpeed, inc.speedRaw);
          }
       });
       
       mergedIncidents.forEach((data, key) => {
          const formatSpeed = (val) => isNaN(val) ? '—' : `${parseFloat(val).toFixed(2)} m/s`;
          let explanation = `Crowd congestion developing in ${key}. Movement speed dropped to ${formatSpeed(data.minSpeed)}.`;
          if (data.count > 1) {
             explanation = `Widespread congestion across ${data.count} sections in ${key}. Movement speed dropped to ${formatSpeed(data.minSpeed)}.`;
          }
          
          newAlerts.push({
            severity: "Critical",
            score: data.maxScore + (data.count * 10), // Boost score if multi-section
            location: key,
            message: `Critical congestion detected in ${key}.`,
            recommendedAction: "Redirect spectators to alternate levels.",
            actionId: "redirectCrowd",
            actionTarget: data.ids.map(id => `Section ${id}`).join(','), // target all clustered sections
            aiExplanation: explanation,
            actionImpact: { congestionReduction: "35%", flowImprovement: "1.0 m/s" }
          });
       });
       
       this._rawIncidents = []; // Reset
    }

    // Limit active incidents to top 6
    newAlerts.sort((a, b) => b.score - a.score);
    output.alerts = [...resolvingAlerts, ...newAlerts].slice(0, 6);

    output.stadiumSummary = {
      occupancyPercentage: input.stadium.occupancyPercentage,
      overallDensity,
      overallRisk: this._classifyRisk(avgStadiumScore)
    };

    return output;
  }

  _classifyDensity(percentage) {
    if (percentage <= 40) return "Low";
    if (percentage <= 70) return "Moderate";
    if (percentage <= 90) return "High";
    return "Critical";
  }

  _calculateCrowdLevel(percentage) {
    if (percentage <= 20) return 1;
    if (percentage <= 40) return 2;
    if (percentage <= 60) return 3;
    if (percentage <= 80) return 4;
    return 5;
  }

  _classifyRisk(score) {
    if (score < 30) return "Low";
    if (score <= 60) return "Medium";
    if (score <= 80) return "High";
    return "Critical";
  }

  _predict(history, futureMs) {
    if (history.length < 2) return history.length > 0 ? history[0].val : 0;
    
    const first = history[0];
    const last = history[history.length - 1];
    const timeDelta = last.time - first.time;
    if (timeDelta === 0) return last.val;

    const rate = (last.val - first.val) / timeDelta;
    let prediction = last.val + (rate * futureMs);
    
    return Math.max(0, Math.min(100, prediction)); // Clamp to 0-100
  }

  executeAction(simContext, actionId, locationId) {
    const now = Date.now();
    this.activeActions.set(locationId, {
      actionId,
      startTime: now,
      phase: 'taking_action',
      logged: false
    });
    
    // Immediately apply first state tick
    this._updateLifecycles(simContext);
  }
}

// Export for module usage or attach to window
if (typeof window !== 'undefined') {
  window.CrowdIntelligenceEngine = CrowdIntelligenceEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CrowdIntelligenceEngine };
}

export { CrowdIntelligenceEngine };
