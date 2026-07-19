// Crowd Intelligence UI Integration
    document.addEventListener('DOMContentLoaded', () => {
      const btnIntel = document.getElementById('btn-crowd-intel');
      const intelPanel = document.getElementById('crowd-intel-panel');
      
      if (btnIntel && intelPanel) {
        btnIntel.addEventListener('click', () => {
          if (intelPanel) {
            intelPanel.classList.toggle('hidden');
            if (!intelPanel.classList.contains('hidden')) {
              intelPanel.style.display = 'flex';
              
              if (window.stadiumSim && !window.stadiumSim.isRunning) {
                 const kpiBar = document.getElementById('ci-kpi-bar');
                 if (kpiBar) {
                    kpiBar.innerHTML = `
                      <div class="col-span-full w-full mt-2">
                         <div class="flex items-center justify-center gap-3 bg-sky-900/10 border border-sky-500/20 rounded-lg p-4">
                            <i data-lucide="info" class="w-5 h-5 text-sky-400 opacity-80"></i>
                            <span class="text-sky-300 font-medium uppercase text-sm tracking-wider">PLEASE TURN ON SIMULATION or CONNECT TO LIVE DATA source TO see insights</span>
                         </div>
                      </div>
                    `;
                 }
                 const zoneGrid = document.getElementById('ci-zone-grid');
                 if (zoneGrid) {
                    zoneGrid.innerHTML = `
                      <div class="h-full w-full p-10 flex flex-col items-center justify-center transition-opacity duration-1000">
                         <div class="flex flex-col items-center justify-center max-w-lg text-center opacity-70">
                            <div class="p-4 bg-sky-900/20 rounded-full mb-6 border border-sky-500/20">
                               <i data-lucide="server" class="w-10 h-10 text-sky-400 opacity-90"></i>
                            </div>
                            <h2 class="text-sky-300 font-medium uppercase text-xl tracking-widest leading-relaxed">
                               PLEASE TURN ON SIMULATION<br/>TO CONNECT TO LIVE DATA<br/>TO USE OPERATIONS
                            </h2>
                            <p class="text-slate-500 mt-6 text-xs font-mono tracking-wider uppercase">
                               Waiting for telemetry stream...
                            </p>
                         </div>
                      </div>
                    `;
                    lucide.createIcons();
                 }
              }
            } else {
              intelPanel.style.display = '';
            }
          }
        });
      }
    });

    window.addEventListener('crowdIntelligenceUpdated', (e) => {
      const data = e.detail;
      const kpiBar = document.getElementById('ci-kpi-bar');
      const alertsEl = document.getElementById('ci-alerts');
      const zoneGrid = document.getElementById('ci-zone-grid');
      const actionLogEl = document.getElementById('ci-action-log');
      
      if (!kpiBar) return;
      
      // Helper Functions
      const formatNumber = (val) => isNaN(val) ? '—' : Math.round(val).toLocaleString();
      const formatSpeed = (val) => isNaN(val) ? '—' : `${parseFloat(val).toFixed(2)} m/s`;
      const formatPeopleMin = (val, isOutflow = false) => {
         if (isNaN(val)) return '—';
         const rounded = Math.round(val);
         if (rounded === 0) return '0 people/min';
         return isOutflow ? `-${rounded} people/min` : `+${rounded} people/min`;
      };
      
      // Compute Totals
      const totalEntering = data.sections.reduce((sum, s) => sum + s.enteringPerMin, 0);
      const totalLeaving = data.sections.reduce((sum, s) => sum + s.leavingPerMin, 0);
      const avgSpeed = (data.sections.reduce((sum, s) => sum + parseFloat(s.movementSpeed), 0) / (data.sections.length || 1));
      const criticalZones = data.sections.filter(s => s.riskLevel === 'Critical').length;
      
      const dataEngineSelect = document.getElementById('data-engine-select');
      const isSimRunning = (window.stadiumSim && window.stadiumSim.isRunning) || (dataEngineSelect && dataEngineSelect.value !== 'math');
      
      // Update Top KPIs
      if (isSimRunning) {
        kpiBar.innerHTML = `
        <div class="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 backdrop-blur">
           <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Capacity</div>
           <div class="text-xl font-black text-white">82,500</div>
        </div>
        <div class="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 backdrop-blur">
           <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Overall Occupancy</div>
           <div class="text-xl font-black text-sky-400">${Math.round(data.stadiumSummary.occupancyPercentage)}%</div>
        </div>
        <div class="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 backdrop-blur">
           <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Overall Risk</div>
           <div class="text-xl font-black ${data.stadiumSummary.overallRisk === 'Critical' ? 'text-red-400' : 'text-emerald-400'}">${data.stadiumSummary.overallRisk}</div>
        </div>
        <div class="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 backdrop-blur">
           <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">People Moving / Min</div>
           <div class="text-xl font-black text-white">${formatNumber(totalEntering + totalLeaving)}</div>
        </div>
        <div class="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 backdrop-blur">
           <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Avg Movement Speed</div>
           <div class="text-xl font-black text-amber-400">${formatSpeed(avgSpeed)}</div>
        </div>
        <div class="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 backdrop-blur">
           <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Critical Zones</div>
           <div class="text-xl font-black ${criticalZones > 0 ? 'text-red-500 animate-pulse' : 'text-slate-500'}">${criticalZones}</div>
        </div>
      `;
      }
      
      // Update Action Log
      if (data.actionLog && data.actionLog.length > 0) {
        actionLogEl.innerHTML = data.actionLog.map(log => `
          <div class="text-xs text-slate-300 p-2 bg-slate-800/50 rounded border border-slate-700/50">
            <div class="flex justify-between items-center mb-1">
               <span class="font-mono text-[10px] text-slate-500">${log.time}</span>
               <span class="text-[10px] uppercase font-bold text-emerald-400">${log.status}</span>
            </div>
            <div class="text-sky-400 font-bold">${log.action}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Location: ${log.location}</div>
          </div>
        `).reverse().join('');
      }
      
      // Update Sustainability Metrics
      if (window.renderSustainability) {
         window.renderSustainability();
      }
      
      // Delegate action clicks
      if (!window.actionLogDelegated) {
        alertsEl.addEventListener('click', (ev) => {
          if (ev.target.tagName === 'BUTTON' && ev.target.dataset.actionId) {
             const actionId = ev.target.dataset.actionId;
             const locationsStr = ev.target.dataset.location;
             
             if (actionId === 'deployStaff') {
                 if (window.activeEmergencies) {
                     const em = window.activeEmergencies.find(e => e.status === 'active' && e.location === locationsStr);
                     if (em) {
                         em.status = 'resolved';
                         
                         if (!window.activeEmergencies.some(e => e.status === 'active')) {
                             document.querySelectorAll('.emergency-dot').forEach(dot => dot.remove());
                         }
                         
                         if (window.stadiumSim && window.stadiumSim.intelligenceEngine) {
                             window.stadiumSim.intelligenceEngine.actionLog.push({
                                 time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                                 action: 'Deployed Venue Staff',
                                 location: em.location,
                                 status: 'Resolved'
                             });
                         }
                     }
                 }
                 ev.target.textContent = 'Staff Deployed';
                 ev.target.className = 'w-full py-2 mt-2 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                 ev.target.disabled = true;
                 
                 // Immediately re-render alerts to remove the emergency from the list
                 if (window.stadiumSim && window.stadiumSim.intelligenceEngine) {
                     const intelOutput = window.stadiumSim.intelligenceEngine.process(window.stadiumSim);
                     window.dispatchEvent(new CustomEvent('crowdIntelligenceUpdated', { detail: intelOutput }));
                 }
                 return;
             }
             
             if (window.stadiumSim && locationsStr) {
                const locations = locationsStr.split(',');
                locations.forEach(loc => {
                   window.stadiumSim.intelligenceEngine.executeAction(window.stadiumSim, actionId, loc.trim());
                });
                ev.target.textContent = 'Executed';
                ev.target.className = 'w-full py-2 mt-2 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                ev.target.disabled = true;
             }
          }
        });
        window.actionLogDelegated = true;
      }
      
      // Update Alerts (Incident Feed)
      let displayAlerts = [...data.alerts];
      if (window.activeEmergencies) {
          window.activeEmergencies.forEach(em => {
              if (em.status === 'active') {
                  displayAlerts.unshift({
                      isUserEmergency: true,
                      severity: em.severity || "CRITICAL EMERGENCY",
                      location: em.location,
                      message: em.description,
                      recommendedAction: em.recommendedAction || "Deploy venue staff immediately.",
                      actionId: "deployStaff",
                      aiExplanation: em.aiExplanation || "Emergency reported by user."
                  });
              }
          });
      }

      // Update red blinking dot
      const pingBadge = document.getElementById('incident-badge-ping');
      const coreBadge = document.getElementById('incident-badge-core');
      const hasActiveIncidents = displayAlerts.some(a => !a.lifecyclePhase || a.lifecyclePhase === 'taking_action');
      if (pingBadge && coreBadge) {
          if (hasActiveIncidents) {
              pingBadge.classList.remove('hidden');
              coreBadge.classList.remove('hidden');
          } else {
              pingBadge.classList.add('hidden');
              coreBadge.classList.add('hidden');
          }
      }

      if (displayAlerts.length === 0) {
        alertsEl.innerHTML = '<div class="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg text-center text-sm text-emerald-500 font-bold"><i data-lucide="check-circle" class="w-6 h-6 mx-auto mb-2 opacity-50"></i>No Critical Incidents</div>';
      } else {
        alertsEl.innerHTML = displayAlerts.map(a => {
          if (a.lifecyclePhase) {
            if (a.lifecyclePhase === 'taking_action') {
              return `
                <div class="p-3 bg-orange-950/40 border border-orange-500/50 rounded-lg backdrop-blur">
                  <div class="font-bold text-orange-400 text-sm flex items-center justify-between mb-1">
                    <span>${a.location}</span>
                    <span class="animate-pulse text-[10px] uppercase tracking-wide bg-orange-500/20 px-2 py-0.5 rounded">Deploying</span>
                  </div>
                  <div class="text-xs text-orange-200 mt-1 leading-relaxed">${a.message}</div>
                </div>`;
            } else if (a.lifecyclePhase === 'resolving') {
              return `
                <div class="p-3 bg-sky-950/40 border border-sky-500/50 rounded-lg backdrop-blur">
                  <div class="font-bold text-sky-400 text-sm flex items-center justify-between mb-1">
                    <span>${a.location}</span>
                    <span class="text-[10px] uppercase tracking-wide bg-sky-500/20 px-2 py-0.5 rounded">Resolving</span>
                  </div>
                  <div class="text-xs text-sky-200 mt-1 leading-relaxed">${a.message}</div>
                  <div class="w-full bg-slate-800/80 h-1.5 mt-3 rounded-full overflow-hidden">
                    <div class="bg-sky-500 h-full transition-all duration-1000" style="width: ${a.progress}%"></div>
                  </div>
                </div>`;
            } else if (a.lifecyclePhase === 'resolved') {
              return `
                <div class="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-lg backdrop-blur transition-all">
                  <div class="font-bold text-emerald-400 text-sm">${a.location}</div>
                  <div class="text-xs text-emerald-200 mt-1">${a.message}</div>
                </div>`;
            }
          }
          
          return `
            <div class="p-3 bg-slate-900/80 border border-red-500/40 rounded-lg backdrop-blur shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <div class="font-bold text-red-400 text-sm flex items-center justify-between">
                 ${a.location}
                 <span class="text-[10px] uppercase bg-red-500/20 px-2 py-0.5 rounded tracking-wide font-black">${a.severity}</span>
              </div>
              <div class="text-xs text-slate-300 mt-2 leading-relaxed border-l-2 border-red-500/30 pl-2">${a.aiExplanation || a.message}</div>
              <div class="text-[10px] text-sky-400 mt-3 border-t border-slate-700/50 pt-2 flex flex-col gap-1">
                <span class="font-bold uppercase tracking-wider text-slate-500">AI Recommendation</span>
                <span>${a.recommendedAction}</span>
                ${a.actionImpact ? `<span class="text-emerald-400 font-mono mt-1">EST. IMPACT: -${a.actionImpact.occupancyReduction || a.actionImpact.congestionReduction}</span>` : ''}
              </div>
              ${a.actionId ? `<button data-action-id="${a.actionId}" data-location="${a.actionTarget || a.location}" class="w-full py-2 mt-3 text-xs font-black tracking-wider uppercase rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 border border-purple-500/40 transition-all shadow-[0_0_10px_rgba(168,85,247,0.1)]">Take Action</button>` : ''}
            </div>
          `;
        }).join('');
      }
      
      // Format gates so they fit cleanly into the sections grid
      if (isSimRunning) {
        const gateNames = {
           'gate-amex': 'AMEX Gate', 'gate-hcl': 'HCLTech Gate', 
           'gate-verizon': 'Verizon Gate', 'gate-fansphere': 'FANSPHERE Gate', 
           'gate-moodys': "Moody's Gate"
        };
        const formattedGates = (data.gates || []).map(g => {
         const isCrit = g.queueLength > 80;
         const isCong = g.queueLength > 50;
         const isBusy = g.queueLength > 20;
         const gateName = gateNames[g.id] || g.id;
         return {
            id: g.id,
            displayName: `${gateName} (${g.type})`,
            isGate: true,
            crowdStatus: isCrit ? 'Critical' : (isCong ? 'Congested' : (isBusy ? 'Busy' : 'Comfortable')),
            riskLevel: isCrit ? 'Critical' : (isCong ? 'High' : (isBusy ? 'Medium' : 'Low')),
            occupancyPercentage: Math.min(100, (g.queueLength / 120) * 100),
            congestionPercentage: (() => {
               const gaussian = (mean, stdev) => {
                   const u = 1 - Math.random();
                   const v = Math.random();
                   return mean + stdev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
               };
               
               const occ = Math.min(100, (g.queueLength / 120) * 100);
               let meanCongestion = occ < 60 ? 12 : (occ < 82 ? 45 : 88);
               let variance = occ < 60 ? 15 : (occ < 82 ? 30 : 25);
               
               // Global chaos modifier: ensure extreme variance is possible regardless of phase
               if (window.stadiumSim) {
                   meanCongestion += 25; 
                   variance += 15;
               }
               
               const entering = g.type === 'Entry' ? Math.floor(g.queueLength / 2) : 0;
               const leaving = g.type === 'Exit' ? Math.floor(g.queueLength / 2) : 0;
               const flowImpact = ((entering - leaving) / 10) * 6;
               
               meanCongestion += flowImpact;
               meanCongestion *= 2.0; // Gates * 2.0 multiplier
               variance *= 1.5;
               
               let finalCongestion = gaussian(meanCongestion, variance);
               if (finalCongestion > 95) {
                   finalCongestion = 90 + Math.random() * 5.8;
               }
               
               let target = Math.max(0, finalCongestion);
               
               // Temporal smoothing using the backend sim state
               if (window.stadiumSim) {
                   const simGate = window.stadiumSim.entryGates.get(g.id) || window.stadiumSim.exitGates.get(g.id);
                   if (simGate) {
                       const prev = simGate._lastUI_Congestion !== undefined ? simGate._lastUI_Congestion : target;
                       target = (prev * 0.85) + (target * 0.15);
                       simGate._lastUI_Congestion = target;
                   }
               }
               return target;
            })(),
            queueLength: g.queueLength,
            enteringPerMin: g.type === 'Entry' ? Math.floor(g.currentFlow) : 0,
            leavingPerMin: g.type === 'Exit' ? Math.floor(g.currentFlow) : 0,
            movementSpeed: isCong ? '0.2' : '1.0'
         };
      });
      
      // Update Zone Grid
      const allZones = [...data.sections, ...formattedGates]; 
      
      // Sort by risk so critical ones are guaranteed to be on top
      allZones.sort((a,b) => {
         const scoreA = a.riskLevel === 'Critical' ? 1000 : (a.riskLevel === 'High' ? 500 : a.congestionPercentage);
         const scoreB = b.riskLevel === 'Critical' ? 1000 : (b.riskLevel === 'High' ? 500 : b.congestionPercentage);
         return scoreB - scoreA;
      });
      
      zoneGrid.innerHTML = allZones.map(s => {
        let riskColor = 'text-emerald-400';
        let barColorOcc = s.occupancyPercentage > 85 ? 'bg-orange-500' : 'bg-emerald-500';
        let barColorCong = 'bg-emerald-500';
        
        if (s.crowdStatus === 'Busy') riskColor = 'text-amber-400';
        if (s.crowdStatus === 'Full') riskColor = 'text-orange-400';
        if (s.crowdStatus === 'Crowded') riskColor = 'text-orange-400'; // Fallback
        if (s.crowdStatus === 'Congested') { riskColor = 'text-red-400'; barColorCong = 'bg-red-500'; }
        if (s.crowdStatus === 'Critical') { riskColor = 'text-red-500 font-black animate-pulse'; barColorCong = 'bg-red-600'; }
        
        return `
        <div class="p-4 bg-slate-800/30 border ${s.isGate ? 'border-cyan-700/40' : 'border-slate-700/50'} rounded-xl backdrop-blur hover:bg-slate-800/50 transition-colors">
          <div class="flex justify-between items-center mb-3 border-b border-slate-700/50 pb-2">
            <div class="font-bold text-slate-100 text-lg">${s.displayName || 'Section ' + s.id}${s.isGate ? ' <span class="text-[9px] text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded ml-2 uppercase">Gate</span>' : ''}</div>
            <div class="${riskColor} text-xs font-bold uppercase tracking-wider">${s.crowdStatus}</div>
          </div>
          
          <div class="grid grid-cols-2 gap-4 mb-4">
             <div>
                <div class="flex justify-between text-[10px] text-slate-400 uppercase font-bold mb-1">
                   <span>Occupancy</span>
                   <span>${Math.round(s.occupancyPercentage)}%</span>
                </div>
                <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                   <div class="${barColorOcc} h-full transition-all" style="width: ${Math.min(100, s.occupancyPercentage)}%"></div>
                </div>
             </div>
             <div>
                <div class="flex justify-between text-[10px] text-slate-400 uppercase font-bold mb-1">
                   <span>Congestion</span>
                   <span>${Math.round(s.congestionPercentage)}%</span>
                </div>
                <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                   <div class="${barColorCong} h-full transition-all" style="width: ${Math.min(100, s.congestionPercentage)}%"></div>
                </div>
             </div>
          </div>

          <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
             <div class="flex flex-col">
                <span class="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Speed</span>
                <span class="text-slate-300 font-mono">${formatSpeed(s.movementSpeed)}</span>
             </div>
             <div class="flex flex-col">
                <span class="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Direction</span>
                <span class="text-slate-300 font-mono">${s.movementDirection || '—'}</span>
             </div>
             <div class="flex flex-col">
                <span class="text-[9px] text-slate-500 uppercase tracking-widest font-bold">In Flow</span>
                <span class="text-slate-300 font-mono text-emerald-400">${formatPeopleMin(s.enteringPerMin, false)}</span>
             </div>
             <div class="flex flex-col">
                <span class="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Out Flow</span>
                <span class="text-slate-300 font-mono text-sky-400">${formatPeopleMin(s.leavingPerMin, true)}</span>
             </div>
          </div>
        </div>
        `;
      }).join('');
      }
      
      // Re-trigger feather/lucide icons if necessary
      if (typeof lucide !== 'undefined') {
         lucide.createIcons();
      }
    });

    // ==========================================
    // DATA SOURCE CONFIGURATION LOGIC
    // ==========================================
    document.getElementById('btn-data-config').addEventListener('click', () => {
      document.getElementById('data-config-panel').classList.toggle('hidden');
    });

    const engineSelect = document.getElementById('data-engine-select');
    const configFileInput = document.getElementById('data-config-file');
    const configApiInput = document.getElementById('data-config-api');
    const dataStatus = document.getElementById('data-status');
    
    let externalDatasetFrames = [];
    let externalDatasetIndex = 0;
    let externalDatasetTimer = null;
    let activeWebSocket = null;

    function stopInternalSimulation() {
       if (window.stadiumSim) {
          window.stadiumSim.stop();
       }
    }

    function startInternalSimulation() {
       if (window.stadiumSim) {
          window.stadiumSim.start();
       }
    }

    function cleanupExternalSources() {
       if (externalDatasetTimer) {
          clearInterval(externalDatasetTimer);
          externalDatasetTimer = null;
       }
       if (activeWebSocket) {
          activeWebSocket.close();
          activeWebSocket = null;
       }
    }

    function applyExternalData(data) {
       if (!window.stadiumSim) return;
       
       const sim = window.stadiumSim;
       
       if (data.gates) {
          data.gates.forEach(g => {
             const gate = sim.entryGates.get(g.id) || sim.exitGates.get(g.id);
             if (gate) {
                gate.queueLength = g.queueLength !== undefined ? g.queueLength : gate.queueLength;
                gate.occupancy = g.occupancy !== undefined ? g.occupancy : gate.queueLength;
                gate.waitTime = g.waitTime !== undefined ? g.waitTime : Math.floor(gate.queueLength * 0.15);
                gate.density = Math.min(1, gate.queueLength / gate.capacity);
                gate.status = gate.queueLength > 80 ? 'congested' : (gate.queueLength > 2 ? 'open' : 'closed');
             }
          });
       }
       
       if (data.sections) {
          data.sections.forEach(s => {
             const sec = sim.sections.get(s.id);
             if (sec) {
                sec.occupancyRate = s.occupancyRate !== undefined ? s.occupancyRate : sec.occupancyRate;
                sec.occupiedSeats = Math.floor(sec.capacity * sec.occupancyRate);
                sec.movementSpeed = s.movementSpeed !== undefined ? s.movementSpeed : sec.movementSpeed;
                sec.peopleEnteringPerMin = s.peopleEnteringPerMin !== undefined ? s.peopleEnteringPerMin : sec.peopleEnteringPerMin;
                sec.peopleLeavingPerMin = s.peopleLeavingPerMin !== undefined ? s.peopleLeavingPerMin : sec.peopleLeavingPerMin;
                sec.crowdDensity = s.crowdDensity !== undefined ? s.crowdDensity : sec.occupancyRate;
             }
          });
       }
       
       if (data.zones) {
          data.zones.forEach(zone => {
             let targetObj = null;
             for (let gate of sim.entryGates.values()) if (gate.name === zone.zone_name) targetObj = gate;
             if (!targetObj) for (let gate of sim.exitGates.values()) if (gate.name === zone.zone_name) targetObj = gate;
             if (!targetObj) for (let sec of sim.sections.values()) if (sec.name === zone.zone_name) targetObj = sec;
             
             if (!targetObj) {
                const secMatch = zone.zone_name.match(/\d{3}/);
                if (secMatch) {
                   const fallbackName = `Section ${secMatch[0]}`;
                   for (let sec of sim.sections.values()) if (sec.name === fallbackName) targetObj = sec;
                }
             }
             
             if (targetObj) {
                if (zone.type === 'gate') {
                   targetObj.queueLength = Math.floor((zone.congestion_pct / 100) * targetObj.capacity);
                   targetObj.occupancy = zone.inflow_m;
                   targetObj.density = zone.congestion_pct / 100;
                   targetObj.status = zone.congestion_pct > 80 ? 'congested' : 'normal';
                } else {
                   targetObj.occupancyRate = zone.occupancy_pct / 100;
                   targetObj.occupiedSeats = Math.floor(targetObj.capacity * targetObj.occupancyRate);
                   targetObj.movementSpeed = zone.speed_ms;
                   targetObj.peopleEnteringPerMin = zone.inflow_m;
                   targetObj.peopleLeavingPerMin = zone.outflow_m;
                   targetObj.crowdDensity = zone.occupancy_pct;
                }
             }
          });
       }
       
       // Trigger intelligence engine processing explicitly
       if (sim.intelligenceEngine) {
          const intelOutput = sim.intelligenceEngine.process(sim);
          const event = new CustomEvent('crowdIntelligenceUpdated', { detail: intelOutput });
          window.dispatchEvent(event);
       }
       
       requestRender();
    }

    engineSelect.addEventListener('change', (e) => {
       const mode = e.target.value;
       configFileInput.classList.add('hidden');
       configApiInput.classList.add('hidden');
       cleanupExternalSources();
       
       if (mode === 'math') {
          startInternalSimulation();
          dataStatus.textContent = 'Status: Math Engine Running';
       } else if (mode === 'file') {
          stopInternalSimulation();
          configFileInput.classList.remove('hidden');
          dataStatus.textContent = 'Status: Waiting for file upload...';
       } else if (mode === 'api') {
          stopInternalSimulation();
          configApiInput.classList.remove('hidden');
          dataStatus.textContent = 'Status: Disconnected';
       }
    });

    document.getElementById('data-file-input').addEventListener('change', (e) => {
       const file = e.target.files[0];
       if (!file) return;
       
       const reader = new FileReader();
       reader.onload = (ev) => {
          try {
             const json = JSON.parse(ev.target.result);
             if (Array.isArray(json)) {
                externalDatasetFrames = json;
                externalDatasetIndex = 0;
                dataStatus.textContent = `Status: Replaying ${externalDatasetFrames.length} frames...`;
                
                // Replay at 5 second intervals to match normal tick rate
                externalDatasetTimer = setInterval(() => {
                   if (externalDatasetIndex < externalDatasetFrames.length) {
                      applyExternalData(externalDatasetFrames[externalDatasetIndex]);
                      dataStatus.textContent = `Status: Frame ${externalDatasetIndex + 1} of ${externalDatasetFrames.length}`;
                      externalDatasetIndex++;
                   } else {
                      // Loop
                      externalDatasetIndex = 0;
                   }
                }, 5000);
                
                // Immediately apply first frame
                applyExternalData(externalDatasetFrames[0]);
                externalDatasetIndex++;
             } else {
                dataStatus.textContent = 'Error: JSON must be an array of frames';
             }
          } catch(err) {
             dataStatus.textContent = 'Error: Invalid JSON file';
          }
       };
       reader.readAsText(file);
    });

    document.getElementById('btn-api-connect').addEventListener('click', () => {
       const url = document.getElementById('data-api-url').value;
       if (!url) return;
       
       if (activeWebSocket) {
          activeWebSocket.close();
       }
       
       dataStatus.textContent = 'Status: Connecting...';
       
       try {
          activeWebSocket = new WebSocket(url);
          
          activeWebSocket.onopen = () => {
             dataStatus.textContent = 'Status: Connected';
             document.getElementById('btn-api-connect').textContent = 'Disconnect';
          };
          
          activeWebSocket.onmessage = (e) => {
             try {
                const data = JSON.parse(e.data);
                applyExternalData(data);
                dataStatus.textContent = 'Status: Receiving Telemetry...';
             } catch(err) {
                console.error("Failed to parse websocket message", err);
             }
          };
          
          activeWebSocket.onclose = () => {
             dataStatus.textContent = 'Status: Disconnected';
             document.getElementById('btn-api-connect').textContent = 'Connect';
             activeWebSocket = null;
          };
          
          activeWebSocket.onerror = (err) => {
             dataStatus.textContent = 'Status: Connection Error';
          };
       } catch (err) {
          dataStatus.textContent = 'Error: Invalid URL';
       }
    });