# Loop 1: stock-take, the three trials, and the offer-to-feature trace

Date: 2026-11-16. Sources: `strategy/01` (value stack), `02` (offers), `03` (wedge, decoupling), `05` (conjectures), `06` and `12` (funnels), plus `docs/strategy-audit.md`.

---

## 1. Where we are

| | State |
|---|---|
| Code | `ashwa-pilot`, branch `pilot-scaffold`, commit `d801fde`. 14 commits, 28 source files, 26 unit tests passing, 6 database migrations written |
| Users | **Zero real users.** Nothing has run outside demo mode and a headless browser |
| Live | **No.** No Supabase project, no SMS, no hosting. The map hasn't been seen on a real phone |
| Built (demo) | Driver: sign-in, setup, route from current location, customers, tap-a-pin invites, run, absent, report a problem, fees (paid and not paid), invite a driver. Parent: auto-link by phone, map, status, alerts while the app is open, fee status, find a van, waitlist, ask my driver, invite a parent. Founder console: verify drivers, funnel, waitlist |
| Written but untested | All of Supabase mode (SQL, security rules, functions), web push server function |
| Decisions made | English first. Driver sets price and marks paid. Minimal look. Parent-to-driver loop is in. No UST branding |

**Honest summary:** we've built a lot of product and tested none of the hypotheses. The strategy says the market is the lab. We have not yet put anything in front of a driver.

---

## 2. Loop 1: three trials, nothing else

**The only goal:** get organic growth by making a driver's day easier. If it streamlines the driver's operations, drivers bring parents and other drivers. If it doesn't, nothing else we build matters.

### Trial 0: Dad → his current parents (first layer of feedback)

| | |
|---|---|
| Question | Will Dad's existing families use it, and does it stop the calls? |
| Conjectures | C1 (invites), C2 (activation), C4 (calls drop) |
| Who | Dad, and the 15–30 families on his route |
| Dad does | Sign in, create the route from where he parks, add each family (name, phone, fee, home from current location), send the WhatsApp invite, run morning and afternoon, mark fees |
| Parent does | Open the link, sign in with their mobile, see the van and updates |
| Measure | Share of Dad's families who joined in 7 days (target 70%). Share of joined parents active 3 days a week by week 3 (target 60%). Dad's calls per day, counted by hand |
| Kill | Under 30% joined: Dad onboards parents at the pickup point with the founder. Under 25% active: test WhatsApp-only alerts |
| Ignore | Search, waitlist, backups, referrals, schools |

### Trial 1: Dad's driver friends → add their existing parents

| | |
|---|---|
| Question | Can a driver who isn't Dad set up alone, and do their parents join? |
| Conjectures | C1 across drivers, early C10 |
| Who | 3–4 of Dad's driver friends, invited by Dad's referral link |
| Driver does | Name only, route from current location, add families, send invites |
| Founder does | Sits with the first two drivers, then lets the last two do it alone |
| Measure | Setup time (target under 10 minutes). Share of each driver's families joined in 7 days (70%). Drivers who run at least 3 days a week (85%) |
| Kill | Drivers don't add families: the setup is the problem. Watch where they stall |
| Ignore | Everything Trial 0 ignores |

### Trial 2: Does the referral ecosystem grow by word of mouth?

| | |
|---|---|
| Question | Without us pushing, do parents and drivers bring others? |
| Conjectures | C6 (unmet demand), the referral loops in `06` §3 |
| Loops tested | Driver → driver (invite a driver). Parent → driver (ask my driver). Parent → parent (invite a parent). Driver → new parents (share free seats). New parent → van (search, waitlist) |
| Measure | Opened → joined per referral code. New drivers who arrive from a parent's request. Parents who arrive through a referral. Waitlist requests per week |
| Kill | No organic joins in 3 weeks: the loops aren't working, return to field onboarding |
| Rule | **No paid traffic, no ads, no outreach.** Organic only |

---

## 3. The offer, traced to features

### Layer 1: existing drivers → existing parents

| Offer promise (`02`) | Feature | Built | Needed for |
|---|---|---|---|
| Zero-call school run | Live map and updates for each family | Yes | Trial 0 |
| Customers stay yours | No other driver shown to your families; a written promise in the app | **Promise not in the app copy** | Trial 0 |
| Set up in a minute | Name only, route from current location | Yes | Trial 1 |
| Your parents join without you typing | Add a family, send the WhatsApp link, auto-link by phone | Yes | Trial 0 |
| See who joined | Joined/Invited on the pin and the customer list | Yes | Trial 0 |
| Fees without chasing | Driver sets price, marks paid, sees who hasn't paid | Yes | Trial 0 |
| Free for existing customers | No fees charged | Yes | Trial 0 |
| Parent: know every trip | Map, status, minutes away, updates | Yes (updates reach parents only while the app is open) | Trial 0 |
| Parent: stop with one tap, data deleted | Delete my data | Yes | Trial 0 |
| Parent: no new app to install | Opens from a link; installable | Yes | Trial 0 |

