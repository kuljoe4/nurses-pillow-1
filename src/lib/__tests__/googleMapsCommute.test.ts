import { describe, it, expect } from 'vitest';
import { getListingCoordinates, LISTING_GEO_MAP } from '../googleMapsCommute.ts';

describe('getListingCoordinates', () => {
  it('should return exact coordinates for a known listing ID', () => {
    const knownId = 'nc-duke-condo';
    const result = getListingCoordinates({ id: knownId });
    expect(result).toEqual(LISTING_GEO_MAP[knownId]);
  });

  it('should return default city coordinates when ID is unknown but city is recognized', () => {
    const resultDurham = getListingCoordinates({ id: 'unknown-1', city: 'Durham' });
    expect(resultDurham.lat).toBe(36.0090);
    expect(resultDurham.lng).toBe(-78.9320);
    expect(resultDurham.city).toBe('Durham');
    expect(resultDurham.state).toBe('NC');

    const resultSF = getListingCoordinates({ id: 'unknown-2', city: 'san francisco' });
    expect(resultSF.lat).toBe(37.7650);
    expect(resultSF.lng).toBe(-122.4000);
    expect(resultSF.city).toBe('San Francisco');
    expect(resultSF.state).toBe('CA');
  });

  it('should use deterministic hash offset for unknown ID and unrecognized city', () => {
    const listingId1 = 'unknown-id-123';
    const result1 = getListingCoordinates({ id: listingId1, city: 'Unknownville', state: 'ZZ' });

    // Should be deterministic
    const result2 = getListingCoordinates({ id: listingId1, city: 'Unknownville', state: 'ZZ' });
    expect(result1).toEqual(result2);

    // Should return expected fallback base coords with slight offset
    const baseLat = 36.0076;
    const baseLng = -78.9382;
    expect(Math.abs(result1.lat - baseLat)).toBeLessThan(0.05);
    expect(Math.abs(result1.lng - baseLng)).toBeLessThan(0.05);
    expect(result1.city).toBe('Unknownville');
    expect(result1.state).toBe('ZZ');

    // Different ID should give different offset (most of the time, statistically)
    const listingId2 = 'completely-different-id-456';
    const result3 = getListingCoordinates({ id: listingId2, city: 'Unknownville', state: 'ZZ' });

    // Verify they are different (or at least calculated from hash)
    // The probability of a collision is small but non-zero, but with these specific IDs they will differ
    expect(result1).not.toEqual(result3);
  });

  it('should handle undefined or empty inputs gracefully', () => {
    const result = getListingCoordinates({ id: '' });

    const baseLat = 36.0076;
    const baseLng = -78.9382;

    // Hash of empty string is 0 -> offsetLat = (0 - 50) * 0.0004 = -0.02
    expect(result.lat).toBeCloseTo(baseLat - 0.02);
    expect(result.lng).toBeCloseTo(baseLng - 0.02); // offsetLng = (0 - 50) * 0.0004 = -0.02
    expect(result.city).toBe('Durham'); // Fallback city
    expect(result.state).toBe('NC');    // Fallback state
  });
});
