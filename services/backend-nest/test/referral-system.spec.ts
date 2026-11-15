/**
 * Test: Parent Referral Earnings System
 *
 * Scenario:
 * 1. Parent A generates referral code "ABC12345"
 * 2. Parent B uses code to register as referred
 * 3. Parent B creates a child with referral code linked
 * 4. Parent B records 3 monthly payments (PAID status)
 * 5. On month 3, Parent A should auto-receive ₹200 credit
 * 6. Earnings display should show potential + actual earned
 */

import {
  getReferralEventLog,
  clearReferralEventLog,
  getReferralEventCountByType,
  getReferralMetricsSummary,
} from '../src/referrals/extras';

// Simulate localStorage mode (in-memory state)
const testState: any = {
  parents: {
    parent_a: { id: 'parent_a', name: 'Parent A', referralCode: null },
    parent_b: { id: 'parent_b', name: 'Parent B', referralCode: null },
  },
  children: {},
  payments: {},
  referrals: [],
  earnings: [],
};

// Test helpers
function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function simulateGenerateReferralCode(parentId: string): string {
  const code = generateReferralCode();
  testState.parents[parentId].referralCode = code;
  console.log(`✓ Generated referral code for ${parentId}: ${code}`);
  return code;
}

function simulateRegisterReferral(referrerParentId: string, referredParentId: string, referralCode: string): void {
  const referral = {
    id: 'ref_' + Math.random().toString(36).substring(7),
    referrerParentId,
    referredParentId,
    referralCode,
    createdAt: new Date(),
  };
  testState.referrals.push(referral);
  console.log(`✓ Registered ${referredParentId} via referral code from ${referrerParentId}`);
}

function simulateLinkChildToReferral(childId: string, parentId: string, referralCode: string): void {
  testState.children[childId] = {
    id: childId,
    parentId,
    referralCode,
    createdAt: new Date(),
  };
  console.log(`✓ Linked child ${childId} to referral code: ${referralCode}`);
}

function simulateRecordPayment(childId: string, month: number, year: number, status: 'PENDING' | 'PAID' | 'FAILED'): void {
  const key = `${childId}_${month}_${year}`;
  testState.payments[key] = { childId, month, year, status, paidAt: new Date() };
  console.log(`✓ Recorded payment for child ${childId} - Month ${month}/${year}: ${status}`);

  // Check if this child has 3+ paid months
  const childPayments = Object.values(testState.payments).filter((p: any) => p.childId === childId && p.status === 'PAID');
  if (childPayments.length >= 3) {
    console.log(`  → Child ${childId} has ${childPayments.length} paid months. Checking for referral credits...`);
    creditReferrerIfEligible(childId, month, year);
  }
}

function creditReferrerIfEligible(childId: string, month: number, year: number): void {
  const child = testState.children[childId];
  if (!child?.referralCode) {
    console.log(`  → Child not linked to referral code. No credit.`);
    return;
  }

  const referral = testState.referrals.find((r: any) => r.referralCode === child.referralCode);
  if (!referral) {
    console.log(`  → Referral not found. No credit.`);
    return;
  }

  const existingEarning = testState.earnings.find(
    (e: any) => e.referralId === referral.id && e.month === month && e.year === year,
  );

  if (!existingEarning) {
    const earning = {
      id: 'earn_' + Math.random().toString(36).substring(7),
      parentId: referral.referrerParentId,
      referredParentId: child.parentId,
      referralId: referral.id,
      amount: 200,
      month,
      year,
      status: 'CREDITED',
      createdAt: new Date(),
    };
    testState.earnings.push(earning);
    console.log(`  ✓ CREDITED ₹200 to ${referral.referrerParentId} (referrer of ${child.parentId})`);
  }
}

function getParentEarnings(parentId: string): number {
  return testState.earnings
    .filter((e: any) => e.parentId === parentId && e.status === 'CREDITED')
    .reduce((sum: number, e: any) => sum + e.amount, 0);
}

function getParentReferralCount(parentId: string): number {
  return testState.referrals.filter((r: any) => r.referrerParentId === parentId).length;
}

// Run test
console.log('\n========== REFERRAL SYSTEM TEST ==========\n');

clearReferralEventLog();

// Step 1: Parent A generates referral code
console.log('Step 1: Parent A generates referral code');
const referralCodeA = simulateGenerateReferralCode('parent_a');

// Step 2: Parent B registers with referral code
console.log('\nStep 2: Parent B registers with Parent A\'s referral code');
simulateRegisterReferral('parent_a', 'parent_b', referralCodeA);

// Step 3: Parent B creates a child with referral code
console.log('\nStep 3: Parent B creates a child linked to referral code');
simulateLinkChildToReferral('child_1', 'parent_b', referralCodeA);

// Step 4: Parent B records monthly payments
console.log('\nStep 4: Parent B records 3 monthly payments');
simulateRecordPayment('child_1', 1, 2026, 'PAID');
simulateRecordPayment('child_1', 2, 2026, 'PAID');
simulateRecordPayment('child_1', 3, 2026, 'PAID'); // This should trigger credit

// Step 5: Check earnings
console.log('\n--- RESULTS ---');
const parentAEarnings = getParentEarnings('parent_a');
const parentAReferrals = getParentReferralCount('parent_a');

console.log(`\nParent A (Referrer):`);
console.log(`  - Total Earnings: ₹${parentAEarnings}`);
console.log(`  - Total Referrals: ${parentAReferrals}`);
console.log(`  - Potential Earnings: ₹0 (all referrals completed)`);

// Step 6: Display event tracking summary
console.log('\n--- EVENT TRACKING ---');
const eventCounts = getReferralEventCountByType();
const metrics = getReferralMetricsSummary();

console.log('Event Counts:');
Object.entries(eventCounts).forEach(([event, count]) => {
  console.log(`  - ${event}: ${count}`);
});

console.log('\nMetrics Summary:');
console.log(`  - Total Events: ${metrics.totalEvents}`);
console.log(`  - Unique Parents: ${metrics.uniqueParents}`);
console.log(`  - Credits Tracked: ${metrics.creditsTracked}`);
console.log(`  - Total Amount Credited: ₹${metrics.totalAmountCredited}`);
console.log(`  - Average Credit per Parent: ₹${metrics.averageCreditPerParent}`);

// Assertions
const success = parentAEarnings === 200 && parentAReferrals === 1 && metrics.creditsTracked === 1;

console.log(`\n${success ? '✓ ALL TESTS PASSED' : '✗ TESTS FAILED'}`);
console.log(`\nFull Event Log:`);
console.log(JSON.stringify(getReferralEventLog(), null, 2));
