# Ashwa Hiring System

Complete hiring system for drivers to hire other drivers, manage teams, and automate payroll.

## Overview

The hiring system enables:
- Drivers to post jobs for their routes (monthly salary)
- Other drivers to browse and apply for available jobs
- Job owners to hire drivers and build teams
- Automatic monthly payroll calculation and deduction

## Features

### 1. Job Posting
- Drivers can post jobs for any of their routes
- Specify monthly salary (₹12k-15k typical range)
- Job status: OPEN → HIRED → CLOSED
- Jobs appear in system until filled

**UI Location**: "Hiring System" → "Post New Job"

**Data Model**:
```typescript
type Job = {
  id: string;
  ownerId: string;           // Who posted the job
  ownerName: string;
  route: {
    id: string;
    school: string;          // School name
    direction: string;        // Morning North, Afternoon South, etc.
    time: string;            // 07:00 AM, 01:00 PM, etc.
  };
  payPerMonth: number;       // ₹12000-15000
  status: 'OPEN' | 'HIRED' | 'CLOSED';
  hiredDriverId?: string;    // Driver hired for this job
  hiredDriverName?: string;
  createdAt: string;
  appliedCount: number;      // How many applied
};
```

### 2. Job Applications
- Drivers browse available jobs in "Browse Available Jobs"
- Tap "Apply Now" → WhatsApp sent to job owner
- Message: "Hi [Owner], interested in your ₹[pay] [route] job"

**Data Model**:
```typescript
type JobApplication = {
  id: string;
  jobId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  status: 'PENDING' | 'CONTACTED';
  appliedAt: string;
};
```

### 3. Team Management
- View all hired drivers in "My Team"
- Per driver: name, photo, route, monthly pay, earnings this month, status
- Quick contact: WhatsApp + phone button

**Data Model**:
```typescript
type TeamMember = {
  id: string;
  name: string;
  photoUrl?: string;
  route: Route;
  monthlyPay: number;
  earningsThisMonth: number;  // Calculated from completed trips
  status: 'ACTIVE' | 'INACTIVE';
  phone?: string;
};
```

### 4. Payroll Automation
- Automatic calculation on 15th of each month
- For each hired driver: auto-deduct monthly pay from owner's trip revenue
- Payment notification queued to driver

**Data Model**:
```typescript
type PayrollRecord = {
  id: string;
  driverId: string;
  driverName: string;
  month: string;             // YYYY-MM format
  amount: number;            // Monthly salary
  status: 'PENDING' | 'PAID';
  paidAt?: string;           // When payment was processed
};
```

## API Endpoints

### Job Management
```
POST   /jobs/post                   - Post a new job
GET    /jobs/available              - List OPEN jobs from other drivers
GET    /jobs/{jobId}/applications   - List applications for a job

POST   /jobs/apply                  - Apply for a job
POST   /jobs/{jobId}/hire           - Hire a driver for job
```

### Team & Payroll
```
GET    /hiring/team                 - Get my hired drivers
GET    /hiring/payroll              - Get payroll history (last 12 months)
POST   /hiring/payroll/process      - Manual trigger (normally 15th)
```

## Implementation Details

### Demo Mode (Current)
Uses `AsyncStorage` for local data persistence:
- `ashwa.jobs` - All posted jobs
- `ashwa.job_applications` - Applications
- `ashwa.team` - Hired drivers
- `ashwa.payroll` - Payroll records

### Production Mode (Supabase)

#### Tables
```sql
-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  owner_name TEXT NOT NULL,
  route_id UUID NOT NULL REFERENCES routes(id),
  route JSONB NOT NULL,              -- Denormalized for quick access
  pay_per_month INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, HIRED, CLOSED
  hired_driver_id UUID REFERENCES auth.users(id),
  hired_driver_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  applied_count INTEGER DEFAULT 0
);

-- Job applications
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id),
  driver_name TEXT NOT NULL,
  driver_phone TEXT,
  status TEXT DEFAULT 'PENDING',     -- PENDING, CONTACTED
  applied_at TIMESTAMP DEFAULT NOW()
);

-- Payroll records
CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  driver_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  month TEXT NOT NULL,               -- YYYY-MM
  status TEXT DEFAULT 'PENDING',     -- PENDING, PAID
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(owner_id, driver_id, month)
);

-- Indexes
CREATE INDEX idx_jobs_owner ON jobs(owner_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_apps_job ON job_applications(job_id);
CREATE INDEX idx_apps_driver ON job_applications(driver_id);
CREATE INDEX idx_payroll_owner ON payroll(owner_id);
CREATE INDEX idx_payroll_driver ON payroll(driver_id);
CREATE INDEX idx_payroll_month ON payroll(month);
```

