// A simple WebSocket server to stream mock telemetry to the FAN SPHERE dashboard.
// Run this with: node mock_websocket_server.js

import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

console.log('Mock WebSocket Server running on ws://localhost:8080');

wss.on('connection', function connection(ws) {
  console.log('Client connected to live telemetry stream!');

  let tickCount = 0;

  // Stream data every 3 seconds
  const interval = setInterval(() => {
    tickCount++;

    // Simulate a surging queue at the Verizon Gate
    const verizonQueue = 20 + Math.floor(Math.sin(tickCount * 0.5) * 50);

    // Simulate highly congested food courts
    const foodCourtOccupancy = 0.6 + Math.min(0.4, tickCount * 0.05);
    const movementSpeed = Math.max(0.1, 1.2 - tickCount * 0.1);

    const payload = {
      gates: [
        { id: 'gate-verizon', queueLength: Math.max(0, verizonQueue) },
        { id: 'gate-fansphere', queueLength: 5 },
      ],
      sections: [
        {
          id: 'sec-115',
          occupancyRate: foodCourtOccupancy,
          movementSpeed: movementSpeed.toFixed(2),
        },
        {
          id: 'sec-132',
          occupancyRate: foodCourtOccupancy,
          movementSpeed: movementSpeed.toFixed(2),
        },
        {
          id: 'sec-215',
          occupancyRate: foodCourtOccupancy,
          movementSpeed: movementSpeed.toFixed(2),
        },
      ],
    };

    ws.send(JSON.stringify(payload));
  }, 3000);

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
});