### Layer 2a: new parents for existing drivers

| Offer promise | Feature | Built | Needed for |
|---|---|---|---|
| A parent finds a driver with seats | Search by school and home; seats left | Yes (verified drivers only) | Trial 2 |
| Driver fills empty seats | Share free seats on WhatsApp | Yes | Trial 2 |
| Seats appear only for real demand | Waitlist when no van matches | Yes | Trial 2 |
| Parents can ask the driver directly | WhatsApp the driver (linked parents only) | Yes | Trial 2 |
| New drivers can't poach existing parents | Parents see only their own driver | Yes | Trial 0 |

### Layer 2b: new parents for new drivers

| Offer promise | Feature | Built | Needed for |
|---|---|---|---|
| New driver joins from a friend | Invite a driver link, referral recorded | Yes | Trial 1, 2 |
| New driver builds a route fast | Route from current location | Yes | Trial 1 |
| Verified before parents can find them | Admin verification | Yes (manual) | Trial 2 |
| Parent brings a driver they know | Ask my driver to join | Yes | Trial 2 |
| New driver covers a shift to earn | Backup request and cover | Yes (no pay) | Park |
| New parent: a van within 48 hours | Search, choose, pin home | Yes | Trial 2 |
| New parent: money back if no match, trial week | Not built | No | Park |

---

## 4. Value stack and decoupling: are we true to it?

The strategy picks one link of the customer chain to win first (`03` §1): **the daily ride**, because it happens twice a day, needs no change in who pays whom, and turns the existing driver into the distributor.

| Layer (`01` Table B) | What it is | Loop 1 needs it? | Where we are |
|---|---|---|---|
| L1 Trip events and tracking | The wedge | **Yes: this is the whole product for Trials 0 and 1** | Built |
| L0 Trust and identity | Verification | Only to let new parents find drivers (Trial 2) | Built (manual) |
| L3 Payments and collections | Records of who paid | A retention hook only. Not a revenue test | Built, driver-led |
| L2 Discovery and matching | Search, waitlist | Trial 2 | Built |
| L4 Backup coverage | Cover a sick driver | No | Built (ahead of need) |
| L5 Fleet, L6 Finance, L7 Adjacent | Later layers | No | Not built (correct) |
| L8 Ads on child data | Rejected | No | Not built (correct) |

**Verdict.** The wedge is intact: tracking is the first thing a driver and a parent see. But we built L2 and L4 before L1 has a single user. That is not wrong, but it is the pattern the strategy warns about: building the platform before proving the wedge.

### Drifts to fix

| # | Drift | Why it matters | Fix |
|---|---|---|---|
| 1 | "Your customers stay yours" isn't visible in the app | It's the first risk reversal in the driver offer. Without it, drivers see an app that may take their customers | One line on driver setup, and on the customers screen |
| 2 | No way to measure the three trials | We'd run trials we can't score. C1 per driver, C2 active days, C5 start rate are missing | Build a **Loop 1 scorecard** in the founder console (section 5) |
| 3 | Updates only reach parents while the app is open | Weakens Trial 0 after week 1 | Deploy web push, or fall back to a WhatsApp nudge |
| 4 | Backups and shared seats in Dad's daily screens | Extra buttons distract a driver who only wants the run | Hide behind a "More" menu until Trial 2 |
| 5 | `Ashwa_genesis.md` still names the old stack | The canonical doc is wrong | Update the stack section |
| 6 | The strategy says "Dad vouches". Nothing in the app shows it | Trust is the product | Optional: a line in the invite message, "Sent by your driver" (already true) |

---

## 5. Feature list for Loop 1

**Must (before Trial 0)**
1. Supabase project, migrations 0001–0006, real SMS. Without these, nothing is real.
2. Hosting on a real URL.
3. Map and run tested on Dad's phone.
4. "Your customers stay yours" in the app copy.
5. Web push for parent updates, or a confirmed fallback.

**Should (before Trial 1)**
6. **Loop 1 scorecard** in the founder console: per driver, families added, families joined (percent), parents active in the last 7 days, runs this week; and referral opened → joined.
7. A one-page run sheet for sitting with a driver (below).

**Trial 2**
8. Referral stats already exist. Add "joined by referral" over time.
9. The waitlist and the search are already built.

**Park (built, not for Dad's screens yet)**
- Backup request and cover
- Share free seats
- School and fleet ideas
- Match fees, trial week, vouches
- Anything Kannada

---

## 6. Run sheet: a driver's first sitting (10 minutes)

1. Count calls on the driver's phone for the last week (baseline, for C4).
2. Open the app link. Sign in with the driver's mobile.
3. Name, tick the box, Start.
4. New route: stand at the van, tap "use my location". Name the school, tap at the gate.
5. Add the first family: name, phone, fee, tap "use my location" at their door if you're there, otherwise pin on the map.
6. Send the invite. Watch the first parent join. That is the moment.
7. Leave. Come back at the next pickup. Watch the run.
