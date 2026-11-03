import { describe, it, expect } from 'vitest';
import { estimateDriveTimeMinutes } from '../database';

describe('estimateDriveTimeMinutes', () => {
  it('should calculate time for 0 miles', () => {
    expect(estimateDriveTimeMinutes(0)).toBe(3);
  });

  it('should calculate time for 10 miles', () => {
    // 10 / 25 * 60 = 24
    expect(estimateDriveTimeMinutes(10)).toBe(24);
  });

  it('should handle small distances properly (min 3 minutes)', () => {
    // 0.5 / 25 * 60 = 1.2
    expect(estimateDriveTimeMinutes(0.5)).toBe(3);
  });

  it('should round correctly', () => {
    // 15.5 / 25 * 60 = 37.2 -> 37
    expect(estimateDriveTimeMinutes(15.5)).toBe(37);

    // 15.8 / 25 * 60 = 37.92 -> 38
    expect(estimateDriveTimeMinutes(15.8)).toBe(38);
  });
});
