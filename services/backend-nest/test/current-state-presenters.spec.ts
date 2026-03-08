import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { presentAssignmentState, presentTripState } from '../src/current-state/presenters';

test('assignment presenter produces a stable primary plus items shape', () => {
  const state = presentAssignmentState('PARENT', [
    {
      id: 'assignment-1',
      status: 'ACCEPTED',
      startDate: new Date('2026-03-09T00:00:00.000Z'),
      child: {
        id: 'child-1',
        name: 'Aarav',
        institutionId: 'school-1',
        institution: { name: 'Green Valley' },
        pickupAddress: 'Pickup',
        dropAddress: 'Drop',
      },
      driver: {
        userId: 'driver-1',
        name: 'Demo Driver',
        user: { email: 'driver@ashwa.app' },
        verificationStatus: 'VERIFIED',
        serviceArea: 'Central',
        licenseDocUrl: '/license.png',
        vehicleRegDocUrl: '/reg.png',
        idProofUrl: '/id.png',
        vehiclePhotoUrl: '/vehicle.png',
        baseLat: 12.97,
        baseLng: 77.59,
        vehicle: { makeModel: 'Toyota', plateNumber: 'KA01', seatsCapacity: 12, color: 'White' },
        institutions: [{ institution: { id: 'school-1', name: 'Green Valley', type: 'SCHOOL' } }],
      },
    },
  ]);

  assert.equal(state.role, 'PARENT');
  assert.equal(state.primary?.id, 'assignment-1');
  assert.equal(state.items.length, 1);
  assert.equal(state.primary?.driver?.trust.isServiceReady, true);
});

test('trip presenter filters parent-visible children and computes next stop', () => {
  const state = presentTripState(
    {
      id: 'trip-1',
      tripType: 'MORNING',
      status: 'ACTIVE',
      startedAt: new Date('2026-03-09T08:00:00.000Z'),
      endedAt: null,
      pings: [{ lat: 12.97, lng: 77.59, timestamp: new Date('2026-03-09T08:05:00.000Z') }],
      stops: [
        { id: 'stop-1', stopType: 'PICKUP', childId: 'child-1', child: { id: 'child-1', name: 'Aarav', institutionId: 'school-1', pickupAddress: 'Pickup 1', dropAddress: 'Drop 1' }, address: 'Pickup 1', lat: 1, lng: 1, sequenceIndex: 0 },
        { id: 'stop-2', stopType: 'PICKUP', childId: 'child-2', child: { id: 'child-2', name: 'Diya', institutionId: 'school-1', pickupAddress: 'Pickup 2', dropAddress: 'Drop 2' }, address: 'Pickup 2', lat: 2, lng: 2, sequenceIndex: 1 },
        { id: 'stop-3', stopType: 'SCHOOL', childId: null, child: null, address: 'School', lat: 3, lng: 3, sequenceIndex: 2 },
      ],
      events: [{ id: 'event-1', childId: 'child-1', child: { name: 'Aarav' }, eventType: 'CHILD_BOARDED', timestamp: new Date('2026-03-09T08:10:00.000Z'), metadata: null }],
    },
    ['child-1'],
  );

  assert.equal(state.manifest.length, 1);
  assert.equal(state.manifest[0].id, 'child-1');
  assert.equal(state.timeline.length, 1);
  assert.equal(state.nextStop?.id, 'stop-3');
  assert.equal(state.latestLocation?.lat, 12.97);
});
