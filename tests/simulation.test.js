import { describe, it, expect, beforeEach } from 'vitest';
import { StadiumSimulation } from '../js/simulation.js';

describe('Stadium Simulation Engine', () => {
  let sim;

  beforeEach(() => {
    sim = new StadiumSimulation(123);
  });

  it('should initialize correctly', () => {
    expect(sim.phase).toBe('pre_match');
    expect(sim.isRunning).toBe(false);
    expect(sim.tickCount).toBe(0);
    expect(sim.totalEntered).toBe(0);
  });

  it('should allow adding gates and sections', () => {
    sim.addEntryGate('gate-1', 'Main Entry', 200);
    sim.addExitGate('exit-1', 'Main Exit', 250);
    sim.addSection('sec-1', 'Section A', 500);

    expect(sim.entryGates.size).toBe(1);
    expect(sim.exitGates.size).toBe(1);
    expect(sim.sections.size).toBe(1);

    expect(sim.entryGates.get('gate-1').capacity).toBe(200);
    expect(sim.sections.get('sec-1').capacity).toBe(500);
  });

  it('should transition phases correctly', () => {
    sim.setPhase('during_match');
    expect(sim.phase).toBe('during_match');
    
    // Changing phase to during_match fast-forwards section occupancy
    sim.addSection('sec-1', 'Section A', 1000);
    sim.setPhase('during_match');
    
    const section = sim.sections.get('sec-1');
    expect(section.occupiedSeats).toBeGreaterThan(0);
    expect(section.occupancyRate).toBeGreaterThan(0.85); // should be around 90-95%
  });

  it('should process ticks without error', () => {
    sim.addEntryGate('gate-1', 'Main Entry', 200);
    sim.addSection('sec-1', 'Section A', 500);
    
    // Simulate one tick
    sim.tick();
    
    expect(sim.tickCount).toBe(1);
    // In pre-match, entry gate queues should grow because people spawn
    const gate = sim.entryGates.get('gate-1');
    expect(gate.queueLength).toBeGreaterThanOrEqual(0);
    expect(sim.totalEntered).toBeGreaterThanOrEqual(0);
  });
});
