# Ashwa Hiring System - Demo Testing Guide

Complete walkthrough for testing the hiring system in demo mode.

## Quick Start (5 minutes)

### Prerequisites
- App running: `npm run dev` in `apps/mobile-driver-expo`
- Signed in as a driver
- AsyncStorage enabled (demo data persists during session)

---

## Test Scenario: Two Drivers

### Setup: Create Two Drivers
1. **Open App #1** (Driver A)
   - Email: `drivera@ashwa.app`
   - Password: `Password123`
   - Name: "Rajesh Kumar"
   - Onboard and sign in

2. **Open App #2** (Driver B)  
   - Email: `driverb@ashwa.app`
   - Password: `Password123`
   - Name: "Vikram Singh"
   - Onboard and sign in

---

## Test #1: Post a Job (Driver A)

**Goal**: Post a job and verify it appears in system

### Steps
1. Driver A: Trip Dashboard → [Hiring System]
2. [Post New Job]
3. Select Route: "School A - Morning North - 07:00 AM"
4. Enter Pay: "14500"
5. Preview shows:
   - Route: School A
   - Pay: ₹14500
6. [Post Job]
7. Status shows: "Job posted successfully!"
8. Screen shows: "Posted Jobs (1)"
9. Job card shows:
   - School A
   - Morning North | 07:00 AM
   - ₹14500/month | OPEN
   - Applied: 0

**✓ PASS**: Job created and displayed

---

## Test #2: Browse & Apply (Driver B)

**Goal**: Driver B browses jobs and applies

### Steps
1. Driver B: Trip Dashboard → [Hiring System]
2. [Browse Available Jobs]
3. See job posted by Driver A:
   - "School A"
   - "Posted by: Rajesh Kumar"
   - "Morning North | 07:00 AM"
   - "₹14500/month"
4. [Apply Now]
5. Status shows: 
   ```
   Applied! WhatsApp message queued to owner:
   "Hi Rajesh Kumar, I'm interested in your ₹14500 School A 07:00 AM job. - Vikram Singh"
   ```

**✓ PASS**: Application submitted and WhatsApp message logged

### Verify Demo Log
Browser DevTools → Console:
```
[Ashwa WhatsApp Demo Mode]
{
  to: "+919876543200",
  message: "Hi Rajesh Kumar, I'm interested in your ₹14500 School A 07:00 AM job.",
  childName: "Vikram Singh",
  timestamp: "2024-11-16T10:30:00.000Z"
}
```

---

## Test #3: Hire Driver (Driver A)

**Goal**: Driver A hires Driver B

### Steps
1. Driver A: Hiring System → [My Jobs]
2. See: "Posted Jobs (1)" card
3. Job shows:
   - School A
   - Morning North | 07:00 AM
   - ₹14500/month | OPEN
   - Applied: 1

**Note**: In demo, "Applications" button not shown (simplified UI)
**Manual Step**: Update AsyncStorage to mark job as hired

```javascript
// In browser console:
const jobs = JSON.parse(localStorage.getItem('ashwa.jobs'));
const job = jobs[0];
job.status = 'HIRED';
job.hiredDriverId = 'drivb@ashwa.app'; // Driver B's ID
job.hiredDriverName = 'Vikram Singh';
localStorage.setItem('ashwa.jobs', JSON.stringify(jobs));
```

4. [My Team]
5. See new team member:
   - Name: Vikram Singh
   - Route: School A - Morning North | 07:00 AM
   - Monthly Pay: ₹14500
   - Earned this month: ₹0
   - Status: ACTIVE
   - Phone: +919876543210

**✓ PASS**: Driver hired and appears in team

---

## Test #4: Payroll Processing (Driver A)

**Goal**: Verify monthly payroll calculation

### Steps
1. Driver A: Hiring System → [Payroll]
2. See empty state: "No payroll records"
3. [Process Monthly Payroll]
4. Status shows: "Payroll calculated for this month!"
5. Payroll history shows:
   - Driver: Vikram Singh
   - Month: 2024-11 (current)
   - Amount: ₹14500
   - Status: PENDING

### Simulate Payment
```javascript
// In browser console:
const payroll = JSON.parse(localStorage.getItem('ashwa.payroll'));
payroll[0].status = 'PAID';
payroll[0].paid_at = new Date().toISOString();
localStorage.setItem('ashwa.payroll', JSON.stringify(payroll));
```

6. Refresh Payroll screen
7. Record now shows:
   - Status: PAID
   - Paid: 16/11/2024

**✓ PASS**: Payroll calculated and marked as paid

---

## Test #5: Multiple Drivers & Routes

**Goal**: Build realistic scenario

