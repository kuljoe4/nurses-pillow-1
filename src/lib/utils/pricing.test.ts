import { describe, it, expect } from 'vitest';
import { calculateStayPricing } from './pricing';

describe('calculateStayPricing', () => {
  it('calculates pricing for stays under 30 days', () => {
    const result = calculateStayPricing(3000, '2026-10-01', '2026-10-15');
    expect(result.daysCount).toBe(14);
    expect(result.dailyRate).toBe(100);
    expect(result.accommodationTotal).toBe(1400); // 100 * 14
  });

  it('calculates pricing for exactly 30 days', () => {
    const result = calculateStayPricing(3000, '2026-10-01', '2026-10-31');
    expect(result.daysCount).toBe(30);
    expect(result.dailyRate).toBe(100);
    expect(result.accommodationTotal).toBe(3000);
  });

  it('calculates pricing for stays over 30 days (uneven months)', () => {
    const result = calculateStayPricing(3000, '2026-10-01', '2026-11-10'); // 40 days
    expect(result.daysCount).toBe(40);
    expect(result.dailyRate).toBe(100);
    expect(result.accommodationTotal).toBe(4000); // 1 month (3000) + 10 days (1000)
  });

  it('calculates pricing correctly for non-round numbers', () => {
    const result = calculateStayPricing(1750, '2026-10-01', '2026-10-15'); // 14 days
    expect(result.daysCount).toBe(14);
    expect(result.dailyRate).toBe(1750 / 30);
    expect(result.accommodationTotal).toBe(Math.round((1750 / 30) * 14));
  });
});
