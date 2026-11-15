# Build Roadmap: From Wedge to Ownership Ladder

## Phase 0: THE WEDGE (Trial 0-1) — NOW
**Goal:** Prove tracking works. Get 70%+ family join rate, 60%+ active by week 3.

### Minimum Features (Already Built or Coded)
- ✅ Phone sign-in
- ✅ Driver setup (name, consent, referral)
- ✅ Create route (location + school)
- ✅ Add family (phone, fee, home pin)
- ✅ Run a trip (start, next-step button, location every 10s)
- ✅ Fees (mark paid, see unpaid)
- ✅ WhatsApp invites
- ✅ Map (real-time van location)
- ✅ Alerts (5-min "van coming")
- ✅ Consent + delete my data

### Code to Ship This Week
1. Supabase + SMS (USER ACTION: create project, apply migrations)
2. Deploy to real URL (Cloudflare Pages)
3. Test on Dad's phone (map, location, alerts)
4. Sit with Dad, onboard 5 families

### Metrics to Track
- Families invited: 15
- Families joined: 10 (67%)
- Families active day 7: 8 (80%)
- Dad's calls/day: baseline vs trial

### UI/Dashboard for This Phase
```
Driver Home:
├─ Hi [Name] | Status: PENDING/VERIFIED
├─ This Week
│  ├─ 2 runs
│  └─ 8 families
├─ Your Routes
│  └─ [School] Run
│     ├─ 8 families (7 joined, 1 pending)
│     ├─ New route | Invite a driver | Join with code
│     └─ Start morning run / afternoon run
└─ Account | Switch to parent | Sign out

Parent Home:
├─ Map with van + home pin
├─ Child cards: "On the van" / "Van coming 4min" / "Home"
├─ Add child
├─ Account
└─ Privacy

Admin:
├─ Verify drivers (list, approve/reject)
├─ Waitlist
└─ Problems
```

**Success Criteria:** Dad's 5 families all see van tracking, get alerts, no calls needed.

---

## Phase 1: VISIBILITY (Trial 1+, Week 2-3)
**Goal:** Show drivers the path. Make success metrics visible.

### New Features
- [ ] Driver dashboard redesign:
  - "This week: 8 families, ₹1,200 collected"
  - "Time saved: 240 minutes (not on calls)"
  - "You invited 3 drivers, 2 joined"
  - Progress bar: "35% to next level (Owner)" — [Get a Loan]
- [ ] Month-over-month chart: earnings trend
- [ ] Leaderboard: top 10 drivers this week (families, earnings, invites)
- [ ] Status badges: Level 0 "Driver", Level 1 "Owner" (coming soon)
- [ ] Success story modal: "Rajesh started with 1 route. Now he has 2 routes and earns ₹150k/month."
  - Trigger: show to any driver who qualifies
  - CTA: [See how]

### Code Changes (Small)
1. Add summary metrics component to DriverHome
2. Add leaderboard view (read-only query)
3. Add modal for success stories
4. Track new fields: total_families_ever, total_invites_sent, total_earnings_month
5. Add tier calculation: "Driver" if 1 route, "Owner" if 2+ routes or loan active

### Database (Supabase)
```sql
-- Add to drivers table:
ALTER TABLE drivers ADD COLUMN tier TEXT DEFAULT 'DRIVER'; -- 'DRIVER' | 'OWNER' | 'FLEET'
ALTER TABLE drivers ADD COLUMN earnings_this_month INT DEFAULT 0;
ALTER TABLE drivers ADD COLUMN families_served INT DEFAULT 0;
ALTER TABLE drivers ADD COLUMN drivers_invited INT DEFAULT 0;
```

**Success Criteria:** By day 10 of Trial 1, at least 1 driver says "I want to take a loan and get a second route."

---

## Phase 2: ENABLEMENT (Trial 2, Week 4+)
**Goal:** Let drivers take the first step: hire someone or get a loan.

### New Features
- [ ] Loan product page:
  - Input: van cost (₹3L-8L), down payment saved
  - Calculate: "Loan ₹X. Monthly payment ₹Y. Net income ₹Z."
  - Button: [Apply for Loan]
  - Status: PENDING, APPROVED, ACTIVE, PAID_OFF
- [ ] Hire a driver:
  - Post: "Afternoon route, ₹12k/month"
  - Candidates: list of drivers marked "Available for hire"
  - Hire: invite via WhatsApp, in-app confirmation
- [ ] Route 2 setup:
  - Same as create route (school, location)
  - Link to hiring: "Need a driver for this route? [Post a job]"
- [ ] Parent referral earnings:
  - "Invite parents and earn ₹200 when they pay 3 months."
  - Show: "₹400 earned so far (2 families referred)"
  - CTA: "Invite more families" [Share WhatsApp link]

### Code Changes (Medium)
1. Loans table: id, driver_id, amount, monthly_payment, status, created_at, approved_at
2. Jobs table: id, owner_id, route_id, title, pay_per_month, status, hired_driver_id
3. Parent referral earnings table: id, referrer_id, referred_parent_id, status, amount
4. Loan approval form (admin dashboard)
5. Hire a driver UI (driver home: "My team")

