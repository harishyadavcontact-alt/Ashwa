import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  const schoolA = await prisma.institution.upsert({
    where: { id: 'school-a' },
    update: {},
    create: { id: 'school-a', name: 'Green Valley School', type: 'SCHOOL', address: 'Downtown', lat: 12.9716, lng: 77.5946 },
  });
  const schoolB = await prisma.institution.upsert({
    where: { id: 'school-b' },
    update: {},
    create: { id: 'school-b', name: 'Sunrise Public School', type: 'SCHOOL', address: 'Uptown', lat: 12.9352, lng: 77.6245 },
  });

  const passwordHash = await bcrypt.hash('Password123', 10);
  const parent = await prisma.user.upsert({
    where: { email: 'parent@ashwa.app' },
    update: {},
    create: { email: 'parent@ashwa.app', passwordHash, role: 'PARENT', parentProfile: { create: { name: 'Demo Parent' } } },
  });

  const driver = await prisma.user.upsert({
    where: { email: 'driver@ashwa.app' },
    update: {},
    create: {
      email: 'driver@ashwa.app',
      passwordHash,
      role: 'DRIVER',
      driverProfile: {
        create: {
          name: 'Demo Driver',
          verificationStatus: 'VERIFIED',
          licenseDocUrl: '/seed/license.png',
          vehicleRegDocUrl: '/seed/vehicle-registration.png',
          idProofUrl: '/seed/id-proof.png',
          vehiclePhotoUrl: '/seed/vehicle-photo.png',
          serviceArea: 'Central City',
          baseLat: 12.97,
          baseLng: 77.59,
          vehicle: { create: { makeModel: 'Toyota HiAce', seatsCapacity: 12, plateNumber: 'KA01AB1234' } },
          institutions: { create: [{ institutionId: schoolA.id }, { institutionId: schoolB.id }] },
        },
      },
    },
  });

  await prisma.child.upsert({
    where: { id: 'child-1' },
    update: {},
    create: {
      id: 'child-1',
      parentId: parent.id,
      name: 'Aarav',
      institutionId: schoolA.id,
      pickupAddress: 'Home Block A',
      pickupLat: 12.965,
      pickupLng: 77.59,
      dropAddress: 'Home Block A',
      dropLat: 12.965,
      dropLng: 77.59,
      emergencyPhone: '+911234567890',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@ashwa.app' },
    update: {},
    create: { email: 'admin@ashwa.app', passwordHash, role: 'ADMIN' },
  });

  console.log({ schoolA: schoolA.name, schoolB: schoolB.name, parent: parent.email, driver: driver.email });
}

main().finally(async () => prisma.$disconnect());
