/**
 * Demo data seeder for local testing
 * Populates in-memory store with test data for Dad's scenario:
 * - Dad (driver) with van
 * - 15 test families with children
 * - 3 schools in Bangalore
 * - Pre-made assignments for today
 */

import { DummyStore } from './dummy-store';

export function seedDemoData(store: DummyStore): void {
  console.log('🌱 Seeding demo data...');

  // Schools
  const schools = [
    { id: 'school-1', name: "St. Xavier's High School", location: { lat: 13.0266, lng: 77.5959 }, city: 'Whitefield' },
    { id: 'school-2', name: 'DAV Public School', location: { lat: 13.0356, lng: 77.5984 }, city: 'Indiranagar' },
    { id: 'school-3', name: 'Vibgyor High School', location: { lat: 13.0045, lng: 77.6147 }, city: 'Yeshwantpur' },
  ];

  // Dad (driver)
  const dadId = 'dad-001';
  store.createDriver(
    dadId,
    '9876543210',
    'Harish',
    'DL1001',
    'Van-001',
    'Toyota Innova',
    ['school-1', 'school-2', 'school-3']
  );

  // 15 test families with children
  const families = [
    {
      parentId: 'parent-1',
      parentPhone: '9999999001',
      parentName: 'Priya',
      childId: 'child-1',
      childName: 'Arjun',
      schoolId: 'school-1',
      pickupLat: 13.0345,
      pickupLng: 77.5912,
      dropLat: 13.0266,
      dropLng: 77.5959,
    },
    {
      parentId: 'parent-2',
      parentPhone: '9999999002',
      parentName: 'Deepa',
      childId: 'child-2',
      childName: 'Isha',
      schoolId: 'school-1',
      pickupLat: 13.0356,
      pickupLng: 77.5924,
      dropLat: 13.0266,
      dropLng: 77.5959,
    },
    {
      parentId: 'parent-3',
      parentPhone: '9999999003',
      parentName: 'Meera',
      childId: 'child-3',
      childName: 'Rahul',
      schoolId: 'school-1',
      pickupLat: 13.0334,
      pickupLng: 77.5901,
      dropLat: 13.0266,
      dropLng: 77.5959,
    },
    {
      parentId: 'parent-4',
      parentPhone: '9999999004',
      parentName: 'Anjali',
      childId: 'child-4',
      childName: 'Veda',
      schoolId: 'school-2',
      pickupLat: 13.0398,
      pickupLng: 77.6031,
      dropLat: 13.0356,
      dropLng: 77.5984,
    },
    {
      parentId: 'parent-5',
      parentPhone: '9999999005',
      parentName: 'Sunita',
      childId: 'child-5',
      childName: 'Karan',
      schoolId: 'school-2',
      pickupLat: 13.0387,
      pickupLng: 77.6012,
      dropLat: 13.0356,
      dropLng: 77.5984,
    },
    {
      parentId: 'parent-6',
      parentPhone: '9999999006',
      parentName: 'Pooja',
      childId: 'child-6',
      childName: 'Nisha',
      schoolId: 'school-2',
      pickupLat: 13.0376,
      pickupLng: 77.6002,
      dropLat: 13.0356,
      dropLng: 77.5984,
    },
    {
      parentId: 'parent-7',
      parentPhone: '9999999007',
      parentName: 'Renu',
      childId: 'child-7',
      childName: 'Aditya',
      schoolId: 'school-3',
      pickupLat: 13.0089,
      pickupLng: 77.6192,
      dropLat: 13.0045,
      dropLng: 77.6147,
    },
    {
      parentId: 'parent-8',
      parentPhone: '9999999008',
      parentName: 'Kavya',
      childId: 'child-8',
      childName: 'Diya',
      schoolId: 'school-3',
      pickupLat: 13.0078,
      pickupLng: 77.6178,
      dropLat: 13.0045,
      dropLng: 77.6147,
    },
    {
      parentId: 'parent-9',
      parentPhone: '9999999009',
      parentName: 'Sneha',
      childId: 'child-9',
      childName: 'Rohan',
      schoolId: 'school-1',
      pickupLat: 13.0323,
      pickupLng: 77.5888,
      dropLat: 13.0266,
      dropLng: 77.5959,
    },
    {
      parentId: 'parent-10',
      parentPhone: '9999999010',
      parentName: 'Divya',
      childId: 'child-10',
      childName: 'Ananya',
      schoolId: 'school-1',
      pickupLat: 13.0312,
      pickupLng: 77.5875,
      dropLat: 13.0266,
      dropLng: 77.5959,
    },
    {
      parentId: 'parent-11',
      parentPhone: '9999999011',
      parentName: 'Nikita',
      childId: 'child-11',
      childName: 'Aryan',
      schoolId: 'school-2',
      pickupLat: 13.0365,
      pickupLng: 77.6045,
      dropLat: 13.0356,
      dropLng: 77.5984,
    },
    {
      parentId: 'parent-12',
      parentPhone: '9999999012',
      parentName: 'Sharma',
      childId: 'child-12',
      childName: 'Zara',
      schoolId: 'school-2',
      pickupLat: 13.0354,
      pickupLng: 77.6024,
      dropLat: 13.0356,
      dropLng: 77.5984,
    },
    {
      parentId: 'parent-13',
      parentPhone: '9999999013',
      parentName: 'Preet',
      childId: 'child-13',
      childName: 'Kabir',
      schoolId: 'school-3',
      pickupLat: 13.0056,
      pickupLng: 77.6165,
      dropLat: 13.0045,
      dropLng: 77.6147,
    },
    {
      parentId: 'parent-14',
      parentPhone: '9999999014',
      parentName: 'Tanvi',
      childId: 'child-14',
      childName: 'Mira',
      schoolId: 'school-3',
      pickupLat: 13.0067,
      pickupLng: 77.6134,
      dropLat: 13.0045,
      dropLng: 77.6147,
    },
    {
      parentId: 'parent-15',
      parentPhone: '9999999015',
      parentName: 'Lata',
      childId: 'child-15',
      childName: 'Vinay',
      schoolId: 'school-1',
      pickupLat: 13.0301,
      pickupLng: 77.5862,
      dropLat: 13.0266,
      dropLng: 77.5959,
    },
  ];

  // Create all families and auto-link to Dad
  families.forEach((family) => {
    store.createParent(family.parentId, family.parentPhone, family.parentName);
    store.createChild(
      family.childId,
      family.childName,
      family.parentPhone,
      family.schoolId,
      family.pickupLat,
      family.pickupLng,
      family.dropLat,
      family.dropLng
    );
    // Auto-link parent to Dad's van
    store.assignChildToDriver(family.childId, dadId);
  });

  // Create a trip for today (pre-loaded for demo)
  const tripId = 'trip-demo-001';
  store.createTrip(tripId, dadId, 'today', [
    ...families.slice(0, 3).map((f) => ({ childId: f.childId, schoolId: f.schoolId })), // St. Xavier's
    ...families.slice(3, 6).map((f) => ({ childId: f.childId, schoolId: f.schoolId })), // DAV
    ...families.slice(6, 8).map((f) => ({ childId: f.childId, schoolId: f.schoolId })), // Vibgyor
  ]);

  console.log(`✅ Seeded: 1 driver (Dad), 15 families, 15 children, 3 schools, 1 trip`);
  console.log(`📱 Test credentials:`);
  console.log(`   Driver (Dad): phone=9876543210`);
  console.log(`   Parent 1: phone=9999999001 (Priya)`);
  console.log(`   Parent 2: phone=9999999002 (Deepa)`);
  console.log(`   ...and 13 more families`);
}