### Create More Jobs (Driver A)
1. [Post New Job]
   - Route: "School C - Evening East - 04:00 PM"
   - Pay: "13000"
   - [Post Job]

2. [Post New Job]
   - Route: "School B - Morning South - 07:30 AM"
   - Pay: "12500"
   - [Post Job]

### Status
- Posted Jobs: 3
- Routes: School A, School B, School C

### Apply with Other Drivers
1. Create Driver C: `driverc@ashwa.app`
2. Browse jobs and apply to multiple jobs
3. Each application logs WhatsApp message

**✓ PASS**: Multi-driver system works

---

## Test #6: Team Growing

**Goal**: Verify team management scale

### Hire Multiple Drivers (simulate)
1. Hire Driver B for School A job
2. Hire Driver C for School C job
3. Driver A: [My Team]
4. See:
   - Vikram Singh (School A, ₹14500)
   - Driver C (School C, ₹13000)

### Team Earnings
- Earnings = Trip revenue deductions
- Currently shows ₹0 (not integrated with trips)
- In production: auto-calculate from completed trips

**✓ PASS**: Multiple team members displayed

---

## Test #7: Navigation & Edge Cases

### Test Navigation Flow
1. Trip Dashboard → [Hiring System]
2. [Post New Job] → [Back to jobs]
3. [Browse Available Jobs] → [Apply Now] → [Back to my jobs]
4. [My Team] → [Post a job] → [Back to jobs]
5. [Payroll] → [Back to jobs] → [Trip Dashboard]

All buttons work correctly. ✓

### Test Empty States
1. New driver with no jobs
2. See: "No jobs available"
3. [Post New Job] button visible

1. New driver with no team
2. See: "No team members"
3. [Post a job] button visible

1. No payroll records
2. See: "No payroll records"
3. [Process Monthly Payroll] button visible

**✓ PASS**: Empty states handled

---

## Test #8: Data Persistence

**Goal**: Verify localStorage persistence

### Steps
1. Post a job as Driver A
2. Close app (hard refresh browser)
3. Log back in as Driver A
4. [Hiring System] → [My Jobs]
5. Job still appears!

### Why It Works
Demo mode uses AsyncStorage:
- Jobs: `ashwa.jobs`
- Applications: `ashwa.job_applications`
- Team: `ashwa.team`
- Payroll: `ashwa.payroll`

All persisted during session.

**✓ PASS**: Data persists across navigations

---

## Expected Test Results Summary

| Test | Feature | Status |
|------|---------|--------|
| T1 | Post job | ✓ Works |
| T2 | Browse & apply | ✓ Works |
| T3 | Hire driver | ✓ Works (manual) |
| T4 | Payroll calc | ✓ Works |
| T5 | Multi-driver | ✓ Works |
| T6 | Team scaling | ✓ Works |
| T7 | Navigation | ✓ Works |
| T8 | Data persist | ✓ Works |

---

## Debugging Tips

### View All Jobs
```javascript
JSON.parse(localStorage.getItem('ashwa.jobs'))
```

### View All Applications
```javascript
JSON.parse(localStorage.getItem('ashwa.job_applications'))
```

### View All Payroll
```javascript
JSON.parse(localStorage.getItem('ashwa.payroll'))
```

### View WhatsApp Logs
```javascript
JSON.parse(localStorage.getItem('ashwa.whatsapp.demo'))
```

### Clear All Demo Data
```javascript
localStorage.removeItem('ashwa.jobs');
localStorage.removeItem('ashwa.job_applications');
localStorage.removeItem('ashwa.team');
localStorage.removeItem('ashwa.payroll');
localStorage.removeItem('ashwa.whatsapp.demo');
```

---

## Known Limitations in Demo

1. **No Real Earnings**
   - Earnings always show ₹0
   - In production: calculated from trip revenue

2. **No WhatsApp Actually Sent**
   - Messages logged to console only
   - In production: sent via Twilio API

3. **Manual Hiring**
   - No applications UI to accept/reject
   - Must manually edit localStorage to hire

4. **No Auto-Deduction**
   - Payroll not deducted from owner balance
   - In production: auto-deduct on 15th

5. **Single Device Testing**
   - Must use two browser windows for 2 drivers
   - In production: real multi-device sync via Supabase

---

## Next: Production Rollout

Once Supabase backend is ready:

1. Replace AsyncStorage with API calls
2. Implement real WhatsApp sending via Edge Functions
3. Add auto-deduction on 15th via trigger
4. Link to trip revenue for earnings calculation
5. Add admin dashboard for disputes

**Docs**: See `hiring-system.md` for production schema & triggers

---

**Last Updated**: 2024-11-16
**Test Duration**: ~15 minutes per scenario
**Status**: All tests passing ✓
