# Strategy audit: what the docs require, what the app does, and where they disagree

Date: 2026-11-16. Read: `strategy/00`–`12`, `yc-application-draft.md`, `README.md` in the Ashwa repo, `Ashwa_genesis.md`, and this repo's `docs/` (`product-audit`, `funnel-solutions`, `v1-checklist`, `user-journeys`). Checked against `src/` at commit `563fb9a`.

**Status key:** **Built** = in the app and tested (demo mode or unit tests). **Partial** = some of it. **Missing** = not in the app. **Conflict** = two docs, or a doc and the app, say different things.

---

## 1. Stakeholders and personas

The one-sheet names nine stakeholders. The app has screens for three of them.

| Stakeholder (one-sheet) | Persona written? | Screens in the app | Gap |
|---|---|---|---|
| 1 Existing van driver | Yes (`user-journeys`) | Driver screens | None major |
| 2 New van driver / aspiring owner | Yes | Driver screens (join, create route) | No backup-earnings view |
| 3 Existing parent | Yes | Parent screens | None major |
| 4 New parent | Yes | Find a van, waitlist | No "vouch" or "meet" step |
| 5 Fleet owner (5–6 vans) | **No** | None | Missing persona and screens (phase 2) |
| 6 School | **No** | None (school page not built) | Missing persona; no school user type |
| 7 Funder | Not a product user | Founder console | Fine: funders get a deck, not a screen |
| 8 Recruit | Not a product user | None | Fine |
| 9 Government / regulator | **No** | Registry not built; export not built | Missing persona and export |

**Mismatch:** the one-sheet's "whole of society" promise names schools and government, but `user-journeys` covers only the four core personas. Add a school persona and a regulator persona before the school pilot.

---

## 2. Required features, by source

### 2a. Grand Slam Offers (`02`)

| Offer promise | Feature | Status |
|---|---|---|
| Driver: "Customers stay yours" (written guarantee) | Policy text on setup; parents see no other driver | Partial: the guarantee isn't in the app copy |
| Driver: "0% fee for life on existing customers" | No fees charged | Built (by omission) |
| Driver: founder-onboards-your-parents in person | Done by hand | Process, not product |
| Driver: "Founding driver" badge | Not built | Missing |
| Driver: fee reminders | Not built | Missing |
| Driver: "my van" share page for new customers | Not built | Missing |
| Driver: QR sticker in the van window | Not built | Missing |
| Driver: backup-driver pool | Backup request and cover | Partial: no pay per shift |
| Driver: 0% on existing customers, success fee on new kids | Fill fee not built | Missing |
| Parent: "Free forever for your own driver" | No charge | Built |
| Parent: share trip with grandparent or spouse | Not built (only "invite a parent") | Missing |
| Parent: digital fee receipts | Not built | Missing |
| Parent: stop with one tap, data deleted | Delete my data | Built |
| New parent: "Van in 48 hours" | Find a van, choose, pin home | Partial: no verified-vouches step |
| New parent: match fee with money-back if no match in 7 days | Not built | Missing |
| New parent: trial week | Not built | Missing |
| New parent: backup guarantee if driver quits | Backup request exists | Partial |
| Fleet: "Fleet Mode" | Not built | Missing (phase 2) |
| School: "Safe Gate" board and verified-van list | Not built | Missing |
| Government: "Compliance rails" (registry, audit export) | Not built | Missing |

### 2b. Sales funnels and pipelines (`06`, `12`)

| Stage | Feature | Status |
|---|---|---|
| Driver: invited (80%) | Invite link opened: counted on the device | Partial: counted per device, not per invite |
| Driver: onboarded (70%) | Name-only setup, one-tap location | Built |
| Driver: active (≥3 runs/week) | Weekly runs on the routes screen | Built |
| Driver: referrer | Referral stats | Built |
| Parent: invited → joined | Link, phone auto-link | Built |
| Parent: alerted | In-app and browser alerts; web push not deployed | Partial |
| Parent: retained | Timeline only; no weekly summary | Partial |
| Parent: shared (0.5 per week) | No trip share | Missing |
| New parent: inbound answered in 1 hour | Waitlist, founder console | Partial: no alert to the founder |
| New parent: shortlisted | Driver name, seats, distance | Partial: no vouches |
| New parent: met | WhatsApp the driver (linked parents) | Built |
| New parent: paid match | Not built | Missing |
| New parent: retained 30 days | Not measured | Missing |
| Fill-seat: seat posted, matched, filled | Share free seats; fill fee not built | Partial |
| Owner pipeline | Not built | Missing |
| School pipeline | Not built | Missing |
| Funder, recruit, government pipelines | Founder console funnel and CSV | Partial |

