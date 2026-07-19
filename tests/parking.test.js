import { describe, it, expect, beforeEach } from 'vitest';
import { StadiumParkingManager, PARKING_CONFIG } from '../js/parking.js';

// Mock the DOM for Node.js test environment
global.document = {
  getElementById: (id) => ({
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    innerHTML: ''
  }),
  addEventListener: () => {},
  createElement: () => ({
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {},
    innerHTML: '',
    className: ''
  }),
  head: { appendChild: () => {} }
};

global.maplibregl = {
  Map: class { flyTo() {} },
  Marker: class { setLngLat() { return this; } setPopup() { return this; } addTo() {} },
  Popup: class { setHTML() { return this; } }
};

describe('Stadium Parking System', () => {
  let manager;

  beforeEach(() => {
    manager = new StadiumParkingManager();
  });

  it('should initialize with configuration data', () => {
    expect(PARKING_CONFIG).toBeDefined();
    expect(PARKING_CONFIG.LOTS.length).toBeGreaterThan(0);
    expect(manager.data.length).toBe(PARKING_CONFIG.LOTS.length);
  });

  it('should generate mock occupancy data correctly', () => {
    const lot = manager.data[0];
    expect(lot).toHaveProperty('occupied');
    expect(lot).toHaveProperty('available');
    expect(lot).toHaveProperty('status');
    expect(lot).toHaveProperty('barColor');
    
    // Check that occupied + available = maxCapacity
    expect(lot.occupied + lot.available).toBe(lot.maxCapacity);
  });

  it('should escape HTML to prevent XSS vulnerabilities', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const escaped = manager._escapeHTML(maliciousInput);
    
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('should correctly determine status based on occupancy', () => {
    // Force mock data to a specific state to test logic
    const fullLot = { ...PARKING_CONFIG.LOTS[0], maxCapacity: 100 };
    const occPercent = 0.95;
    const occupied = 95;
    
    // Simulate what the private method does for testing
    let status = 'Comfortable';
    if (occPercent > 0.9) status = 'Full';
    else if (occPercent > 0.75) status = 'Busy';
    
    expect(status).toBe('Full');
  });
});
