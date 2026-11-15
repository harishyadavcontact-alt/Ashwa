# Product audit: strategy vs. what the app does

Date: 2026-11-15. Checked against `strategy/` in the Ashwa repo (value stack, Grand Slam offers, funnels, pipelines, conjectures C1–C12) and against `src/` at commit `41c9300`.

Priority: **P0** = before any real family's data goes in. **P1** = before the admission window (Mar 2027). **P2** = after the pilot shows demand.

## 1. Direct answers

| Question | Answer |
|---|---|
| Can a driver refer another driver? | **No.** A replacement driver can join a route with its code, but there is no driver referral link, no tracking, and no reward. |
| Can a driver add their parents to the app easily? | **Yes, mostly.** The driver adds a customer with the parent's mobile number, then sends a WhatsApp link. The parent signs in and the child links automatically by phone. Gap: the link is a raw route id and there's no per-family link. |
| Is there a Swiggy/Zepto-style map for parents? | **No.** There's no map at all. Parents see text status only. |
| Do pins link to relevant parents' accounts? | **No.** Stops have no pins and no parent links. Adding this needs a privacy design first (see section 4). |
| Is driver verification in place? | **No. This is a regression.** The v1 schema had `verification_status`. The v2 rewrite dropped it, so any driver can list a van in search. The strategy makes verified drivers a rule. |

## 2. Gap table: strategy claim vs. app

| # | Strategy says | App today | Gap | Priority |
|---|---|---|---|---|
| G1 | Only verified drivers appear in parent search (`04`, `08` P4, `12` blind spot 3) | Nothing gates search | Add driver verification status, documents, and an admin "verify" step. Search returns verified drivers only | **P0** |
| G2 | Consent and privacy: DPDP verifiable parental consent, delete on request (`07` §4, `08` P5) | No consent screen, no privacy notice, no delete button | Consent screen at parent sign-up, privacy notice, "delete my data" | **P0** |
| G3 | Measure C1–C5 from day one (`05`, `07` §5) | No analytics, no event logging | Instrument the funnel: invited, joined, child added, first alert, active days, paid | **P0** |
| G4 | Reliable alerts: 5 min before pickup, boarded, reached school, left school, 5 min before drop, dropped (`07` §2) | In-app only. Browser notifications only while the app is open. Parents get no alert when a child is boarded or dropped | Web push plus WhatsApp share fallback for critical alerts. Parent alerts for every event, not just the 5-min one | **P0** |
| G5 | Absent flag so the van doesn't wait (`07` §2) | Not built | Driver marks "absent today" from the stop list | P1 |
| G6 | Incident path: helpline, freeze the trip record (`08` P4) | No incident button or record | "Report a problem" button, plus a trip snapshot kept for review | P1 |
| G7 | Kannada and English (`07` §3) | English only | Kannada strings for parent and driver screens and messages | P1 |
| G8 | Founder CRM and sales pipelines (`06`, `12`) | `leads` table exists in SQL with no UI and no policies | Simple leads screen for the founder, or a Google Sheet fed from the table | P1 |
| G9 | Driver-to-driver referral and backup pool (`01` L4, `06` §3) | Route code join only | Driver referral link, referred-by tracking, backup-driver request posted to the cluster | P1 |
| G10 | Vacancy card: "2 seats free on this route" for parents to forward (`06` §3) | Parents see seats left in search, but drivers can't post a vacancy | Driver posts a vacancy; the app generates a forwardable card | P1 |
| G11 | Parents share the live trip card with family (C7) | Not built | "Share trip" WhatsApp card with a short expiring link | P1 |
| G12 | Concierge match fee for new parents (C3, `02` §4) | Not in the app. Payments are recorded, not collected | Keep concierge manual for the pilot. Add a UPI deep link and receipt once C3 passes | P1 |
| G13 | Safe Gate board, school endorsement, per-school pages (`02` §6, `06` §2b) | Not built | After C9 passes. A static per-school page is enough | P2 |
| G14 | Invite and vouch controls against fake drivers and fake reviews (`06` §4) | Invites aren't rate-limited, there are no vouches | Rate-limit invites per driver. Vouching only after 10 trips | P2 |
| G15 | Fleet mode for 5–6-van owners (`01` #5, C8) | Not built | Phase 2, after C10 | P2 |
| G16 | Map for parents, pins linked to relevant accounts (your request) | Not built | See section 4 | P1 |

## 3. Funnel and channel check

| Channel in strategy | In the app? |
|---|---|
| Driver invites its parents (outbound, WhatsApp) | Yes, via a route link with phone auto-link |
| Parent shares Ashwa with other parents (referral) | Yes, a referral code and share link. Not tracked yet: the code is stored but nothing counts signups |
| Driver refers another driver | **No** (G9) |
| New parent finds a van (inbound search) | Yes, search by school and pickup point. Empty results are a dead end: no waitlist capture (C6 needs it) |
| Concierge match with fee | Manual outside the app |
| School endorsement | No (G13) |
| Paid acquisition (geo ads, posters) | Outside the app. Poster QR codes need the per-school landing page (G13) |

**Funnel gap:** a new parent who finds no van leaves with nothing. Capture their school and pickup as a waitlist entry and show them to the driver. This is the cheapest test of C6, and it's missing.

## 4. Map design (your request), privacy-safe

**Goal:** a Swiggy/Zepto-style view. The van moves, stops are numbered in order, and the parent sees their own pin clearly.

**What a parent sees**
- The route as a line through the stops, in order.
- The van's live position with "updated N s ago".
- Their own child's pickup and drop pins, labelled with the child's first name.
- Every other stop as an unnamed numbered pin: "Stop 4 · 2 children". No names, phones, or addresses of other families.

**What a driver sees**
- Everything, with names. This is their own route.

**Why this shape:** a pin that shows another family's child, name or address would breach the child-data rules the strategy sets (`07` §4, `12` blind spot 4). "Linked to the relevant parent's account" means the pin is linked to *your* account only, and other pins stay anonymous.

**What it needs**
1. A map library: MapLibre GL with OpenStreetMap tiles (free, no billing account).
2. A database function `route_map(route_id)` that returns each stop's order, direction, coordinates, a child count, and the caller's own child names only. It replaces the parent's current direct read of stops.
3. Live van position, which already exists and polls every 10 s. Realtime would make it smoother.
4. Driver view: the same map, with names.

**Effort:** about 1–2 days. It's a read-only layer over existing data, so it doesn't change the trip or fee logic.

## 5. Recommended order

1. **Before any real family:** G1 (verification), G2 (consent and delete), G3 (analytics), G4 (reliable alerts). These are blockers, not nice-to-haves.
2. **Before March 2027:** the map (G16), G5 absent flag, G6 incident button, G7 Kannada, G8 leads screen, G9 driver referral, G10 vacancy card, G11 trip share, and a waitlist for empty searches.
3. **After the pilot shows demand:** G12 payment links, G13 school pages, G14 abuse controls, G15 fleet mode.
