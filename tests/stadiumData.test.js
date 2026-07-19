import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Stadium Data Integrity', () => {
  beforeAll(() => {
    // Load the stadiumData.js file into the global scope
    const dataPath = path.resolve(__dirname, '../js/stadiumData.js');
    const code = fs.readFileSync(dataPath, 'utf8');
    
    // We replace const with var so they become properties of the global object in this context
    const modifiedCode = code.replace(/const /g, 'var ');
    eval(modifiedCode);
    
    // Attach to global scope for tests
    global.RAG_DATABASE = eval('RAG_DATABASE');
    global.SUSTAINABILITY_METRICS = eval('SUSTAINABILITY_METRICS');
    global.TRANSIT_SCHEDULE = eval('TRANSIT_SCHEDULE');
    global.FOOD_STALLS = eval('FOOD_STALLS');
    global.TRANSLATIONS = eval('TRANSLATIONS');
  });

  it('should have a valid RAG database', () => {
    expect(global.RAG_DATABASE).toBeDefined();
    expect(Array.isArray(global.RAG_DATABASE)).toBe(true);
    expect(global.RAG_DATABASE.length).toBeGreaterThan(0);
    
    // Check that each RAG entry has required fields
    global.RAG_DATABASE.forEach(entry => {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('category');
      expect(entry).toHaveProperty('content');
      expect(entry).toHaveProperty('keywords');
    });
  });

  it('should have properly structured sustainability metrics', () => {
    expect(global.SUSTAINABILITY_METRICS).toBeDefined();
    expect(global.SUSTAINABILITY_METRICS).toHaveProperty('smartBins');
    expect(global.SUSTAINABILITY_METRICS).toHaveProperty('solarGrid');
    expect(global.SUSTAINABILITY_METRICS.smartBins.baseline).toBe(42);
  });

  it('should have valid transit schedules', () => {
    expect(global.TRANSIT_SCHEDULE).toBeDefined();
    expect(global.TRANSIT_SCHEDULE).toHaveProperty('subway');
    expect(global.TRANSIT_SCHEDULE).toHaveProperty('shuttle');
    expect(global.TRANSIT_SCHEDULE.subway.status).toBe('running');
  });

  it('should support multiple languages in translations', () => {
    expect(global.TRANSLATIONS).toBeDefined();
    expect(global.TRANSLATIONS).toHaveProperty('en');
    expect(global.TRANSLATIONS).toHaveProperty('es');
    expect(global.TRANSLATIONS).toHaveProperty('hi');
    expect(global.TRANSLATIONS).toHaveProperty('fr');
    expect(global.TRANSLATIONS).toHaveProperty('pt');
    
    // Check if a specific translation key exists
    expect(global.TRANSLATIONS.en.title).toContain('FANSPHERE');
  });
});
