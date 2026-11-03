import { describe, it, expect } from "vitest";
import { calculateMileage } from "./database";

describe("calculateMileage", () => {
  it("should return 0 when coordinates are identical", () => {
    expect(calculateMileage(40.7128, -74.0060, 40.7128, -74.0060)).toBe(0);
  });

  it("should calculate correct distance for known coordinates (NY to LA)", () => {
    // Distance from New York (40.7128, -74.0060) to Los Angeles (34.0522, -118.2437)
    // is approximately 2445-2450 miles
    const distance = calculateMileage(40.7128, -74.0060, 34.0522, -118.2437);
    expect(distance).toBeGreaterThan(2400);
    expect(distance).toBeLessThan(2500);
  });

  it("should calculate correct distance for short distances (same city)", () => {
    // Times Square (40.7580, -73.9855) to Central Park (40.7812, -73.9665)
    // Should be around 1.5 - 2.5 miles
    const distance = calculateMileage(40.7580, -73.9855, 40.7812, -73.9665);
    expect(distance).toBeGreaterThan(1.5);
    expect(distance).toBeLessThan(2.5);
  });

  it("should return the same distance regardless of point order", () => {
    const d1 = calculateMileage(40.7128, -74.0060, 34.0522, -118.2437);
    const d2 = calculateMileage(34.0522, -118.2437, 40.7128, -74.0060);
    expect(d1).toBe(d2);
  });

  it("should handle crossing the equator", () => {
    // New York (40.7128, -74.0060) to Rio de Janeiro (-22.9068, -43.1729)
    // About 4800 miles
    const distance = calculateMileage(40.7128, -74.0060, -22.9068, -43.1729);
    expect(distance).toBeGreaterThan(4700);
    expect(distance).toBeLessThan(4900);
  });

  it("should handle negative longitudes and positive longitudes (crossing prime meridian)", () => {
    // New York (40.7128, -74.0060) to London (51.5074, -0.1278)
    // About 3450 miles
    const distance = calculateMileage(40.7128, -74.0060, 51.5074, -0.1278);
    expect(distance).toBeGreaterThan(3400);
    expect(distance).toBeLessThan(3500);
  });

  it("should handle distance across International Date Line", () => {
    // Tokyo (35.6762, 139.6503) to San Francisco (37.7749, -122.4194)
    // About 5100 miles
    const distance = calculateMileage(35.6762, 139.6503, 37.7749, -122.4194);
    expect(distance).toBeGreaterThan(5000);
    expect(distance).toBeLessThan(5300);
  });
});
