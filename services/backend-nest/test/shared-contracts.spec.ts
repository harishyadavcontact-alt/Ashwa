import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  AssignmentRequestSchema,
  ChildUpsertSchema,
  TrackingSubscribeSchema,
  TripEventSchema,
} from '@ashwa/shared';

test('child schema accepts complete payload', () => {
  const parsed = ChildUpsertSchema.parse({
    name: 'Aarav',
    institutionId: 'school-1',
    pickupAddress: '1 Main Road',
    pickupLat: 12.97,
    pickupLng: 77.59,
    dropAddress: '2 Lake Road',
    dropLat: 12.98,
    dropLng: 77.6,
    emergencyPhone: '9876543210',
  });

  assert.equal(parsed.name, 'Aarav');
});

test('assignment schema coerces startDate to Date', () => {
  const parsed = AssignmentRequestSchema.parse({
    childId: 'child-1',
    driverId: 'driver-1',
    startDate: '2026-03-08T00:00:00.000Z',
  });

  assert.ok(parsed.startDate instanceof Date);
});

test('tracking subscription requires room target', () => {
  assert.throws(() => TrackingSubscribeSchema.parse({}), /tripId or driverId/);
});

test('trip event schema keeps canonical event types only', () => {
  const parsed = TripEventSchema.parse({
    childId: 'child-1',
    eventType: 'CHILD_BOARDED',
  });

  assert.equal(parsed.eventType, 'CHILD_BOARDED');
});
