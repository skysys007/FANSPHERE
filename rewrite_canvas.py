import re

with open("index.html", "r") as f:
    html = f.read()

# 1. Replace SVG with Canvas
svg_start = html.find('<svg id="blueprint-svg"')
svg_end = html.find('</svg>') + 6
canvas_html = '<canvas id="blueprint-canvas" style="display:block; width:100%; height:100%; cursor:grab; touch-action:none;"></canvas>'
html = html[:svg_start] + canvas_html + html[svg_end:]

# 2. Replace the wedge loops and add Canvas Engine
old_wedge_start = html.find('let wedgeSvg = \'\';')
old_wedge_end = html.find('const gates = [')

new_graph_init = """// Initialize nodes without DOM elements
    for(let l = 0; l < levels.length; l++) {
      const lvl = levels[l];
      const midRx = lvl.inRx + (lvl.outRx - lvl.inRx)/2;
      const midRy = lvl.inRy + (lvl.outRy - lvl.inRy)/2;

      for(let i = 0; i < numSections; i++) {
        const angle = (i * angleStep) - (Math.PI / 2);
        let normAngle = angle;
        while (normAngle < 0) normAngle += 2 * Math.PI;
        
        const isSideline = (normAngle > 0.5 && normAngle < 2.6) || (normAngle > 3.6 && normAngle < 5.7);
        if (lvl.type === 'suite' && !isSideline) continue;

        const sectionId = lvl.type === 'suite' 
          ? `${lvl.name.replace('Suite ', 'S')}-${String(i+1).padStart(2, '0')}` 
          : `${lvl.name.charAt(0)}${String(i+1).padStart(2, '0')}`;
          
        const secId = `sec-${sectionId}`;
        
        const cx = centerX + Math.cos(angle) * midRx;
        const cy = centerY + Math.sin(angle) * midRy;
        const concourseRx = lvl.outRx + 1;
        const concourseRy = lvl.outRy + 1;
        const concourseX = centerX + Math.cos(angle) * concourseRx;
        const concourseY = centerY + Math.sin(angle) * concourseRy;
        
        stadiumGraph.nodes[secId] = { 
          id: secId, name: `${lvl.type === 'suite' ? 'Suite' : 'Section'} ${sectionId}`, 
          x: cx, y: cy, rx: midRx, ry: midRy, angle: angle,
          concourseX, concourseY, concourseRx, concourseRy, level: lvl.name, index: i
        };
      }
    }

    """
html = html[:old_wedge_start] + new_graph_init + html[old_wedge_end:]

# 3. Replace Zoom/Pan and SVG drawing code with Canvas Render loop
zoom_start = html.find('// Generate Hash Marks on Football Field')
zoom_end = html.find('// DIJKSTRA PATHFINDING')

