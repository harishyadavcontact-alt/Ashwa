# Ashwa Parent Referral Earnings System

## Overview

Complete implementation of a parent referral earnings system where:
- Parents earn **₹200** when a referred parent completes **3 months of PAID subscription**
- Auto-credit happens when the 3rd month payment reaches PAID status
- Earnings are tracked and displayed in the mobile app

## Implementation Components

### 1. Database Models (Prisma)

Three new tables added to track referrals and earnings:

#### `ParentReferral`
```prisma
model ParentReferral {
  id                String   @id @default(cuid())
  referrerParentId  String   // Parent who shared the code
  referredParentId  String   // Parent who used the code
  referralCode      String   @unique
  status            String   @default("ACTIVE")
  createdAt         DateTime @default(now())
}
```

#### `PaymentRecord`
```prisma
model PaymentRecord {
  id        String        @id @default(cuid())
  childId   String
  month     Int
  year      Int
  amount    Int           @default(0)
  status    PaymentStatus @default(PENDING)  // PENDING, PAID, FAILED
  paidAt    DateTime?
  createdAt DateTime      @default(now())
}
```

#### `ParentReferralEarnings`
```prisma
model ParentReferralEarnings {
  id               String  @id @default(cuid())
  parentId         String  // Referrer earning
  referredParentId String  // Parent who was referred
  referralId       String
  amount           Int     @default(200)
  month            Int
  year             Int
  status           String  @default("CREDITED")
  createdAt        DateTime @default(now())
}
```

### 2. Backend Service (NestJS)

**Location:** `src/referrals/referrals.service.ts`

Core methods:
- `generateReferralCode(parentId)` - Generate unique code for a parent
- `registerReferral(referrerParentId, referredParentId, referralCode)` - Link parents via referral
- `linkChildToReferral(childId, referralCode)` - Attach referral code to child
- `recordPayment(childId, month, year, amount, status)` - Track monthly payments and trigger auto-credit
- `getParentReferralStats(parentId)` - Get complete referral summary
- `getMyReferralEarnings(parentId)` - Get total earned amount

### 3. REST API Endpoints

**Base Path:** `/referrals`

#### GET `/code`
Get parent's referral code (generates if doesn't exist)
```json
{
  "referralCode": "ABC12345"
}
```

