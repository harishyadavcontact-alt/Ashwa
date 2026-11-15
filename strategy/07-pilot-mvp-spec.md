# 07 — Pilot MVP Spec: "Dad's Network" (invite-first)

Status: v0.1. Compared against the current repo code on 2026-11-15.

## 1. The pilot story (the only flow that matters right now)

1. Founder sends Dad **one link** (WhatsApp / Instagram DM).
2. Dad opens it → **phone OTP** → becomes a driver → adds van (seats) and the schools he serves. Founder does this *with* him in person.
3. Dad taps **"Invite parents"** → WhatsApp opens with a prefilled Kannada/English message + Dad's personal invite link → he forwards it to his existing parent group.
4. Parent taps the link → **phone OTP** → is automatically linked to Dad (no searching, no request/accept) → adds child: name, school, **pickup point**, **drop point** (can differ; pin on map or "use current location").
5. Every school day Dad taps **Start morning trip** / **Start evening trip**. Alerts go out automatically.
6. Dad shares his **"My van" page** to his wider network (new parents can request a seat; driver friends can join via his referral link).

## 2. Notification spec (6 alerts per child per day)

| # | When | Trigger | Message (draft) | Repo today |
|---|---|---|---|---|
| 1 | Morning: ~5 min before pickup | ETA to child's pickup ≤ 5 min | "Van is ~5 min from <child>'s pickup" | `DRIVER_10_MIN_TO_PICKUP` exists at **10 min** → make configurable, set to 5 |
| 2 | Morning: picked up | Driver taps boarded (or at-pickup geofence + tap) | "<child> has boarded the van" | `DRIVER_AT_PICKUP`, `CHILD_BOARDED` ✔ |
| 3 | Morning: reached school | School geofence / tap | "<child> reached <school>" | `DRIVER_AT_SCHOOL` ✔ (fired once per trip via anchor child: check it notifies **every** child's parent) |
| 4 | Evening: picked up from school | Driver taps boarded at school | "<child> is in the van, leaving school" | Only `DRIVER_LEFT_SCHOOL` → add per-child **boarded at school** (child absent / stays late is common) |
| 5 | Evening: ~5 min before drop | ETA to drop ≤ 5 min | "Van ~5 min from <child>'s drop point" | `DRIVER_10_MIN_TO_DROP` at **10 min** → 5 |
| 6 | Evening: dropped | Driver taps dropped | "<child> dropped at <drop point>" | `DRIVER_AT_DROP`, `CHILD_DROPPED` ✔ |

Extra (low priority): "<child> marked absent today" (driver taps absent, so the van doesn't wait); "Van running ~10 min late".

## 3. Gap analysis vs current repo

| Area | Current code | Pilot needs | Priority | Effort |
|---|---|---|---|---|
| Auth | Email + password (`User.email`, `passwordHash`) | **Phone OTP** (Firebase phone auth free tier, or MSG91/Twilio) | **P0** | M |
| Parent↔driver link | Parent searches drivers → `POST /assignments/request` → driver accepts | **Invite-first**: driver invite code/link auto-creates the assignment for the parent | **P0** | S–M |
| Invite / share | None | Invite link + prefilled WhatsApp message (`https://wa.me/?text=`), "My van" page, referral code | **P0** | S |
| Pickup ≠ drop | `Child` already has separate pickup/drop ✔ | Map pin picker in onboarding | P0 | S |
| ETA alerts | 10-min events, `TEN_MIN_ETA_SECONDS` config | 5-min threshold (config), per-child | **P0** | S |
| Evening per-child boarding | Afternoon has `DRIVER_LEFT_SCHOOL` only | Add per-child boarded-at-school + absent | P0 | S |
| Push delivery | Expo push + FCM when credentials exist | Must work reliably on low-end Android; fallback SMS/WhatsApp for critical alerts later | P0 | M |
| Driver verification | Docs + `VerificationStatus` ✔ | For invite-only pilot: allow Dad to run trips while `PENDING` for **his own** invited parents (verification needed only for discovery) | P1 | S |
| Parent app form factor | Expo native app | v0 option: **web/PWA link** for parents (no install); driver stays native (needs background GPS) | P1 (decide) | M |
| Fleet (multi-van) | `Vehicle.driverId @unique` (one van per driver) | Later: owner → many vans → many drivers | P3 | L |
| Payments | None | Later (Phase 1) | P3 | — |
| Language | English | Kannada strings for parent/driver UI and messages | P1 | S |

## 4. Data minimisation (child safety and DPDP)

- Store: child first name, school, pickup/drop point, parent phone. **Don't** store: child photo, DOB, Aadhaar or any ID numbers.
- Location pings only while a trip is active; purge raw pings after N days (keep events).
- Parent consent screen in plain language (English + Kannada) at first login.
- Shared trip links: expire, no home pins.

## 5. Pilot success metrics (instrument from day 1)

| Metric | Target (week 3) | Source |
|---|---|---|
| Drivers live | 4 (Dad + 3) | DB |
| Invited parents activated | ≥60% | DB |
| School days with a started trip | ≥85% | Trips |
| Alerts delivered / alerts expected | ≥95% | Event + push logs |
| Dad's calls/day | −50% vs baseline | Dad's call log (manual) |
| Shares per active parent / week | ≥0.5 | Share-link clicks |

## 6. Build order (smallest trustworthy loop)

1. Phone OTP auth (replace email/password for new users).
2. Driver invite link → auto-assignment.
3. Parent onboarding: child + pickup/drop pins.
4. 5-minute ETA config + evening per-child boarding/absent.
5. WhatsApp share (invite, trip card, "my van").
6. Kannada strings.
7. Deploy (one small VM + managed Postgres free tier) → Dad's phone.
