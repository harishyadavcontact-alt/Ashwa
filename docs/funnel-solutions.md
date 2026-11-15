# Funnels and pipelines: the problem at each stage, and the app that solves it

Date: 2026-11-16. Source: `strategy/06-gtm-funnels-growth.md` and `strategy/12-funnels-pipelines-blindspots.md` (sections 1a–1i and 3).

**Status key:** **Built** = in the app and tested in demo. **Partial** = some of it works. **Missing** = not in the app.
**Priority:** **P0** = needed for the pilot to run. **P1** = needed for admissions in March 2027. **P2** = after the pilot shows demand.

---

## 1. Driver pipeline (supply: the most important funnel)

| Stage (target) | Problem at this stage | App that solves it | Status | Priority |
|---|---|---|---|---|
| Lead → Invited (80%) | Dad has to send each link by hand; nobody knows if the link was opened | Invite link with a prefilled WhatsApp message; **record when the link is opened** | Partial (invite sent is tracked; opened is not) | P0 |
| Invited → Onboarded (70%) | Setup asks too much; driver doesn't know what's next | Name-only setup, one-tap location for the van start, route built in one screen | Built | — |
| Onboarded → Trip started | Driver forgets to start the run | Morning reminder notification at the usual run time | Missing | P1 |
| Active (≥3 trips a week for 2 weeks) | Nothing shows the driver how they're doing | "This week" count on the routes screen: runs, families joined | Missing | P1 |
| Referrer (brings a driver or 5 families) | Referral link exists, but no count | Referral count: drivers joined, families joined, on the routes screen | Partial (link built; count missing) | P1 |
| Verified (gates search) | Driver waits, doesn't know why they aren't in search | "Verification pending" chip, admin verifies, driver gets a message when verified | Partial (chip and admin built; the "you're verified" message is missing) | P0 |
| Owner-track (2+ vans) | No way to add a second van or hire a driver | Fleet mode: several routes under one owner, a driver per route | Missing | P2 |

## 2. Existing-parent pipeline (switching from cash and calls)

| Stage (target) | Problem | App that solves it | Status | Priority |
|---|---|---|---|---|
| Invited → Opened (70%) | Same as drivers: no record that the invite was opened | Invite link opened event | Missing | P0 |
| Opened → Joined (60%) | Sign-in asks for too much | Mobile sign-in, the child is linked by phone, name and consent only | Built | — |
| Joined → Alerted (95%) | Alerts stop when the app is closed | Web push notifications for every trip update | Missing (browser-only today) | P0 |
| Alerted → Retained (60%) | Updates feel like spam, or parents forget the app | Only trip events, no feed; a short weekly summary card | Partial (events built; weekly summary missing) | P1 |
| Retained → Shared (0.5 a week) | No easy way to share the live trip with family | "Share trip" card with a short link that expires | Missing | P1 |

## 3. New-parent pipeline (desperate; paid)

| Stage (target) | Problem | App that solves it | Status | Priority |
|---|---|---|---|---|
| Inbound (answered within 1 hour) | A parent who finds no van leaves with nothing | **Waitlist**: school, home and child saved when search finds nothing; founder is alerted | Missing | P0 |
| Qualified (60%) | Parent doesn't know the school name the app uses | School suggestions while typing | Built (needs Supabase to load real schools) | — |
| Shortlisted (50%) | Parent can't tell a good van from a bad one | Driver card: name, seats, distance, and later vouches from families | Partial (name, seats, distance built; vouches missing) | P1 |
| Met (70%) | No safe way to contact the driver | "Call driver" button that doesn't show either phone number (masked call, or call through a number we control) | Missing | P0 |
| Paid match (40%) | No match fee and no refund rule in the app | Match fee and refund: the fee is recorded, refunds are manual at first | Missing (concierge, manual) | P1 |
| Retained 30 days (85%) | Driver leaves mid-year and the family is stranded | Backup driver on the route, the family gets an alert and a backup offer | Missing | P1 |

## 4. Fill-seat pipeline (drivers with empty seats)

| Stage (target) | Problem | App that solves it | Status | Priority |
|---|---|---|---|---|
| Seat posted (100%) | A driver can't say they have seats | "Seats free" toggle on the route, with the number of seats | Missing | P1 |
| Matched (60%) | Parents searching don't see the seats in time | Vacancy card: "2 seats free on Sunrise run", ready to forward | Missing | P1 |
| Filled (50%) | No record that a new family took the seat | Filling a seat creates the family's record and the fill fee | Partial (enrol works; the fill fee is missing) | P1 |

## 5. Owner and fleet pipeline (after the pilot)