### UX Flow
```
Driver sees: "Next Level: Owner"
    ↓ [Tap]
    ↓ [Show: "Buy a van. ₹5L loan, ₹18k/month"]
    ↓ [Tap: Get a Loan]
    ↓ [Form: Van cost? Down payment? Route details?]
    ↓ [Submit]
    ↓ [Status: PENDING (Ashwa reviewing)]
    ↓ [Next day: APPROVED]
    ↓ [CTA: Visit dealer, pick van]
    ↓ [Dealer confirms purchase, Ashwa pays NBFC]
    ↓ [Driver gets: van title, loan tracking page]
    ↓ [Loan page shows: "You owe ₹4.9L. Payment ₹18k due next [date]"]
    ↓ [Auto-deduction from trip revenue]
```

### Parent Referral Flow
```
Parent sees: "Invite parents & earn ₹200"
    ↓ [Tap]
    ↓ [WhatsApp: "Hi! Try Ashwa. I can see my kid's van. https://..."]
    ↓ [Friend joins, pays 3 months]
    ↓ [Parent notified: "Earned ₹200! Invite more."]
    ↓ [3 referrals → "Family Advocate" badge]
```

**Success Criteria:** First driver takes a loan, buys a van, hires someone by week 8.

---

## Phase 3: SCALING THE LADDER (Weeks 8-12)
**Goal:** Operators manage multiple routes, multiple drivers.

### New Features
- [ ] Fleet operator dashboard:
  - "My routes: 3 | My drivers: 6 | Families: 45 | Earnings this month: ₹180k"
  - Per-route view: "School Route. Earnings ₹4.2k. Driver: Rajesh. Status: Active"
  - Per-driver view: "Rajesh. Assigned to 2 routes. Earnings: ₹2.1k/month. Status: Active"
- [ ] Payroll automation:
  - "Auto-pay drivers ₹[X] on [day] from trip revenue"
  - Driver sees income in their account
- [ ] Waitlist automation:
  - When new route created for school, WhatsApp all waitlist families
  - "New van for Bluebells! Join here: [link]"
- [ ] School partnership interest form:
  - "Expand to Bluebells School. 50 families on waitlist."
  - Loan: ₹15L. Revenue potential: ₹500k/month.
  - [I'm interested]

### Code Changes (Large)
1. Multi-route queries, aggregations
2. Payroll scheduler (cron job)
3. Driver management views
4. School partnership interest form
5. Waitlist → new route automation

**Success Criteria:** At least 2 fleet operators managing 3+ routes each.

---

## Phase 4: VIRAL GROWTH (Month 3+)
**Goal:** Success stories drive organic growth.

### New Features
- [ ] Public "Success Stories" (in app, sharable on social):
  - Video/text: "Rajesh earned ₹150k in month 6. Here's how."
  - Breakdown: routes, drivers, families, loan journey
  - CTA: "You could do this too. [Start now]"
- [ ] Leaderboard badges:
  - "Top driver this week"
  - "Fastest to ownership"
  - "Most families referred"
  - Badges shared on WhatsApp
- [ ] Invitations with tier hints:
  - "Join Ashwa. Dad [driver] now earns ₹75k/month and [hired 2 drivers]."
- [ ] School partnerships as product:
  - Ashwa contacts schools: "Your vans are on our app. 80% parent satisfaction."
  - Schools pay Ashwa ₹5k/month per route for admin features
  - Drivers get free premium features

### Revenue Streams (Optional Monetization)
1. Loan interest: 2% of ₹[loan amount]
2. School subscriptions: ₹5k/route/month
3. Fleet operator premium: ₹500/month (advanced analytics)
4. Parent referral commission: ₹200 per family (already built)

**Success Criteria:** 50%+ of new drivers cite a success story as reason they joined.

---

## Timeline

| Phase | Duration | Key Metric | Blockers |
|-------|----------|-----------|----------|
| **0: Wedge** | 1-2 weeks | 70% family join rate | Supabase SMS, real phone |
| **1: Visibility** | 1 week (after Trial 1 data) | 1st "I want a loan" message | None (UI only) |
| **2: Enablement** | 2 weeks | 1st loan approved | Loan approval process |
| **3: Scaling** | 3-4 weeks | 2+ fleet operators | Multi-route logic, payroll |
| **4: Viral** | Ongoing | 50% success story attribution | Content creation |

---

## What to Build This Week

### Must-Haves (Before sitting with Dad)
1. Supabase setup + SMS (USER)
2. Deploy to live URL (YOU)
3. Test map on Dad's phone (YOU + DAD)
4. Sit with Dad, onboard 5 families (YOU + DAD)

### Nice-to-Have (After Trial 0 data)
1. Earnings chart on driver home
2. "Drivers invited" counter
3. Time saved metric
4. Leaderboard (mock data if <5 drivers)

**These take 3-4 hours of coding and don't block Trial 0.**

---

## Summary: The Path Forward

1. **Ship the wedge** (this week) → Prove tracking works
2. **Show the path** (week 2) → Make success visible
3. **Enable the climb** (week 3-4) → Loans + hiring
4. **Scale it** (week 5-8) → Fleet operators
5. **Go viral** (ongoing) → Success stories

**North Star:** In 12 months, 100+ drivers have moved from "driving one route" to "running multiple routes with hired drivers." That's geometric growth. That's the thesis.