#### Supabase Triggers
```sql
-- Auto-deduct salary on 15th of month
-- This would be a database trigger or an Edge Function
-- scheduled to run daily at 00:01 UTC

CREATE OR REPLACE FUNCTION process_monthly_payroll()
RETURNS void AS $$
DECLARE
  current_day INTEGER;
  v_record RECORD;
BEGIN
  current_day := EXTRACT(DAY FROM NOW());
  
  -- Only run on 15th of month
  IF current_day = 15 THEN
    FOR v_record IN
      SELECT DISTINCT owner_id, month FROM payroll
      WHERE status = 'PENDING' AND month = TO_CHAR(NOW(), 'YYYY-MM')
    LOOP
      -- Auto-deduct from owner's account
      UPDATE drivers
      SET available_balance = available_balance - (
        SELECT COALESCE(SUM(amount), 0) FROM payroll
        WHERE owner_id = v_record.owner_id AND month = v_record.month
      )
      WHERE id = v_record.owner_id;
      
      -- Mark as paid
      UPDATE payroll
      SET status = 'PAID', paid_at = NOW()
      WHERE owner_id = v_record.owner_id AND month = v_record.month;
      
      -- Queue notification to drivers
      INSERT INTO notifications (driver_id, type, message, created_at)
      SELECT driver_id, 'PAYROLL', 
        'Salary of ₹' || amount || ' credited for ' || month,
        NOW()
      FROM payroll
      WHERE owner_id = v_record.owner_id AND month = v_record.month;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule this to run daily
-- In Supabase: create a cron job or Edge Function
```

## User Flows

### Owner Posts Job
1. "Hiring System" → "Post New Job"
2. Select route (School A, Morning North, 07:00 AM)
3. Enter pay (₹12500)
4. [Post] → Job saved as OPEN
5. Job appears in "Posted Jobs" count
6. Other drivers see it in "Browse Available Jobs"

### Driver Applies for Job
1. "Hiring System" → "Browse Available Jobs"
2. See "School A - Morning North - 07:00 AM - ₹12500/month"
3. [Apply Now]
4. WhatsApp queued: "Hi Owner, interested in your ₹12500 School A job"
5. Application saved as PENDING

### Owner Hires Driver
1. View applications for a job (via job detail)
2. [Hire Driver]
3. Job status → HIRED
4. Job removed from OPEN list
5. Driver added to "My Team"

### Payroll Processing
1. 15th of month: Auto-deduct salary from owner
2. Example: Owner has ₹5 hired drivers × ₹12k = ₹60k deducted
3. Payment status: PENDING → PAID
4. Notification: "Salary of ₹12,000 credited for 2024-11"

## WhatsApp Integration

When driver applies for job:
```
Message to owner phone:
"Hi [Owner], I'm interested in your ₹[pay] [school] [time] job. 
My name is [Driver Name]. Please reach out!"

Phone: [Driver Phone]
```

Demo mode: Logged to localStorage + console
Production: Via Supabase Edge Function → Twilio API

## Testing Checklist

### Demo Mode Testing
- [ ] Owner posts job → stored in AsyncStorage
- [ ] Job appears in "Available Jobs" for other drivers
- [ ] Driver applies → WhatsApp message logged
- [ ] Owner hires driver → Job status → HIRED
- [ ] Driver appears in "My Team"
- [ ] Team shows correct route, pay, earnings
- [ ] Manual payroll processing works
- [ ] Payroll history shows all months

### Production Testing (with Supabase)
- [ ] Jobs table created with proper indexes
- [ ] Payroll table with monthly uniqueness constraint
- [ ] RLS policies: drivers see only their jobs/team
- [ ] Trigger fires on 15th automatically
- [ ] WhatsApp Edge Function sends messages
- [ ] Notifications queued for payroll events

## Configuration

### Environment Variables
```
# App
VITE_API_BASE_URL=http://localhost:3000

# Supabase (production)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # For Edge Functions only

# WhatsApp (production)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_FROM=+1234567890
```

## Known Limitations (Demo)
1. WhatsApp messages not actually sent, just logged
2. Payroll not auto-deducted, manual trigger only
3. No real earnings calculation (not integrated with trip revenue)
4. Data stored in AsyncStorage (not persistent across app reinstalls)

## Next Steps for Production

1. **Backend Integration**
   - Implement API endpoints in NestJS backend
   - Add Supabase database schema
   - Create Edge Functions for WhatsApp + payroll

2. **Payroll Calculation**
   - Link to trip revenue tracking
   - Calculate actual earnings per trip
   - Implement auto-deduction logic

3. **Notifications**
   - Push notifications to drivers on payroll
   - Email receipts
   - SMS backup if WhatsApp fails

4. **Admin Dashboard**
   - Dispute resolution
   - Manual payroll adjustments
   - Team analytics

5. **Compliance**
   - Tax documentation (Form 16)
   - Payment reconciliation
   - Audit logs

---

**Last Updated**: 2024-11-16
**Version**: 1.0 (Demo)
**Status**: Ready for testing
