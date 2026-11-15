# 02 — Grand Slam Offers (Hormozi), per stakeholder

Status: v0.1. The summary row for each stakeholder is in `01-one-sheet.md`. This doc is the workshop behind it.

## How we build each offer (Hormozi's 5 steps + enhancers)

1. **Dream outcome:** what they'd pay anything for.
2. **List every problem** between them and that outcome (time, effort, doubt, fear).
3. **Turn each problem into a solution** ("How do we make X so easy that…").
4. **Pick delivery vehicles** (app feature, human help, WhatsApp, done-for-you).
5. **Trim and stack:** keep what is high value and low cost to deliver.
6. **Enhance:** scarcity, urgency, bonuses, guarantee, naming (MAGIC: Magnetic reason, Avatar, Goal, Interval, Container).

Value = (Dream outcome × Perceived likelihood) ÷ (Time delay × Effort & sacrifice). Push the top up and the bottom down.

**Rule for Ashwa:** for the pilot, "done-for-you by the founder" is allowed as a delivery vehicle even though it doesn't scale. It is the cheapest way to raise *perceived likelihood*, and it teaches us what to automate (FDE mindset, see `09`).

---

## 1. Existing van driver — "Ashwa Founding Driver"

| Lever | Today | With the offer |
|---|---|---|
| Dream outcome | — | Full van, fees on time, no phone pressure, respected as a business owner |
| Perceived likelihood | Low ("apps are for big companies") | High: Dad uses it, Harish onboards your parents for you, you see it working on Dad's van |
| Time delay | — | Day 1: calls drop on the first trip |
| Effort & sacrifice | — | One link, OTP, press "Start trip". Parents are added *by them*, not by you |

**Problems → solutions**

| Problem | Solution | Delivery vehicle |
|---|---|---|
| Constant "where are you" calls | Automatic alerts to parents at each stop | App (event engine exists in repo) |
| Typing parent data is a pain | Driver shares one invite link; parents enter their own child and stops | WhatsApp link |
| Parents don't trust new apps | Invite comes from *their own driver*, in Kannada | Message template |
| Chasing fees | Monthly reminder with a UPI link and receipts | Phase 1 |
| Sick day = kids stranded | Backup-driver pool from the same cluster | Phase 1 (manual via WhatsApp group first) |
| Fear: platform steals customers | Written customer-ownership guarantee; no other drivers shown to your parents | Policy + product rule |
| Fear: income visibility to the state | We don't report income; data stays between you and your parents | Policy |
| Phone/data cost | Lightweight app, works on low-end Android | Engineering constraint |

**Enhancers**
- *Scarcity:* "Founding Driver" status, first 50 drivers in Bangalore, 0% fees on existing customers for life.
- *Urgency:* get set up before the new academic term starts (parents switch vans then).
- *Bonus stack:* we onboard your parents in person; printed QR sticker for the van window ("Track this van"); "my van" share page for new customers.
- *Guarantee:* "If Ashwa adds more than 2 minutes to your day, we fix it within a week or you stop. Your customers stay yours, forever."
- *Name (MAGIC):* "Zero-Call School Run: no more 'where are you' calls in 7 days".

## 2. New van driver — "Fill My Van"

| Lever | With the offer |
|---|---|
| Dream outcome | First 10 kids within 30 days, steady income to cover the EMI |
| Perceived likelihood | Show live waitlist demand for their school cluster *before* sign-up |
| Time delay | Backup shifts pay from week 1 while their own route fills |
| Effort | Verify documents once; we route demand to you |

- *Guarantee:* no fee until your first kid rides.
- *Objection:* "I don't know these schools" → start with backup shifts for established drivers to learn routes.
- *Watch-out:* never promise income; route only real demand (fraud/abuse control).

## 3. Existing parent — "Know Every Trip"

| Lever | With the offer |
|---|---|
| Dream outcome | Peace of mind: I know where my child is without calling anyone |
| Perceived likelihood | Their own driver asked them to join; the first alert arrives on the first trip |
| Time delay | Same day |
| Effort | Tap link → OTP → child name, school, pickup point, drop point (≈60 seconds) |

**Problems → solutions**

| Problem | Solution |
|---|---|
| "Another app to install" | v0 opens from a link (web/PWA); install optional |
| Kids with different pickup and drop points | Separate pickup and drop stop per child (repo already models this) |
| Grandparents/spouse also worry | "Share trip" to family on WhatsApp |
| Privacy fear | Minimal data (no child photo required), visible consent text, delete button |
| Alert fatigue | Only 6 meaningful alerts per day (see `07`); everything else is silent |

