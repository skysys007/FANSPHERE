import { describe, it, expect } from 'vitest';
import { RAG_DATABASE, SUSTAINABILITY_METRICS, TRANSIT_SCHEDULE, FOOD_STALLS, TRANSLATIONS } from '../js/stadiumData.js';

describe('Stadium Data Integrity', () => {
  it('should have a valid RAG database', () => {
    expect(RAG_DATABASE).toBeDefined();
    expect(Array.isArray(RAG_DATABASE)).toBe(true);
    expect(RAG_DATABASE.length).toBeGreaterThan(0);
    
    // Check that each RAG entry has required fields
    RAG_DATABASE.forEach(entry => {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('category');
      expect(entry).toHaveProperty('content');
      expect(entry).toHaveProperty('keywords');
    });
  });

  it('should have properly structured sustainability metrics', () => {
    expect(SUSTAINABILITY_METRICS).toBeDefined();
    expect(SUSTAINABILITY_METRICS).toHaveProperty('smartBins');
    expect(SUSTAINABILITY_METRICS).toHaveProperty('solarGrid');
    expect(SUSTAINABILITY_METRICS.smartBins.baseline).toBe(42);
  });

  it('should have valid transit schedules', () => {
    expect(TRANSIT_SCHEDULE).toBeDefined();
    expect(TRANSIT_SCHEDULE).toHaveProperty('subway');
    expect(TRANSIT_SCHEDULE).toHaveProperty('shuttle');
    expect(TRANSIT_SCHEDULE.subway.status).toBe('running');
  });

  it('should support multiple languages in translations', () => {
    expect(TRANSLATIONS).toBeDefined();
    expect(TRANSLATIONS).toHaveProperty('en');
    expect(TRANSLATIONS).toHaveProperty('es');
    expect(TRANSLATIONS).toHaveProperty('hi');
    expect(TRANSLATIONS).toHaveProperty('fr');
    expect(TRANSLATIONS).toHaveProperty('pt');
    
    // Check if a specific translation key exists
    expect(TRANSLATIONS.en.title).toContain('FANSPHERE');
  });
});
