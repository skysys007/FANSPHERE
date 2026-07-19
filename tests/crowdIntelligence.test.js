import { describe, it, expect } from 'vitest';
import { CrowdIntelligenceEngine } from '../js/crowdIntelligence.js';

describe('Crowd Intelligence Engine', () => {
  it('should initialize with correct default state', () => {
    const engine = new CrowdIntelligenceEngine();
    expect(engine.history.stadium.length).toBe(0);
    expect(engine.actionLog.length).toBe(0);
    expect(engine.activeActions.size).toBe(0);
  });

  it('should process a basic simulation state and return correct summary', () => {
    const engine = new CrowdIntelligenceEngine();
    
    // Mock input state representing a nearly empty stadium
    const mockState = {
      phase: 'pre_match',
      sections: [
        { id: 'sec-1', name: 'Section 1', capacity: 100, occupiedSeats: 10, peopleEnteringPerMin: 2, peopleLeavingPerMin: 0, movementSpeed: 1.4, flowDirection: 'Static' },
        { id: 'node-concourse', name: 'Concourse A', capacity: 500, occupiedSeats: 25, peopleEnteringPerMin: 10, peopleLeavingPerMin: 5, movementSpeed: 1.5, flowDirection: 'Entering' }
      ],
      entryGates: [
        { id: 'gate-1', capacity: 100, occupancy: 5, queueLength: 0, waitTime: 0 }
      ],
      exitGates: []
    };

    const output = engine.process(mockState);
    
    expect(output).toHaveProperty('stadiumSummary');
    expect(output).toHaveProperty('sections');
    expect(output).toHaveProperty('alerts');
    
    // With very low occupancy, density should be Low
    expect(output.stadiumSummary.overallDensity).toBe('Low');
    expect(output.stadiumSummary.occupancyPercentage).toBeLessThan(10);
    
    // Sections should be processed
    expect(output.sections.length).toBe(2);
    expect(output.sections[0].id).toBe('sec-1');
  });

  it('should generate alerts when gates are heavily congested', () => {
    const engine = new CrowdIntelligenceEngine();
    
    // Mock input state representing a highly congested gate
    const mockState = {
      phase: 'pre_match',
      sections: [],
      entryGates: [
        { id: 'gate-1', capacity: 100, occupancy: 100, queueLength: 150, waitTime: 1.5 }
      ],
      exitGates: []
    };

    const output = engine.process(mockState);
    
    // Should have generated an alert for the queue length > 60
    expect(output.alerts.length).toBeGreaterThan(0);
    expect(output.alerts[0].severity).toBe('Critical');
    expect(output.alerts[0].location).toContain('Gate gate-1');
    expect(output.alerts[0].actionId).toBe('openGate');
  });

  it('should track action lifecycles properly', () => {
    const engine = new CrowdIntelligenceEngine();
    
    // Execute an action
    engine.executeAction({}, 'openGate', 'Entry Gate gate-1');
    
    expect(engine.activeActions.has('Entry Gate gate-1')).toBe(true);
    const action = engine.activeActions.get('Entry Gate gate-1');
    
    expect(action.actionId).toBe('openGate');
    expect(action.phase).toBe('taking_action'); // because it just started
  });
});
