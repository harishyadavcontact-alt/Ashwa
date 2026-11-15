# Ashwa Hiring System - Quick Start Guide

Get the hiring system running in 2 minutes.

## Prerequisites

- Node.js 18+
- Two browser windows or devices (for 2-driver demo)

## Installation

```bash
cd Ashwa/apps/mobile-driver-expo
npm install
npm run dev
```

Visit: `http://localhost:5173`

## Quick Test (5 min)

### Step 1: Sign in as Driver A

```
Email: drivera@ashwa.app
Password: Password123
```

After onboarding → Click [Trip Dashboard]

### Step 2: Access Hiring System

**Trip Dashboard** → [Hiring System]

You now see:
- [Post New Job]
- [Browse Available Jobs]
- [My Team] (empty)
- [Payroll] (empty)

### Step 3: Post a Job

1. [Post New Job]
2. Select Route: **"School A - Morning North - 07:00 AM"**
3. Enter Pay: **14500**
4. [Post Job]

✅ Status: "Job posted successfully!"

Screen shows: "Posted Jobs (1)"

### Step 4: Sign in as Driver B (New Window)

Open browser in **private/incognito mode** or new window:

```
Email: driverb@ashwa.app
Password: Password123
```

→ [Trip Dashboard] → [Hiring System]

### Step 5: Driver B Applies

1. [Browse Available Jobs]
2. See: "School A - 07:00 AM - ₹14500/month"
   - Posted by: Driver A
3. [Apply Now]

✅ Status shows WhatsApp message:

```
"Hi Driver A, I'm interested in your ₹14500 School A 07:00 AM job. - Driver B"
```

### Step 6: Check WhatsApp Log

Switch back to Driver A window.  
Open Browser DevTools → Console:

```javascript
JSON.parse(localStorage.getItem('ashwa.whatsapp.demo'))
```

See:
```json
[{
  "to": "+919876543200",
  "message": "Hi Driver A, I'm interested...",
  "timestamp": "2024-11-16T10:30:00.000Z"
}]
```

### Step 7: Hire Driver B (Manual Step)

Go back to Driver A's [Hiring System]:

In Browser Console, paste:

```javascript
const jobs = JSON.parse(localStorage.getItem('ashwa.jobs'));
if (jobs && jobs.length) {
  jobs[0].status = 'HIRED';
  jobs[0].hiredDriverId = 'driverb@ashwa.app';
  jobs[0].hiredDriverName = 'Driver B';
  localStorage.setItem('ashwa.jobs', JSON.stringify(jobs));
  location.reload();
}
```

Then click [My Team]:

✅ See: "Driver B" with ₹14500/month

### Step 8: Process Payroll

1. [Payroll]
2. [Process Monthly Payroll]

✅ Status: "Payroll calculated for this month!"

See:
- Driver: Driver B
- Month: 2024-11
- Amount: ₹14500
- Status: PENDING

### Mark as Paid

In Console:

```javascript
const payroll = JSON.parse(localStorage.getItem('ashwa.payroll'));
if (payroll && payroll.length) {
  payroll[0].status = 'PAID';
  payroll[0].paid_at = new Date().toISOString();
  localStorage.setItem('ashwa.payroll', JSON.stringify(payroll));
  location.reload();
}
```

Then refresh [Payroll]:

✅ Status: PAID ✓

---

## What Works

| Feature | Status |
|---------|--------|
| Post Job | ✅ Full |
| Browse Jobs | ✅ Full |
| Apply (WhatsApp) | ✅ Full |
| My Team | ✅ Full |
| Payroll Calc | ✅ Full |
| Data Persist | ✅ localStorage |

## What Needs Production

| Feature | Demo | Production |
|---------|------|-----------|
| WhatsApp | 📝 Logged | 📱 Twilio API |
| Auto-hire | 🖥️ Manual | ✅ One-click |
| Earnings | ₹0 | 💰 From trips |
| Deduction | 📝 Manual | ⚙️ Auto 15th |
| Sync | 🔄 None | ☁️ Supabase |

---

## Troubleshooting

### Job not appearing?
- Check localStorage: `localStorage.getItem('ashwa.jobs')`
- Refresh page

### WhatsApp message not logged?
- Check console: `JSON.parse(localStorage.getItem('ashwa.whatsapp.demo'))`
- Make sure you clicked [Apply Now]

### Data disappeared?
- Check browser privacy/incognito mode
- Try same window, different driver

### Can't hire driver?
- Use manual console step from Step 7
- Or implement UI in production

---

## Key Files

| File | Purpose |
|------|---------|
| `Ashwa/apps/mobile-driver-expo/src/App.tsx` | 5 hiring screens |
| `Ashwa/packages/shared/src/index.ts` | Data types |
| `Ashwa/docs/hiring-system.md` | Full spec |
| `Ashwa/docs/hiring-system-demo.md` | Test scenarios |

---

## Demo Data Structure

### Jobs
```javascript
{
  id: "abc123",
  ownerId: "drivera@ashwa.app",
  route: { school: "School A", time: "07:00 AM", ... },
  payPerMonth: 14500,
  status: "OPEN" // or "HIRED"
}
```

### Applications
```javascript
{
  jobId: "abc123",
  driverId: "driverb@ashwa.app",
  driverName: "Driver B",
  appliedAt: "2024-11-16T10:00:00Z"
}
```

### Team
```javascript
{
  id: "driverb@ashwa.app",
  name: "Driver B",
  route: { school: "School A", ... },
  monthlyPay: 14500,
  earningsThisMonth: 0,
  status: "ACTIVE"
}
```

### Payroll
```javascript
{
  driverId: "driverb@ashwa.app",
  month: "2024-11",
  amount: 14500,
  status: "PENDING" // or "PAID"
}
```

---

## LocalStorage Keys

Clear all demo data:
```javascript
[
  'ashwa.jobs',
  'ashwa.job_applications',
  'ashwa.team',
  'ashwa.payroll',
  'ashwa.whatsapp.demo'
].forEach(k => localStorage.removeItem(k))
```

---

## Next

- See `HIRING_SYSTEM_SUMMARY.md` for full overview
- See `docs/hiring-system.md` for production details
- See `docs/hiring-system-demo.md` for more test scenarios

---

**Time to Run Demo**: 5-10 minutes  
**Difficulty**: Easy  
**No Backend Needed**: ✅ Works locally  
**Status**: ✅ Ready for testing