| Stage (target) | Problem | App that solves it | Status | Priority |
|---|---|---|---|---|
| Identified (10 owners) | No list of owners to talk to | Founder's leads list (see section 9) | Missing | P1 |
| Interviewed (3 of 10) | No way to show a fleet view | Fleet mock (Pinocchio) | Missing | P2 |
| Pilot, free 3 months (2 of 3) | Owner needs many vans, one screen | Fleet mode: all vans on one screen, collections per van | Missing | P2 |
| Paying (test C8) | No way to charge | Per-van subscription with a payment link | Missing | P2 |

## 6. School pipeline

| Stage (target) | Problem | App that solves it | Status | Priority |
|---|---|---|---|---|
| Identified (100% of the cluster) | No list of schools | Schools in the leads list (section 9) | Missing | P1 |
| Intro (1 of 3) | Principal doesn't know what Ashwa is | One-page school brief: "free verified-van list for your parents" | Missing (document, not app) | P1 |
| Endorsed (1 school) | No place for the school to share the link | School page: verified vans for this school, one link to forward | Missing | P1 |

## 7. Funder, recruit and government pipelines

| Pipeline | Problem | App that solves it | Status | Priority |
|---|---|---|---|---|
| Funder: meeting (pilot numbers exist) | No weekly numbers in one place | Admin funnel view: each stage's count and conversion, one week at a time | Partial (event counts only) | P0 |
| Funder: data room | Numbers have to be typed up by hand | One-click export of the funnel and the trip counts (CSV) | Missing | P1 |
| Recruit: trial sprint | No way to hand over a sprint | Not an app feature. Use a private repo and the checklist | — | — |
| Government: verified registry (after 50 vans) | No list the officer can check | Verified-vans registry export, no children's data | Missing | P1 |
| Government: safety audit | Trip records can't be shared without personal data | Anonymised trip summary export (counts, times, no names) | Missing | P2 |

## 8. Cross-cutting problems (the blind spots in `strategy/12`)

| Problem | Blind spot | App that solves it | Status | Priority |
|---|---|---|---|---|
| Alerts stop when the app is closed | 12 | Web push | Missing | P0 |
| Dad is the single point of failure | 1 | Invite flow that a driver can run without the founder; referral count | Partial | P1 |
| Driver can't track while the phone is locked | 2 | Native wrapper (Play Store, Feb) | Missing | P1 |
| Child-data consent and deletion | 4 | Consent, privacy notice, delete my data | Built | — |
| Liability wording | 5 | Plain terms on the consent screen and the privacy notice | Partial (copy drafted) | P0 |
| Money is a trust test | 7 | Keep money to records only in v1 | Built | — |
| Incident path | 5, 8 | "Report a problem" on the run screen; trip snapshot kept | Missing | P0 |
| Absent children | (run quality) | "Absent today" button per child | Missing | P1 |
| Free tiers pause | 13 | Health check and keep-alive job | Missing | P1 |

## 9. The internal tools the funnels need

| Tool | Why | Status | Priority |
|---|---|---|---|
| Leads table with stages (the `leads` table already exists in the database) | Track drivers, parents, schools and owners through their stages | Table exists; no screen and no writes from the app | P0 |
| Funnel stage counts with conversion | Measure every target in `strategy/12` | Missing | P0 |
| Weekly metrics for the build-in-public post | C11 needs real numbers each week | Missing | P1 |

---

## 10. What the app needs to solve all of this

Seven modules, in the order to build them:

1. **Invites and attribution (P0).** Every invite link records who sent it, when it was opened, and when the person joined. Drivers and parents both.
2. **Trust and safety (P0).** Verification message, "Call driver" that protects both numbers, incident button, plain terms.
3. **Alerts that reach people (P0).** Web push for every trip update, and an "absent today" button.
4. **Demand capture (P0).** Waitlist when search finds nothing; founder gets a message; the lead lands in the leads table.
5. **Supply growth (P1).** Vacancy card, seats-free toggle, backup driver request, referral count, the "active driver" weekly count.
6. **Money (P1).** Match fee and refund record, fill fee record. Still no collection in v1.
7. **Founder console (P0 for the funnel view, P1 for the rest).** Funnel stage counts and conversion, leads screen, weekly export.

## 11. Recommended build order

1. Invite opened events, and the funnel view in admin (so every number in `strategy/12` can be seen).
2. Web push and the incident button (the pilot can't run safely without them).
3. Waitlist and the leads table (captures the desperate parents the strategy is built around).
4. "Call driver" with masked contact.
5. Vacancy card and seats-free toggle (fill-seat pipeline).
6. Backup driver request, referral count, weekly driver summary.
7. Match fee record, fleet mode, school page, export.