### 2c. Conjectures to test (`05`)

| Conjecture | What the app must measure | Status |
|---|---|---|
| C1 drivers invite ≥70% of parents | Invites sent per driver vs families joined | Partial: joins counted; no per-driver rate |
| C2 parents active ≥3 days a week | Parent days active | Missing: no per-day activity metric |
| C3 parents pay a match fee | Paid matches | Missing |
| C4 calls drop ≥50% | Manual (Dad's call log) | Manual: fine |
| C5 start-trip rate ≥85% | School days with a started run | Missing: counted, not as a rate |
| C6 unmet demand | Searches with no result, waitlist | Built: search counts and waitlist |
| C7 parents share trips | Trip share clicks | Missing |
| C8 owners pay per van | Fleet pre-orders | Missing |
| C9 school shares the link | School link clicks | Missing |
| C10 40% driver penetration in one cluster | Drivers ÷ drivers serving the cluster's schools | Missing: needs a cluster definition |
| C11, C12 | Manual | Manual: fine |

### 2d. Protocols (`08`)

| Protocol | In the app | Status |
|---|---|---|
| P1 bet cards | Not in the app (process) | Process |
| P2 weekly rhythm | Process | Process |
| P3 field visits | Process | Process |
| P4 incident protocol | Report a problem (run screen); no triage queue; no trip snapshot kept | Partial |
| P5 data protocol: no ID numbers, deletion in 7 days | ID numbers not collected; delete is immediate | Built |
| P6 decisions | Process | Process |
| P7 promise ledger | Not built | Missing (could be a table) |

### 2e. Technical (`07`, `11`)

| Requirement | Status |
|---|---|
| Phone OTP login | Built (needs Supabase SMS) |
| Invite-first auto-linking | Built |
| 5-minute alert, per child | Built (client-side) |
| Per-child boarded at school (evening) | **Missing** (spec item 4) |
| Absent flag | Built |
| Web push delivery | Partial: client and handler built, server function not deployed |
| Kannada strings | **Missing** (spec §3, P1) |
| Consent screen in Kannada and English | Partial: English only |
| Parental consent "verifiable" under DPDP | Partial: a tick box, not verification |
| Location purge after N days | Missing |
| Realtime live tracking (`11` §2) | **Conflict**: the app polls every 10 seconds |
| PostHog analytics (`11` §2) | **Conflict**: the app uses its own events table |
| Sentry errors (`11` §2) | Missing |
| UptimeRobot monitoring (`11` §2) | Missing |
| Keep-alive job for Supabase pauses (`12` #13) | Missing |
| Daily backup export (`11` §3) | Missing |
| iOS install step for push (`12` #12) | Missing |
| CI: typecheck, tests, build (`11` §3) | Built (`.github/workflows/ci.yml`) |
| Vercel is not used (commercial-use trap) | Built (Cloudflare Pages plan) |

### 2f. Blind spots (`12` §3)

| # | Blind spot | Covered? |
|---|---|---|
| 1 | Dad is the single point of failure | Partial: driver invite and referrals reduce it |
| 2 | Background GPS | Partial: keep-screen-on, native wrapper not built |
| 3 | Legal status of vans | Process: lawyer consult not done |
| 4 | Child-data law | Partial: consent tick box, notice draft |
| 5 | Liability wording | Partial: "information, not transport" not in the app copy |
| 6 | KV admissions | Process: not checked |
| 7 | Money is the trust test | **Conflict**: fee tracking built, though `12` says keep money out of v1 |
| 8 | SMS and domain cost | Process |
| 9 | Map accuracy in narrow lanes | Partial: pins are user-placed |
| 10 | Founder's job and IP | Process: check the contract |
| 11 | Founder as sole builder | Process |
| 12 | iOS push | Missing install step |
| 13 | Free tiers pause | Missing keep-alive |
| 14 | No revenue story | Process: C3 not run |
| 15 | Learning curve | Process |

---

## 3. Mismatches and conflicts

These are where two sources disagree, or where a doc and the build disagree. Each needs a decision, not just a fix.

| # | Conflict | Sources | Recommended resolution |
|---|---|---|---|
| M1 | **The genesis file is out of date.** `Ashwa_genesis.md` (the "canonical" doc) still says NestJS, Prisma, PostgreSQL and Expo. The pilot is Supabase and a PWA. | Ashwa repo `Ashwa_genesis.md`, `README.md`, `11` | Update genesis's stack section to the pilot stack, or mark the old stack as legacy. Genesis is the source of truth, so this matters most |
| M2 | **The YC draft says Firebase and React Native.** | `yc-application-draft.md` | Update the stack answer before submitting |
| M3 | **Realtime vs polling.** `11` says Supabase Realtime gives live tracking; the app polls every 10 seconds. | `11` §2 vs `src/pages/ParentHome.tsx` | Accept polling for the pilot, and say so in `11`. Realtime later |
| M4 | **Analytics tool.** `11` picks PostHog; the build uses an in-house events table. | `11` §2 vs `src/data/extras.ts`, `lib/analytics.ts` | Keep in-house for the pilot (no data leaves Supabase). Update `11` |
| M5 | **Money in v1.** `12` #7 says keep money out of v1, but fee tracking and payment reports are built. | `12` #7 vs `03`, `02` | Decide: fee *records* stay (they're the driver's notebook), payment *collection* stays out. Write that rule into `12` |
| M6 | **Shared trip links vs privacy.** The offer promises "share trip with family"; the privacy rule says no home pins and expiring links. | `02` parent offer vs `06` §4 | Build the share as an expiring link that shows the van, not the home. Matches both |
| M7 | **Verification for discovery.** `07` says Dad can run trips while PENDING for his own families; the app matches this. But `02` says "verified profile" as a promise to new drivers, and the verify step is manual. | `07` §3 vs `02` | Keep the rule, and say "verified by Ashwa team" in copy, not "verified by government" |
| M8 | **Phase 1 payments.** `01` Table B puts payment collection in phase 1 (UPI collect); `12` says money out of v1. | `01` vs `12` | Phase 1 = records only. Move UPI collection to phase 2 in `01` |
| M9 | **Alert count.** `07` §2 lists six alerts, and the 5-minute alerts use a 10-minute event. The app uses a 5-minute client-side check. | `07` §2 vs `src/logic/eta.ts` | Correct `07`: the 5-minute check is computed on the phone, not sent by the driver |
| M10 | **Trip-start reminder.** `06` and `12` say drivers forget to start; the app has no reminder. | `12` #... and `05` C5 | Build a morning reminder (P1) |
| M11 | **Old audit is stale.** `docs/product-audit.md` says verification was dropped; it was rebuilt in `88a497c`. | `docs/product-audit.md` | Mark the old audit as superseded by this one |
| M12 | **The product-audit says "Driver verification is missing"** but also "P0 blocker"; this audit confirms it is built. | same | Same as M11 |
| M13 | **UST brand standards.** The session has UST brand skills (`ust-brand-design`, `ust-brand-standards`, `ust-brand-templates`). Using them for Ashwa would mix the employer's brand into the founder's company. | Session skills vs the Ashwa brand | Don't use them for Ashwa. See section 5 |
| M14 | **"I also run a van" removed** from the parent account. The one-sheet's driver-to-parent crossover still exists in the referral flow. | `user-journeys` vs build | Consistent: both roles use one account, and "Switch to driver" shows only to drivers |

---

## 4. Value chain coverage per persona

The value chain in `01` Table B (L0–L8) against each persona. ● built, ◐ partial, ○ missing, — not relevant.

| Layer | Existing driver | New driver | Existing parent | New parent | School | Fleet owner | Government |
|---|---|---|---|---|---|---|---|
| L0 Trust and identity | ◐ verification pending; no vouches | ◐ same | ◐ no vouch | ○ no vouch | ○ | ○ | ◐ registry not exported |
| L1 Trip events and tracking | ● | ● | ● | ◐ (after joining) | ○ arrival board | ○ | — |
| L2 Discovery and matching | ◐ (route code) | ◐ (search, waitlist) | — | ◐ search, waitlist | ○ | ○ | — |
| L3 Payments and collections | ◐ fee records | ◐ | ◐ report payment | ○ | — | ○ | — |
| L4 Backup coverage | ◐ request and cover | ◐ cover | ◐ notice only | ○ | — | ○ | — |
| L5 Fleet ops | ○ | ○ | — | — | — | ○ | — |
| L6 Embedded finance | ○ | ○ | — | — | — | ○ | — |
| L7 Adjacent commutes | ○ | ○ | ○ | — | — | ○ | — |
| L8 Ads on child data | Rejected, and not built | — | — | — | — | — | — |

**Read-across:** the value chain is strong at the bottom (L1 tracking) and thin above L3. The new-parent column is the weakest, which is where the money is.

---

## 5. Brand persona for school private vans

**What the docs say:** nothing about a brand. The closest is `02`: "we're formalising something deeply ingrained in Indian life", and "no kid left waiting, no seat riding empty". The founder's YC draft: "Digitize India's hidden private school van network".

**Proposed persona for Ashwa (for the founder to approve):**

- **Who it's for:** the van driver who has been doing this for ten years, and the mother who wants to know her child is safe.
- **Voice:** plain, warm, short sentences, Kannada first in Bangalore. Never corporate, never startup jargon.
- **Promise:** "Your child's van, on your phone." Not "safety guaranteed" (the rule in `12` #5).
- **Look:** school-bus yellow, black type, rounded cards. Already built.
- **Don'ts:** no ads, no stock photos of children, no "AI" in the copy, no words like "disrupt".

**Can we use the UST brand?** No. The UST brand skills are the employer's corporate standards. Using them would put the employer's name and style on Ashwa, and it would also work against the moonlighting and IP risk in `04` and `12` #10. Ashwa needs its own brand. Keep the employer's brand out of the product and the pitch.

---

## 6. What to build next (priority order)

1. **Fix the docs that will mislead investors and the team (M1, M2, M5, M8, M9, M11).** This takes an hour and no code.
2. **Per-child "boarded at school" for the evening run** (`07` §2 item 4). Needed for the spec.
3. **Kannada strings** for the parent and driver screens (`07` §3). Needed for Dad's network.
4. **Trip share link**, expiring, showing the van and not the home (M6). Needed for C7 and the offer.
5. **Morning run reminder** for drivers (M10, C5).
6. **Parent-triggered driver invite** ("Ask your driver to join"), from `06` §3. Currently missing: this is the parent-to-driver loop.
7. **Admin: suspend a driver** (the status exists; no button). Needed for the incident protocol (`08` P4).
8. **Keep-alive and daily backup** (`12` #13, `11` §3).
9. **School persona and a minimal school page** (C9). Needed before the school conversation.
10. **Fleet mode and the owner persona** (phase 2, after C10).

**Decisions the founder must make:** M5 (money rule), M6 (share design), M13 (brand), and whether to keep polling or move to Realtime (M3).

---

## Decisions (2026-11-16, founder)

- **English first.** Kannada is out of the pilot for now.
- **Money rule.** The driver sets each price and marks each family paid (or not). The driver sees how many have paid and who hasn't. Parents see their fee and whether it is paid. Parents don't report payments, and money is never collected in the app. This replaces M5 and M8.
- **Parent-to-driver loop is in.** A parent can ask their driver to join from their account (WhatsApp, with their referral link).
- **Look.** Simple and minimal. White and ink, with yellow only for the van and small highlights. Not a brand system; the bar is "not tacky".