canvas_engine = """// ==========================================
    // CANVAS RENDER ENGINE & ZOOM/PAN
    // ==========================================
    const canvas = document.getElementById('blueprint-canvas');
    let ctx = null;
    let canvasView = { x: 0, y: 0, scale: 1, baseW: 1200, baseH: 1000 };
    let activeRoute = null;
    
    // Resize observer
    const mapContainer = document.getElementById('map-container');
    const resizeCanvas = () => {
      if (!canvas) return;
      const rect = mapContainer.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (!ctx) ctx = canvas.getContext('2d', { alpha: false });
      requestRender();
    };
    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 0);

    let renderRAF = null;
    function requestRender() {
      if (!renderRAF) {
        renderRAF = requestAnimationFrame(() => {
          renderStadium();
          renderRAF = null;
        });
      }
    }

    // Zoom/Pan logic
    let isPanning = false;
    let startPoint = { x: 0, y: 0 };
    let startView = { x: 0, y: 0 };

    canvas.addEventListener('mousedown', (e) => {
      isPanning = true;
      startPoint = { x: e.clientX, y: e.clientY };
      startView = { x: canvasView.x, y: canvasView.y };
      canvas.style.cursor = "grabbing";
    });

    window.addEventListener('mouseup', () => {
      if (isPanning) {
        isPanning = false;
        canvas.style.cursor = "grab";
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      const dx = e.clientX - startPoint.x;
      const dy = e.clientY - startPoint.y;
      const effectiveScale = getEffectiveScale();
      canvasView.x = startView.x + dx / effectiveScale;
      canvasView.y = startView.y + dy / effectiveScale;
      requestRender();
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const effectiveScale = getEffectiveScale();
      
      const worldX = (mouseX / effectiveScale) - canvasView.x;
      const worldY = (mouseY / effectiveScale) - canvasView.y;
      
      canvasView.scale *= zoomFactor;
      const newEffectiveScale = getEffectiveScale();
      
      canvasView.x = (mouseX / newEffectiveScale) - worldX;
      canvasView.y = (mouseY / newEffectiveScale) - worldY;
      requestRender();
    }, { passive: false });

    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      canvasView.scale *= 1.2; requestRender();
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      canvasView.scale *= 0.8; requestRender();
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      canvasView = { x: 0, y: 0, scale: 1, baseW: 1200, baseH: 1000 };
      requestRender();
    });

    function getEffectiveScale() {
      if (!canvas) return 1;
      const scaleX = canvas.width / canvasView.baseW;
      const scaleY = canvas.height / canvasView.baseH;
      return Math.min(scaleX, scaleY) * canvasView.scale;
    }

    function renderStadium() {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      const effectiveScale = getEffectiveScale();
      const baseScale = Math.min(canvas.width / canvasView.baseW, canvas.height / canvasView.baseH);
      const defaultOffsetX = (canvas.width - canvasView.baseW * baseScale) / 2;
      const defaultOffsetY = (canvas.height - canvasView.baseH * baseScale) / 2;
      
      ctx.translate(defaultOffsetX, defaultOffsetY);
      ctx.scale(effectiveScale, effectiveScale);
      ctx.translate(canvasView.x, canvasView.y);
      
      // Glow
      const grad = ctx.createRadialGradient(600, 500, 0, 600, 500, 450);
      grad.addColorStop(0.6, 'rgba(14, 165, 233, 0.05)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(600, 500, 450, 0, 2*Math.PI);
      ctx.fill();

      // Outer Shell
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.setLineDash([10, 10]);
      drawRoundedRect(ctx, 150, 150, 900, 700, 350);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Tiers (Levels)
      for(let l = 0; l < levels.length; l++) {
        const lvl = levels[l];
        const midRx = lvl.inRx + (lvl.outRx - lvl.inRx)/2;
        const midRy = lvl.inRy + (lvl.outRy - lvl.inRy)/2;
        const x = centerX - midRx;
        const y = centerY - midRy;
        const w = 2 * midRx;
        const h = 2 * midRy;
        const strokeWidth = lvl.outRx - lvl.inRx - 2;
        const cornerRadius = 80 + (l * 15);
        
        if (!lvl.type) {
          ctx.strokeStyle = lvl.name === '300' ? '#020617' : 'rgba(2, 6, 23, 0.8)';
          ctx.lineWidth = strokeWidth + 2;
          drawRoundedRect(ctx, x, y, w, h, cornerRadius);
          ctx.stroke();
        }
        
        const perimeter = 2 * (w - 2*cornerRadius) + 2 * (h - 2*cornerRadius) + 2 * Math.PI * cornerRadius;
        const dash = (perimeter / numSections) - 1.5;
        
        ctx.strokeStyle = lvl.fill;
        ctx.lineWidth = strokeWidth;
        ctx.setLineDash([dash, 1.5]);
        drawRoundedRect(ctx, x, y, w, h, cornerRadius);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Labels
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for(let i = 0; i < numSections; i++) {
          if (i % 4 !== 0) continue;
          const angle = (i * angleStep) - (Math.PI / 2);
          const cx = centerX + Math.cos(angle) * midRx;
          const cy = centerY + Math.sin(angle) * midRy;
          const deg = angle + Math.PI/2;
          const fontSize = lvl.name === '100' ? 5.5 : lvl.name === '200' ? 7 : 10;
          const sectionId = lvl.type === 'suite' ? `${lvl.name.replace('Suite ', 'S')}-${String(i+1).padStart(2, '0')}` : `${lvl.name.charAt(0)}${String(i+1).padStart(2, '0')}`;
          
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(deg);
          ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
          ctx.fillText(sectionId, 0, 0);
          ctx.restore();
        }
      }

      // Heatmaps (Quadrants)
      if (isHeatmapActive && currentCrowdData && currentCrowdData.quadrantDensity) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ['north', 'south', 'east', 'west'].forEach(quad => {
          const density = currentCrowdData.quadrantDensity[quad] || 0;
          if (density > 0) {
            let qx, qy, qrx, qry;
            if (quad === 'north') { qx = 600; qy = 250; qrx = 400; qry = 250; }
            if (quad === 'south') { qx = 600; qy = 750; qrx = 400; qry = 250; }
            if (quad === 'east') { qx = 950; qy = 500; qrx = 250; qry = 400; }
            if (quad === 'west') { qx = 250; qy = 500; qrx = 250; qry = 400; }
            
            const grad = ctx.createRadialGradient(qx, qy, 0, qx, qy, Math.max(qrx, qry));
            grad.addColorStop(0, densityToColor(density, 0.45));
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(qx, qy, qrx, qry, 0, 0, 2*Math.PI);
            ctx.fill();
          }
        });
        ctx.restore();
      }

      // Field Boundary
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.fillStyle = "#020617";
      drawRoundedRect(ctx, 370, 370, 460, 260, 130);
      ctx.fill();
      ctx.stroke();

      // Football Field (rotated -90)
      ctx.save();
      ctx.translate(600, 500);
      ctx.rotate(-Math.PI / 2);
      ctx.translate(-80, -180);
      
      ctx.fillStyle = "rgba(16, 185, 129, 0.1)";
      ctx.fillRect(0, 0, 160, 360);
      
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(0, 0, 160, 30);
      ctx.fillRect(0, 330, 160, 30);
      
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.save(); ctx.translate(80, 20); ctx.rotate(Math.PI); ctx.fillText("METLIFE", 0, 0); ctx.restore();
      ctx.fillText("METLIFE", 80, 350);
      
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      for (let y = 60; y <= 300; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(160, y); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 180); ctx.lineTo(160, 180); ctx.stroke();
      
      ctx.font = "14px monospace";
      ctx.fillText("50", 20, 176);
      ctx.fillText("50", 140, 176);
      
      // Hash marks
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      for (let y = 30; y <= 330; y += 3) {
        if ((y - 30) % 30 === 0) continue;
        ctx.beginPath();
        ctx.moveTo(60, y); ctx.lineTo(64, y);
        ctx.moveTo(96, y); ctx.lineTo(100, y);
        ctx.stroke();
      }
      ctx.restore();

      // Gates
      gates.forEach(g => {
        let intensity = 0, text = "Traffic: 0/min";
        if (isHeatmapActive && currentCrowdData && currentCrowdData.gates[g.id]) {
          const info = currentCrowdData.gates[g.id];
          intensity = Math.min(1, info.trafficPerMin / 200);
          text = `${info.trafficPerMin}/min • ~${info.waitTimeMin}m wait`;
        }
        
        if (intensity > 0) {
          const pulseR = 35 + (intensity * 25);
          ctx.fillStyle = densityToColor(intensity, 0.7);
          ctx.beginPath(); ctx.arc(g.x, g.y, pulseR, 0, 2*Math.PI); ctx.fill();
        }
        
        ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.arc(g.x, g.y, 25, 0, 2*Math.PI); ctx.fill();
        ctx.fillStyle = "rgba(56, 189, 248, 0.2)"; ctx.beginPath(); ctx.arc(g.x, g.y, 15, 0, 2*Math.PI); ctx.fill();
        
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = (g.x > 600) ? "right" : "left";
        const tx = g.x > 600 ? g.x - 35 : g.x + 35;
        const ty = (g.y < 500) ? g.y - 15 : g.y + 25;
        ctx.fillText(g.name, tx, ty);
        
        ctx.font = "10px monospace";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(text, tx, ty + 15);
      });

      // Active Route
      if (activeRoute && activeRoute.length > 0) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        for (let i = 0; i < activeRoute.length; i++) {
          const node = stadiumGraph.nodes[activeRoute[i]];
          if (!node) continue;
          if (i === 0) ctx.moveTo(node.x, node.y);
          else ctx.lineTo(node.x, node.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        const start = stadiumGraph.nodes[activeRoute[0]];
        const end = stadiumGraph.nodes[activeRoute[activeRoute.length - 1]];
        if (start) { ctx.fillStyle = "#10b981"; ctx.beginPath(); ctx.arc(start.x, start.y, 8, 0, 2*Math.PI); ctx.fill(); }
        if (end) { ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(end.x, end.y, 8, 0, 2*Math.PI); ctx.fill(); }
      }

      ctx.restore();
    }

    function drawRoundedRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    // ==========================================
    """
