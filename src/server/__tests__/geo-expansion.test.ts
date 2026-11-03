import { describe, it, expect } from 'vitest';
import { isStateActive, getStateName, getStateCoordinates } from '../../lib/constants/states';

describe('Multi-State Geo-Expansion Validation', () => {
  describe('isStateActive', () => {
    it('should pass validation for active states (NC, MD, CT, ND, KS)', () => {
      // North Carolina
      expect(isStateActive('NC')).toBe(true);
      // Maryland (Baltimore)
      expect(isStateActive('MD')).toBe(true);
      // Connecticut (New Haven)
      expect(isStateActive('CT')).toBe(true);
      // North Dakota (Fargo)
      expect(isStateActive('ND')).toBe(true);
      // Kansas (Wichita)
      expect(isStateActive('KS')).toBe(true);
    });

    it('should throw validation error (return false) for unsupported states', () => {
      // Texas (Austin)
      expect(isStateActive('TX')).toBe(false);
      // California (Los Angeles)
      expect(isStateActive('CA')).toBe(false);
      // New York
      expect(isStateActive('NY')).toBe(false);
      // Invalid input
      expect(isStateActive('XYZ')).toBe(false);
    });
    it('should support dynamic active states when a new territory is approved', () => {
      const dynamicList = ['NC', 'MD', 'CT', 'ND', 'KS', 'FL'];
      expect(isStateActive('FL', dynamicList)).toBe(true);
      expect(isStateActive('TX', dynamicList)).toBe(false);
    });
  });

  describe('getStateName and getStateCoordinates helpers', () => {
    it('should return human-readable state names', () => {
      expect(getStateName('FL')).toBe('Florida');
      expect(getStateName('NC')).toBe('North Carolina');
      expect(getStateName('TX')).toBe('Texas');
    });

    it('should return valid medical hub coordinates for state map centering', () => {
      const flCoords = getStateCoordinates('FL');
      expect(flCoords.lat).toBeCloseTo(28.5383, 1);
      expect(flCoords.lng).toBeCloseTo(-81.3792, 1);
      expect(flCoords.hubName).toContain('Florida');
    });
  });
});
