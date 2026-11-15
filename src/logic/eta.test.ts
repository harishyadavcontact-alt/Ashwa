import { describe, expect, it } from 'vitest';
import { etaMinutes, haversineMeters, isApproaching } from './eta';

describe('haversineMeters', () => {
  it('is zero for the same point', () => {
    expect(haversineMeters({ lat: 12.97, lng: 77.59 }, { lat: 12.97, lng: 77.59 })).toBe(0);
  });

  it('is about 111 km per degree of latitude', () => {
    const d = haversineMeters({ lat: 12, lng: 77 }, { lat: 13, lng: 77 });
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});

describe('ETA', () => {
  it('converts distance to minutes at the assumed speed', () => {
    // 20 km/h = 333.3 m/min, so 1,666 m is about 5 minutes
    expect(etaMinutes(1666, 20)).toBeCloseTo(5, 0);
  });

  it('alerts at 5 minutes or less, not before', () => {
    expect(isApproaching(1000)).toBe(true); // 3 min
    expect(isApproaching(3000)).toBe(false); // 9 min
  });
});