html = html[:zoom_start] + canvas_engine + html[zoom_end:]

# 4. Replace route plotting
route_start = html.find('// Draw path in SVG')
route_end = html.find('// Add steps to UI')
if route_start != -1 and route_end != -1:
    html = html[:route_start] + "activeRoute = path;\n      requestRender();\n      " + html[route_end:]

# Fix route clearing logic (find where it resets routing)
clear_route = html.find('routeLayer.innerHTML = "";')
while clear_route != -1:
    html = html[:clear_route] + "activeRoute = null; requestRender();" + html[clear_route+26:]
    clear_route = html.find('routeLayer.innerHTML = "";')

# 5. Replace Heatmap rendering
hm_start = html.find('function renderHeatmap(data) {')
hm_end = html.find('let currentCrowdData = null;')

hm_engine = """function renderHeatmap(data) {
      if (!isHeatmapActive || !data) return;
      
      const hud = document.getElementById('crowd-hud');
      if (hud) {
        document.getElementById('hud-attendance').textContent = data.totalAttendance.toLocaleString();
        document.getElementById('hud-capacity').textContent = data.capacity.toLocaleString();
        document.getElementById('hud-fill-bar').style.width = `${data.fillPercentage}%`;
        document.getElementById('hud-fill-pct').textContent = `${data.fillPercentage}% Full`;

        const phaseLabels = {
          'pre-open': '🏟️ Pre-Open', 'early-arrival': '🚶 Early Arrivals', 'steady-flow': '🚶‍♂️ Steady Flow',
          'rush-hour': '🔥 Rush Hour', 'final-surge': '⚡ Final Surge', 'match-live': '⚽ Match Live', 'post-match': '🚪 Post-Match Exit'
        };
        document.getElementById('hud-phase').textContent = phaseLabels[data.phase] || data.phase;

        if (data.minutesToKickoff > 0) {
          const h = Math.floor(data.minutesToKickoff / 60);
          const m = data.minutesToKickoff % 60;
          document.getElementById('hud-kickoff').textContent = `Kickoff: ${h}h ${m}m`;
        } else {
          document.getElementById('hud-kickoff').textContent = `Kickoff: LIVE`;
        }
        document.getElementById('hud-match').textContent = `${data.matchInfo.homeTeam} vs ${data.matchInfo.awayTeam}`;
        document.getElementById('hud-source').textContent = data.matchInfo.apiSource === 'websocket' ? '🟢 Source: Live WebSocket Server' : data.matchInfo.apiSource ? '📡 Source: API-Football' : '🔄 Source: Synthetic Simulation';
      }
      
      currentCrowdData = data;
      requestRender();
    }

    function clearHeatmap() {
      document.getElementById('crowd-hud')?.classList.add('hidden');
      currentCrowdData = null;
      requestRender();
    }

    """
if hm_start != -1 and hm_end != -1:
    html = html[:hm_start] + hm_engine + html[hm_end:]

# Replace the clearHeatmap reference in the heatmap button toggle
toggle_start = html.find('clearHeatmap();')
if toggle_start != -1:
    # it is already calling clearHeatmap(), which is fine, no need to touch

with open("index.html", "w") as f:
    f.write(html)