- *Guarantee:* free forever for your own driver's trips; one-tap delete.
- *Name:* "Calm Mornings: know the moment your child boards and reaches school".

## 4. New parent — "Van in 48 Hours"

- **Desperation windows** (we get found instead of hunting): admission and new-term season (roughly Mar–Jun in Karnataka), moving house, a driver quitting mid-year.
- *Core:* tell us school + pickup point → we show verified drivers with seats on that route, plus vouches from existing parents.
- *Pilot delivery:* **concierge.** A WhatsApp number answered by the founder, matched by hand from Dad's network. No marketplace code needed to start earning.
- *Price:* one-time match fee, paid after you meet the driver. *Guarantee:* full refund if no match in 7 days or the driver leaves in the first 30 days (backup found free).
- *Objections:* stranger danger → verified documents, meet before paying, parent vouches, live tracking from day 1.

## 5. Fleet owner — "Fleet Mode" (vertical-integration engine)

- *Dream:* run 10 vans from one phone and borrow to buy the next one.
- *Core:* all vans on one map, driver attendance, per-van collections, backup drivers, a business history that partner lenders accept.
- *Guarantee:* free for 3 months; pay only if collections leakage drops.
- *Ladder (driver → owner):* see `03-value-chain-and-strategy.md` §4.

## 6. School — "Safe Gate"

- *Core:* free verified-van list for the school, a gate arrival board, an incident trail.
- *Ask of the school:* forward one Ashwa link to its parents' WhatsApp group.
- *Objection:* liability → we never ask the school to run or certify transport; we provide information only.

## 7. Funders — "Rails of India's recurring commute"

What Indian early-stage investors weigh (our framing):

| Investor cares about | Our proof point (to be earned in the pilot) |
|---|---|
| Founder-market fit | Grew up in the van; father ran the fleet; insider access to drivers |
| Capital efficiency / path to profit | ₹0 capex, ~₹0 CAC (driver-led invites), revenue from desperate segments first |
| Geometric growth | K-factor inside a cluster (each driver → N parents → M new drivers); cluster replication time |
| Retention | Multi-year driver↔parent relationships; daily frequency |
| Market size | Recurring commute (school → office → factory), not one-off rides |
| Defensibility | Trust graph + density per cluster + regulator relationship |
| Downside protection | Milestone tranches; founder bootstrapped to proof |

- *Grand slam framing:* "Invest after we prove it, at a price that respects the proof." Raise late, raise less, keep control (see `03` §7).

## 8. Recruits — "Forward-Deployed Builders"

- *Dream:* real impact, fast learning, meaningful ownership.
- *Offer:* ship to real drivers every week; equity with standard vesting; paid trial sprint before an offer; public traction dashboard so they can judge for themselves.
- *Who:* (a) a technical or ops cofounder, (b) field ops from driver families, (c) FDE-style engineers.

## 9. Government — "Compliance Rails for Free"

- *Core:* verified driver registry, opt-in safety data sharing, a path-to-compliance programme (permits, conversions, financing via partners).
- *Sequencing rule:* approach only **after** 50+ verified vans and a school endorsement. Never offer to be an enforcement tool. The value to government is *aggregate* safety data, not prosecuting individual drivers.
- *First-mover angle:* propose a pilot MoU or sandbox for one ward or zone. Being the reference implementation is a moat.
- *Objection:* "Are you legitimising illegal vans?" → "We're the cheapest way to move them into compliance."

---

## Cross-stakeholder objection matrix (quick reference)

| Objection | Driver | Parent | Owner | School | Funder | Recruit | Govt | Answer pattern |
|---|---|---|---|---|---|---|---|---|
| "You'll take my customers or data" | ● | ● | ● | | | | | Ownership guarantee + minimal data + delete |
| "Too much effort" | ● | ● | ● | ● | | | ● | Done-for-you onboarding, link-first |
| "Does it work?" | ● | ● | ● | ● | ● | ● | ● | Show Dad's van live; weekly public metrics |
| "Safety / liability" | | ● | | ● | | | ● | Verification, incident protocol, info-only role |
| "Uber will crush you" | | | | | ● | ● | | Trust graph + density + recurring model (`03` §5) |
| "No money in it" | | | | | ● | ● | | Paid-by-the-desperate first, then SaaS and finance |
| "Compliance grey zones" | ● | | ● | | ● | | ● | Path-to-compliance positioning; never enforcement |