#### POST `/register`
Register parent as referred (parent calls with referrer's code)
```json
{
  "referralCode": "ABC12345"
}
```

#### POST `/link-child`
Link child to referral code
```json
{
  "childId": "child_123",
  "referralCode": "ABC12345"
}
```

#### POST `/record-payment`
Record monthly payment (triggers auto-credit on month 3)
```json
{
  "childId": "child_123",
  "month": 3,
  "year": 2026,
  "amount": 0,
  "status": "PAID"
}
```

#### GET `/stats`
Get referral stats for authenticated parent
```json
{
  "referralCode": "ABC12345",
  "totalReferrals": 5,
  "totalEarnings": 600,
  "potentialEarnings": 200,
  "referrals": [
    {
      "id": "ref_123",
      "referralCode": "ABC12345",
      "referredParentId": "parent_456",
      "referredParentName": "John Doe",
      "status": "COMPLETED",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "earnedHistory": [
    {
      "id": "earn_123",
      "referredParentId": "parent_456",
      "referredParentName": "John Doe",
      "amount": 200,
      "month": 3,
      "year": 2026,
      "status": "CREDITED",
      "createdAt": "2026-03-15T10:00:00Z"
    }
  ]
}
```

#### GET `/earnings`
Get total earnings for authenticated parent
```json
{
  "totalEarnings": 600
}
```

### 4. Mobile App Integration

**Files Updated:**
- `src/api.ts` - Added referral API methods
- `src/App.tsx` - Added UI screens and earnings display

#### New Screens
- **Referrals Screen** - Shows referral code, total earnings, and referral list
- **Earnings Display** - Added to home screen showing current earnings

#### API Methods Added
```typescript
api.getReferralCode(token)
api.registerWithReferral(token, referralCode)
api.linkChildToReferral(childId, referralCode)
api.recordPayment(token, childId, month, year, amount, status)
api.getReferralStats(token)
api.getMyReferralEarnings(token)
```

### 5. Event Tracking (extras.ts)

**Location:** `src/referrals/extras.ts`

Event tracking functions for measurement:
- `trackReferralEvent()` - Generic event tracker
- `trackReferralRegistered()` - When referral is established
- `trackChildLinkedToReferral()` - When child is linked to referral code
- `trackPaymentRecorded()` - When payment is recorded
- `trackReferralEarningsCredited()` - **When ₹200 is auto-credited**

Example tracking output:
```
[REFERRAL_EVENT] referral_earnings_credited: {
  parentId: "parent_a",
  referredParentId: "parent_b",
  amount: 200,
  month: 3,
  year: 2026,
  timestamp: "2026-03-15T10:00:00Z"
}
```

## Workflow

### Scenario: Parent A refers Parent B

1. **Parent A generates code:**
   ```
   GET /referrals/code
   → Returns: "ABC12345"
   ```

2. **Parent B uses referral code during signup:**
   ```
   POST /referrals/register
   Body: { referralCode: "ABC12345" }
   ```
   Event: `referral_registered`

3. **Parent B creates child with referral:**
   ```
   POST /referrals/link-child
   Body: { childId: "child_1", referralCode: "ABC12345" }
   ```
   Event: `child_linked_to_referral`

4. **Parent B records payment Month 1:**
   ```
   POST /referrals/record-payment
   Body: { childId: "child_1", month: 1, year: 2026, status: "PAID" }
   ```
   Events: `payment_recorded` (no credit yet, only 1/3 months)

5. **Parent B records payment Month 2:**
   ```
   POST /referrals/record-payment
   Body: { childId: "child_1", month: 2, year: 2026, status: "PAID" }
   ```
   Events: `payment_recorded` (still waiting, 2/3 months)

6. **Parent B records payment Month 3:** ✓ AUTO-CREDIT TRIGGERED
   ```
   POST /referrals/record-payment
   Body: { childId: "child_1", month: 3, year: 2026, status: "PAID" }
   ```
   Events: `payment_recorded`, then **`referral_earnings_credited`**
   - Row inserted in `ParentReferralEarnings` table
   - Parent A's earnings increased by ₹200

7. **Parent A checks earnings:**
   ```
   GET /referrals/earnings
   → Returns: { totalEarnings: 200 }

   GET /referrals/stats
   → Returns: {
       referralCode: "ABC12345",
       totalReferrals: 1,
       totalEarnings: 200,
       potentialEarnings: 0,
       referrals: [...],
       earnedHistory: [...]
     }
   ```

## Testing

### Run Test
```bash
npm run test:build
npm test
```

The test file (`test/referral-system.spec.ts`) simulates:
1. Generating referral code
2. Registering referral
3. Linking child to referral
4. Recording 3 monthly payments
5. Verifying ₹200 credit
6. Checking event tracking

### Test Scenarios
- ✓ Referral code generation
- ✓ Referral registration
- ✓ Child linking to referral code
- ✓ Payment recording
- ✓ Auto-credit on 3rd paid month
- ✓ Event tracking accuracy
- ✓ Earnings calculation

## Database Migration

```bash
cd services/backend-nest
npm run prisma:migrate
```

Migration creates:
- `ParentReferral` table with foreign keys
- `PaymentRecord` table with unique constraint on (childId, month, year)
- `ParentReferralEarnings` table with unique constraint on (referralId, month, year)
- Indexes for performance

## Schema Changes

### ParentProfile
Added:
```prisma
referralCode String? @unique
referrerReferrals ParentReferral[]
referredReferrals ParentReferral[]
earningsAsReferrer ParentReferralEarnings[]
earningsAsReferred ParentReferralEarnings[]
```

### Child
Added:
```prisma
referralCode String?
paymentRecords PaymentRecord[]
```

## Shared Types

New types in `@ashwa/shared`:
- `PaymentStatus` enum: PENDING | PAID | FAILED
- `ReferralSummary` - Info about a single referral
- `ReferralEarnings` - Individual earning record
- `ParentReferralStats` - Complete stats for a parent
- `PaymentRecordInput` - Schema for payment recording

## Frontend Features

### Home Screen
- New card showing "Referral earnings" with total earned
- Button to view detailed referral info
- "Earnings" button in actions menu

### Referrals Screen
- Display parent's unique referral code (with copy button)
- Total earnings display with potential earnings
- List of all referrals with payment status
- Live update when new referral completes month 3

## Measurement & Analytics

All referral events tracked:
1. `referral_registered` - Parent uses referral code
2. `child_linked_to_referral` - Child connected to referral
3. `payment_recorded` - Monthly payment recorded
4. `referral_earnings_credited` - ₹200 credited (KEY EVENT)

Access metrics:
```typescript
import { getReferralMetricsSummary } from './extras';

const metrics = getReferralMetricsSummary();
// {
//   totalEvents: 15,
//   uniqueParents: 5,
//   eventCounts: { referral_registered: 5, ... },
//   creditsTracked: 3,
//   totalAmountCredited: 600,
//   averageCreditPerParent: 120
// }
```

## Deployment

1. **Update schema**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

2. **Restart backend**
   ```bash
   npm run dev
   ```

3. **Mobile app auto-updates** with new API calls

4. **Monitor events**
   - Track `referral_earnings_credited` events for conversions
   - Monitor `totalEarnings` distribution

## Files Modified/Created

### Created
- `src/referrals/referrals.service.ts` - Core business logic
- `src/referrals/referrals.controller.ts` - REST endpoints
- `src/referrals/referrals.module.ts` - NestJS module
- `src/referrals/extras.ts` - Event tracking
- `prisma/migrations/add_referral_system/migration.sql` - DB migration
- `test/referral-system.spec.ts` - Integration test

### Modified
- `prisma/schema.prisma` - Added 3 new tables + relationships
- `src/app.module.ts` - Imported ReferralsModule
- `apps/mobile-parent-expo/src/api.ts` - Added referral methods
- `apps/mobile-parent-expo/src/App.tsx` - Added UI + earnings display
- `packages/shared/src/index.ts` - Added types

## Next Steps

1. **Withdraw**: When referrer wants to cash out earnings
2. **Recalculate**: Handle payment reversals
3. **Leaderboard**: Show top referrers
4. **Bonuses**: Multi-tier referral rewards
5. **SMS/Email**: Notify on credit received
6. **Analytics**: Dashboard for referral metrics

## Verification Checklist

- [x] Database schema created
- [x] Service methods implement auto-credit logic
- [x] API endpoints secured with JWT auth
- [x] Mobile app shows earnings
- [x] Event tracking implemented
- [x] Payment trigger at month 3
- [x] Unique constraints prevent double-credit
- [x] Test coverage for full workflow
- [x] Migration file ready for deployment

## Support

For implementation details, see:
- Service: `src/referrals/referrals.service.ts`
- Controller: `src/referrals/referrals.controller.ts`
- Test: `test/referral-system.spec.ts`
- Mobile UI: `apps/mobile-parent-expo/src/App.tsx`
