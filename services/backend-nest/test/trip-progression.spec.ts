import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { getNextTripAction, validateTripEvent } from '../src/trips/trip-progression';

const morningTrip = {
  tripType: 'MORNING' as const,
  stops: [
    {
      id: 'pickup-1',
      stopType: 'PICKUP' as const,
      childId: 'child-1',
      child: { id: 'child-1', name: 'Asha' },
      sequenceIndex: 0,
      address: 'Home',
      lat: 12.97,
      lng: 77.59,
    },
    {
      id: 'school-1',
      stopType: 'SCHOOL' as const,
      childId: null,
      sequenceIndex: 1,
      address: 'School',
      lat: 12.98,
      lng: 77.6,
    },
  ],
  events: [],
};

test('next trip action follows pickup then school sequence', () => {
  const initialAction = getNextTripAction(morningTrip);
  assert.equal(initialAction.nextStop?.id, 'pickup-1');
  assert.deepEqual(initialAction.allowedEvents, ['DRIVER_AT_PICKUP']);

  const afterArrival = getNextTripAction({
    ...morningTrip,
    events: [{ childId: 'child-1', eventType: 'DRIVER_AT_PICKUP' as const }],
  });
  assert.equal(afterArrival.nextStop?.id, 'pickup-1');
  assert.deepEqual(afterArrival.allowedEvents, ['CHILD_BOARDED']);

  const afterPickup = getNextTripAction({
    ...morningTrip,
    events: [
      { childId: 'child-1', eventType: 'DRIVER_AT_PICKUP' as const },
      { childId: 'child-1', eventType: 'CHILD_BOARDED' as const },
    ],
  });
  assert.equal(afterPickup.nextStop?.id, 'school-1');
  assert.deepEqual(afterPickup.allowedEvents, ['DRIVER_AT_SCHOOL']);
});

test('trip event validation rejects out-of-order or wrong-child events', () => {
  const wrongChild = validateTripEvent(morningTrip, 'child-2', 'DRIVER_AT_PICKUP');
  assert.equal(wrongChild.ok, false);

  const wrongEvent = validateTripEvent(morningTrip, 'child-1', 'CHILD_BOARDED');
  assert.equal(wrongEvent.ok, false);

  const allowedEvent = validateTripEvent(morningTrip, 'child-1', 'DRIVER_AT_PICKUP');
  assert.equal(allowedEvent.ok, true);
});

test('afternoon school stop uses school departure event', () => {
  const afternoonTrip = {
    tripType: 'AFTERNOON' as const,
    stops: [
      {
        id: 'school-1',
        stopType: 'SCHOOL' as const,
        childId: null,
        sequenceIndex: 0,
        address: 'School',
        lat: 12.98,
        lng: 77.6,
      },
      {
        id: 'drop-1',
        stopType: 'DROP' as const,
        childId: 'child-1',
        child: { id: 'child-1', name: 'Asha' },
        sequenceIndex: 1,
        address: 'Home',
        lat: 12.97,
        lng: 77.59,
      },
    ],
    events: [],
  };

  const nextAction = getNextTripAction(afternoonTrip);
  assert.equal(nextAction.nextStop?.id, 'school-1');
  assert.deepEqual(nextAction.allowedEvents, ['DRIVER_LEFT_SCHOOL']);
});
