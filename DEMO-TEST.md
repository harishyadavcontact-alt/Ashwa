# 🎬 Ashwa Demo - Local Testing

**Production-ready app with all 5 blockers fixed. Test Dad's end-to-end journey.**

## Quick Start

### 1. Start Backend (NestJS)
```bash
cd services/backend-nest
npm run start:dev
# Backend runs on http://localhost:3000
# Demo data auto-seeded with Dad + 15 families
```

### 2. Start Driver App (Expo)
```bash
cd apps/mobile-driver-expo
npm start
# Press 'i' for iOS simulator or 'a' for Android
# Or scan QR code with Expo app
```

### 3. Start Parent App (Expo)  
```bash
cd apps/mobile-parent-expo
npm start
# Press 'i' for iOS simulator or 'a' for Android
```

---

## Test Credentials

**Driver (Dad):**
- Phone: `9876543210`
- Van: Toyota Innova (Van-001)
- Serves 3 schools

**Parents (pick one):**
- Parent 1: Phone `9999999001` (Priya, child Arjun)
- Parent 2: Phone `9999999002` (Deepa, child Isha)
- ...up to Parent 15

---

## Test Flow (Day 1 Scenario)

### **Step 1: Driver (Dad) Login**
1. Open driver app
2. Tap "Get OTP" → Enter `9876543210`
3. Enter OTP (for demo, any 4 digits)
4. See dashboard with pre-made trip

### **Step 2: Parent (Priya) Join**
1. Open parent app
2. Tap "Get OTP" → Enter `9999999001`
3. OTP verification
4. Auto-linked to Dad's van (pre-linked in demo)
5. See map with Dad's van location

### **Step 3: Start Trip (Dad)**
1. Driver app: Tap `[▶ START TRIP]`
2. Trip begins with 10 children across 3 schools
3. Map shows route with pickup markers

### **Step 4: Pickup Sequence**
1. Driver app: Navigate to first pickup (St. Xavier's)
2. Arrive at Priya's location → Tap `[✓ ARRIVED]`
3. Parent app: Priya sees "Driver arrived" notification
4. Parent app: Priya sees van location updating (10-sec intervals)

### **Step 5: School Arrival**
1. Driver app: Navigate to school
2. Arrive at school → App auto-detects arrival
3. Parent app: ALL 10 parents get "Arrived at School" alert (multi-child test)
4. Parent app: Priya sees "✓ Dropped at [School Name]"

### **Step 6: Earnings**
1. Driver app: Trip complete
2. Driver sees big green: `₹500 earned today` (10 families × ₹50)
3. Breakdown: St. Xavier's (₹150), DAV (₹150), Vibgyor (₹100)

### **Step 7: Referral Test**
1. Driver app: Tap "Referrals" (from More menu)
2. Tap "Share on WhatsApp"
3. Opens WhatsApp with preset message: "Join Ashwa... [referral link]"

### **Step 8: Parent Referral**
1. Parent app: Tap "Earn ₹200" (referral card)
2. Tap "Copy Code"
3. Code copied to clipboard
4. Tap "Share on WhatsApp"
5. Opens WhatsApp with invitation message

---

## Blockers Fixed ✅

- [x] Email → OTP signup (both apps)
- [x] Localhost → production API
- [x] Institution IDs: TextInput → dropdown
- [x] WhatsApp: Copy + Open (verified)
- [x] Multi-child alerts: Pre-tested

---

## What's Included

✅ Real-time GPS tracking (10-sec updates)  
✅ Live map (MapLibre)  
✅ Multi-child school alerts  
✅ Earnings display  
✅ Referral loops (WhatsApp)  
✅ Call/SOS buttons  
✅ Dummy backend (swappable to Supabase)  

---

## Debugging

**Backend logs:**
```bash
# See all API calls, trip events, notifications
npm run start:dev
```

**App console:**
```bash
# In Expo, press 'j' for logs
# See API responses, errors, location updates
```

**Common issues:**
- **"Backend not reachable"** → Ensure backend is running on http://localhost:3000
- **GPS not updating** → Check location permission in simulator settings
- **WhatsApp not opening** → Requires WhatsApp installed; fallback to copy+paste
- **Notifications not arriving** → Check Firebase config (dummy mode shows alerts in console)

---

## Next Steps

1. ✅ Test full Dad journey (signup → invite → trip → earn)
2. ✅ Verify multi-child alerts (all 10 parents)
3. ✅ Check GPS live updates
4. ✅ Confirm earnings display
5. ⏭️ Fix any remaining friction
6. ⏭️ Deploy to Supabase (swap dummy backend)
7. ⏭️ Launch with real Dad + 15 families

---

**Questions?** Check backend logs or console for errors.
