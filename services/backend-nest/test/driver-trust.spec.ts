import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { summarizeDriverTrust } from '../src/drivers/driver-trust';

test('verified driver becomes parent-visible only when docs and service info are complete', () => {
  const summary = summarizeDriverTrust({
    verificationStatus: 'VERIFIED',
    serviceArea: 'Central',
    baseLat: 12.97,
    baseLng: 77.59,
    licenseDocUrl: '/docs/license.png',
    vehicleRegDocUrl: '/docs/reg.png',
    idProofUrl: '/docs/id.png',
    vehiclePhotoUrl: '/docs/vehicle.png',
    vehicle: { makeModel: 'Toyota', seatsCapacity: 10 },
    institutions: [{}],
  });

  assert.equal(summary.isServiceReady, true);
  assert.equal(summary.isParentVisible, true);
  assert.deepEqual(summary.missingItems, []);
});

test('pending or incomplete driver stays hidden from parents', () => {
  const summary = summarizeDriverTrust({
    verificationStatus: 'PENDING',
    serviceArea: null,
    baseLat: null,
    baseLng: null,
    licenseDocUrl: null,
    vehicleRegDocUrl: null,
    idProofUrl: null,
    vehiclePhotoUrl: null,
    vehicle: null,
    institutions: [],
  });

  assert.equal(summary.isServiceReady, false);
  assert.equal(summary.isParentVisible, false);
  assert.ok(summary.missingItems.includes('license document'));
  assert.equal(summary.nextAdminAction, 'Request missing info');
});
