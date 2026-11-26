# 🚀 Ashwa Production Launch Checklist

**Status:** All 5 blockers fixed. Final 3 pieces ready for local implementation.

---

## **DONE ✅**
- [x] OTP signup (both apps)
- [x] API endpoint fix (localhost → production)
- [x] School dropdown (not text field)
- [x] WhatsApp verify (copy + open)
- [x] Multi-child alerts test endpoint
- [x] Demo data seeder (Dad + 15 families)
- [x] .claude/launch.json configured

---

## **FINAL 3 PIECES** (Local implementation)

### **1. Phone-only onboarding + Auto-linking**
**Files:**
- `apps/mobile-driver-expo/src/App.tsx` (line 1224-1280: onboarding screen)
- `apps/mobile-parent-expo/src/App.tsx` (same)

**Changes:**
- After OTP → check if driver/parent exists
- If exists → auto-link (no van setup yet)
- If new → ask "Driver or Parent?" (role) + name only
- Van setup deferred to after first trip
- Auto-link via: invite code (deep link) → referral code → phone match → assignment

**Result:** Phone OTP → Done. No forms. Straight to trips.

---

### **2. QR code generation for deep links**
**Files:**
- `services/backend-nest/src/qr/qr.controller.ts` (new)
- `services/backend-nest/src/qr/qr.service.ts` (new)
- Driver app: Add "Get QR" button

**Endpoints:**
```
POST /api/qr/driver/:driverId → returns QR image + link
POST /api/qr/referral/:parentId → returns QR image + link
```

**Deep links:**
```
ashwa://invite?code=DAD-XYZ123&driverId=dad-001
ashwa://referral?code=PRIYA-ABC456&parentId=parent-1
```

**Result:** Dad gets QR → shares to 15 families → each scans → auto-joins → ₹0 friction.

---

### **3. EAS config for Expo builds (TestFlight + Play Store)**
**Files:**
- `eas.json` (new, root of monorepo)
- `apps/mobile-driver-expo/app.json` (update)
- `apps/mobile-parent-expo/app.json` (update)

**Commands:**
```bash
eas build --platform ios      # Creates .ipa for TestFlight
eas build --platform android  # Creates .aab for Play Store
```

**Result:** Apps in test stores within 2 hours → Dad installs tomorrow.

---

## **LAUNCH DAY (Tomorrow)**

**Morning:**
1. Dad installs Ashwa Driver app (from TestFlight or Play Store)
2. Phone OTP → auto-linked to pre-made van
3. Gets driver QR code
4. Shares via WhatsApp to 15 families

**Families:**
1. Each gets WhatsApp invite + QR code
2. Scan QR → parent app opens → OTP → auto-joined
3. See map with Dad's van

**Trip:**
1. Dad starts trip
2. All 15 parents see live location
3. Get school arrival alerts
4. Dad earns ₹500
5. Referral chain starts (family → friend)

**Data collected:**
- Invite → open → signup rate (target 67%)
- First trip success (target 100%)
- Alert delivery (target 100% all parents)
- Referral conversion (target 20%+)
- Churn by Day 7 (target <5%)

---

## **If network error happens again**

The 3 pieces are ready to code. I can implement locally (no agent needed):
1. Modify auth flow in App.tsx
2. Add QR controller to backend
3. Add eas.json config

Just say "implement locally" and I'll finish in 30 min.

---

## **Post-Launch (Week 2)**

- Swap dummy backend → Supabase
- Add real push notifications
- Deploy to production
- Scale to 100 families
