# 06 — Go-to-Market, Funnels, Referral Growth & Trust/Abuse Controls

Status: v0.1.

---

## 1. Principle: get paid to eat lunch

There's no free lunch, but we can be **paid to eat it**: deploy where stakeholders are already desperate and searching, so they find us. Desperation is seasonal and event-driven.

| Desperate moment | Who | When | Where they look (we must be there) | What we sell |
|---|---|---|---|---|
| New admission / new term | New parent | Admission and new-term season (≈ Mar–Jun) | School gate, school WhatsApp groups, Google "school van near X" | Van in 48 h (match fee) |
| Driver quits mid-year | Existing parent | Any time | Neighbours, groups | Emergency match + backup |
| Moving house | Parent | Any time | Society/apartment groups | Match |
| Empty seats | Driver | Start of term, after a family moves away | Other drivers, school gate | Fill fee |
| Sick / van breakdown | Driver | Any day | Calls to driver friends | Backup shift |
| No driver for van #2 | Owner | Growth moments | Driver stands | Driver pool |

## 2. Funnels

### 2a. Outbound (we go to them): pilot priority

| Stage | Driver funnel | Parent funnel (via driver) | School funnel |
|---|---|---|---|
| Reach | Dad's network, school-gate driver stands at drop/pickup times, driver WhatsApp groups | Driver sends invite link in their existing parent group | Principal intro via Dad's driver list |
| Hook | "Zero calls in 7 days, Dad uses it" | "Your driver now sends live alerts" | "Free verified-van list for your parents" |
| Activate | Founder installs it on the driver's phone in person, starts the first trip together | Tap link → OTP → child + stops (60 s) | School forwards the link |
| Habit | Daily "start trip"; Dad as peer coach | 6 alerts per school day | Gate arrival board |
| Refer | Driver invites driver friends (backup pool) | Share trip with family; recommend driver to neighbours | Endorse to other schools |
| Monetise | Fill fees on new kids only | Match fee (new parents only) | Never |

### 2b. Inbound (they come to us)

| Channel | Asset | Cost | Start when |
|---|---|---|---|
| Google Maps / Business Profile | One "Ashwa School Vans – <area>" listing + per-driver share pages | ₹0 | Pilot week 2 |
| Per-school landing pages | "School vans for <School Name>": verified drivers, seats free, request form | ₹0 (static pages) | After C6 passes |
| QR sticker on vans | "Track this van / Find a van like this" | ~₹20/sticker | Pilot week 1 |
| Instagram/YouTube Shorts | Day-in-the-life of a van driver; Dad's story; "where are you" call montage | ₹0 | Build-in-public, weekly |
| Word of mouth | Live-trip cards forwarded in family groups | ₹0 | Built-in |

### 2c. Organic supplemented by paid ("inorganic")

- **Organic first.** Paid only to *test* a channel, never to *scale* before PMF.
- Paid test rules: geo-fenced Meta/Google ads within ~2 km of target schools, **admission season only**, capped at ₹1,000–3,000 per test, one creative variable at a time, success = cost per paid match < match fee.
- Paid traffic always lands on a **concierge** endpoint (WhatsApp) in the pilot, so every lead is learning.

## 3. Referral loops (growth between desperate stakeholders)

```
           invites (batch of 15–30)                 shares live trip
 DRIVER ─────────────────────────────▶ PARENTS ─────────────────────▶ FAMILY / NEIGHBOURS
   ▲  │                                   │                                   │
   │  │ backup shifts / referral          │ "my driver has 2 seats"           │ "who's your van?"
   │  ▼                                   ▼                                   ▼
 DRIVER FRIENDS ◀──── "invite your driver" ◀──── NEW PARENT (driver not on Ashwa)
```

| Loop | Trigger | Incentive | Message (WhatsApp, Kannada + English) | Metric |
|---|---|---|---|---|
| Driver → parents | Driver onboards | Calls stop | "Namaskara, from today you'll get alerts when the van reaches your stop and school. Tap: <link>" | Invite → activation % |
| Parent → family | First alert received | Peace of mind for grandparents | "Track <child>'s van live: <link>" | Shares / parent |
| Driver → driver | Driver needs a backup, or friend sees fewer calls | Backup pool access, Founding badge | "I use Ashwa, no more 'where are you' calls. Join with my link: <link>" | Drivers / driver |
| Parent → driver | New parent's driver isn't on Ashwa | Parent wants alerts | "Ask your driver to join; it's free: <link>" | Driver sign-ups from parent requests |
| Vacancy fill | Driver marks seats free | Fill seats | Auto-generated "2 seats free on <route>" card for parents to forward | Seats filled / vacancy posted |

**WhatsApp-first design rules:** every share is a **link with a rich preview** (title, van photo, area); deep links open the right screen; no login required to *view* a shared trip card for a limited time (privacy: no exact home location shown); messages are prefilled in the user's language.

## 4. Waste, fraud & abuse (keep linear costs for everyone)

| Abuse | Who's harmed | Control (cheapest first) |
|---|---|---|
| Fake or unsafe driver profiles | Parents | Document check + in-person verification by founder/Dad in the pilot; existing `VerificationStatus` + suspension |
| Fake vouches / reviews | Parents | Vouches only from parents with ≥10 completed trips with that driver |
| Poaching (driver A's parents targeted by driver B) | Drivers | Existing parents never see other drivers; matching only for new requests |
| Location stalking via shared links | Children | Shared links expire; show van position only during active trips; never show home pins |
| Match fee scams (pay, no-show) | Parents | Pay after meeting the driver; refund guarantee |
| Spam invites | Everyone | Rate-limit invites per driver; opt-out link |
| Ghost trips (driver doesn't run but marks complete) | Parents, owners | Location pings required for stop events (already in tracking design) |

## 5. Fast iteration in the AI era (operating cadence)

| Cadence | What |
|---|---|
| Daily | Read the pilot's event log + WhatsApp feedback; fix one paper cut (AI-assisted coding) |
| Weekly (Mon) | Ship a release to Dad's network |
| Weekly (Fri) | Field visit at pickup time; update `05` results log; build-in-public post with metrics |
| Per bet | Bet card in `08-protocols.md`; kill or continue at the cap |

AI leverage: use coding agents for boilerplate (OTP flow, notification jobs, landing pages), translation of message templates, summarising field notes into conjectures. Founder time goes to **field truth**, which AI can't get.
