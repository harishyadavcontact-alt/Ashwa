import { describe, expect, it } from 'vitest';
import { getNextTripAction, validateTripEvent, type TripLike } from './tripProgression';

const morning: TripLike = {
  tripType: 'MORNING',
  stops: [
    { id: 'p1', stopType: 'PICKUP', childId: 'c1', childName: 'Asha', sequenceIndex: 0, address: 'A', lat: 0, lng: 0 },
    { id: 'p2', stopType: 'PICKUP', childId: 'c2', childName: 'Ravi', sequenceIndex: 1, address: 'B', lat: 0, lng: 0 },
    { id: 's', stopType: 'SCHOOL', childId: null, sequenceIndex: 2, address: 'School', lat: 0, lng: 0 },
  ],
  events: [],
};

describe('trip progression (morning)', () => {
  it('starts with the first pickup, asking for arrival first', () => {
    const next = getNextTripAction(morning);
    expect(next.nextStop?.id).toBe('p1');
    expect(next.allowedEvents).toEqual(['DRIVER_AT_PICKUP']);
    expect(next.label).toBe('Handle pickup for Asha');
  });

  it('requires boarding after arrival, then moves on to the next child', () => {
    const t = { ...morning, events: [{ childId: 'c1', eventType: 'DRIVER_AT_PICKUP' as const }] };
    expect(getNextTripAction(t).allowedEvents).toEqual(['CHILD_BOARDED']);
    const t2 = { ...t, events: [...t.events, { childId: 'c1', eventType: 'CHILD_BOARDED' as const }] };
    expect(getNextTripAction(t2).nextStop?.id).toBe('p2');
  });

  it('rejects out-of-order events', () => {
    const r = validateTripEvent(morning, 'c1', 'CHILD_BOARDED');
    expect(r.ok).toBe(false);
  });

  it('rejects a child who is not on the manifest', () => {
    const r = validateTripEvent(morning, 'zzz', 'DRIVER_AT_PICKUP');
    expect(r.ok).toBe(false);
  });

  it('reaches school after all pickups are boarded', () => {
    const events = ['c1', 'c2'].flatMap((childId) => [
      { childId, eventType: 'DRIVER_AT_PICKUP' as const },
      { childId, eventType: 'CHILD_BOARDED' as const },
    ]);
    const t = { ...morning, events };
    const next = getNextTripAction(t);
    expect(next.nextStop?.stopType).toBe('SCHOOL');
    expect(next.allowedEvents).toEqual(['DRIVER_AT_SCHOOL']);
  });
});

describe('trip progression (afternoon)', () => {
  it('uses DRIVER_LEFT_SCHOOL for the school stop', () => {
    const t: TripLike = {
      tripType: 'AFTERNOON',
      stops: [{ id: 's', stopType: 'SCHOOL', sequenceIndex: 0, address: 'School', lat: 0, lng: 0, childId: 'c1', childName: 'Asha' }],
      events: [],
    };
    expect(getNextTripAction(t).allowedEvents).toEqual(['DRIVER_LEFT_SCHOOL']);
  });
});
