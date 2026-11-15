# 12 — Sales Funnels, Pipelines, Blind Spots & Risks

Status: v0.1 (2026-11-15). Pipelines are tracked in one `leads` table in Supabase plus a Google Sheet view. Stages are the only fields that matter in v0.

---

## 1. Pipelines per stakeholder (stage → conversion target → what moves a lead)

### 1a. Driver pipeline (supply, the first and most important)

| Stage | Entry trigger | Move to next stage when | Target conversion | Owner |
|---|---|---|---|---|
| **Lead** | Name + phone from Dad's list | — | — | Dad |
| **Invited** | Founder/Dad sends the link | Link opened | 80% | Dad |
| **Onboarded** | Phone OTP + van + schools added | Trip started once | 70% of invited | Founder in person |
| **Active** | ≥3 trips/week for 2 weeks | — | 70% of onboarded | Founder |
| **Referrer** | Brings ≥1 driver or ≥5 parents | — | 30% of active | Dad |
| **Owner-track** | 2+ vans or hires a driver | — | 10% of active by end of 2027 | Founder |

### 1b. Existing-parent pipeline (switching from current arrangement)

| Stage | Entry trigger | Move to next stage when | Target | Lever |
|---|---|---|---|---|
| **Invited** | Driver forwards link in parent group | Link opened | 70% of invites | Driver's own voice |
| **Joined** | OTP + child + pickup/drop added | Completed without help | 60% of opened | 60-second form |
| **Alerted** | First "5 min away" alert received | — | 95% of joined | Web push + SMS fallback (later) |
| **Retained** | Trip alerts on ≥3 days in week 2 | — | 60% of joined | Calm alerts only (6/day max) |
| **Shared** | Shared the trip card | — | 0.5 shares/parent/week | "Track my child's van" card |

### 1c. New-parent pipeline (desperate; paid)

| Stage | Entry trigger | Move to next stage when | Target | Lever |
|---|---|---|---|---|
| **Inbound** | WhatsApp concierge / per-school page / poster QR | Replied | 100% answered within 1 h | Founder answers personally |
| **Qualified** | School + pickup area + child's age known | — | 60% of inbound | 3 questions only |
| **Shortlisted** | 2–3 verified drivers with seats on that route | Parent picks one | 50% of qualified | Verified + vouched |
| **Met** | Parent meets driver (in person or video) | — | 70% of shortlisted | Meet before paying |
| **Paid match** | Match fee paid | — | 40% of met (C3 test) | Refund guarantee |
| **Retained 30d** | Driver still serving at day 30 | — | 85% of paid | Backup driver if not |

### 1d. Fill-seat pipeline (drivers with empty seats)

| Stage | Trigger | Next | Target |
|---|---|---|---|
| **Seat posted** | Driver marks seats free | Matches found | 100% |
| **Matched** | New parent request on that route | Family taken | 60% of posts |
| **Filled** | First trip with new child | Fill fee paid (after 1st month) | 50% of matched |

### 1e. Owner / fleet pipeline (vertical integration, after pilot)

| Stage | Trigger | Next | Target |
|---|---|---|---|
| **Identified** | Driver with 2+ vans or asking for a second van | Interview | Founder keeps a list of 10 |
| **Interviewed** | 30-min call | Pinocchio mock | 3 of 10 |
| **Pilot (free 3 months)** | Agrees to use fleet view | Pays or churns | 2 of 3 |
| **Paying** | Per-van fee or finance referral | — | Test C8 |

### 1f. School pipeline

| Stage | Trigger | Next | Target |
|---|---|---|---|
| **Identified** | School in the pilot cluster | Intro via Dad | 100% of cluster schools listed |
| **Intro** | Principal or admin reached | Meeting | 1 of 3 (C9) |
| **Endorsed** | Shares the link with parents | Gate board | 1 school |

### 1g. Funder pipeline (only after proof, not before)

| Stage | Trigger | Next | Gate |
|---|---|---|---|
| **Warm list** | Angel/seed names from network | Intro | Weekly metrics post live |
| **Meeting** | Intro made | Data room | Pilot numbers exist (C1, C2, C4) |
| **Term sheet** | Investor interested | Negotiate | Founder control intact (`03` §7) |

### 1h. Recruit pipeline

| Stage | Trigger | Next | Target |
|---|---|---|---|
| **Applied / referred** | Build-in-public post or referral | Call | — |
| **Trial sprint** | Paid 1-week sprint | Offer | 1 of 5 sprints |
| **Offer** | Sprint delivered | Vesting agreed | — |

### 1i. Government pipeline (after 50+ verified vans)

| Stage | Trigger | Next | Gate |
|---|---|---|---|
| **Mapped** | Local transport/education officers identified via Dad's network | Intro | 50+ verified vans |
| **Intro** | Officer agrees to meet | Data one-pager | School endorsement exists |
| **Pilot MoU discussed** | Officer interested | Written scope | Legal review first |

---

## 2. Inbound and outbound summary (what to run, what to skip)

| Run now (free, pilot) | Run later (after V1) | Skip |
|---|---|---|
| Dad's driver network + in-person onboarding | Per-school SEO landing pages | Paid ads before C3 passes |
| WhatsApp invites + share cards | Google Business Profile for each area | Influencer deals |
| Concierge WhatsApp number (admission season) | Paid geo-fenced ads (₹1–3k test) | Cold email / LinkedIn outreach to drivers |
| School gate posters + QR | Fleet-owner outbound | Cold-calling parents |

## 3. Blind spots (what you may be missing)

These are the risks most likely to hurt the pilot, roughly in order.

| # | Blind spot | Why it matters | What to do now |
|---|---|---|---|
| 1 | **Dad is the whole distribution.** If he gets sick, quits, or falls out with his friends, the pilot stops. | Single point of failure in every funnel | Get 3 drivers onboarded by January. Don't make it "Dad's app", make it "the drivers' app" |
| 2 | **Background GPS.** A web page can't track while the phone is locked. | The core promise ("track live") may fail in the real world | Test on 3 real phones in week 3. Tell Dad: keep the screen on. Budget a native wrapper for Feb |
| 3 | **Legal status of the vans.** Many school vans run on private or unregistered permits. The app puts a record of unlicensed trips in the database. | Data and evidence can be used against drivers or the platform | Ask a transport lawyer (₹5–10k one-hour consult) before parents are invited. Decide what data Ashwa keeps |
| 4 | **Child-data law.** India's DPDP Act requires verifiable parental consent for children's data and limits what you do with it. | Breach = fine and trust loss | Parent consent screen, minimal data, no ads, delete button. Read the Act's children's section once |
| 5 | **Liability.** A child is hurt on a van we tracked. Parents assume "app = safe". | Reputational and possibly legal risk | Plain-language terms: "information, not transport". Incident protocol (`08` P4). No "safety guarantee" wording anywhere |
| 6 | **KV admissions run through central systems.** Kendriya Vidyalaya admissions aren't always choice-based. Parents may not pick the school, so the van need is set by the school the child lands in. | The March–June "switch" window may not be the one you assume | Check which schools in the cluster are KV, and how their admission list is released. Target the schools' parent groups, not just the admission portal |
| 7 | **Money is the trust test.** Drivers collect cash and advances. If the app shows a missed payment, the driver blames the app. | Could kill driver adoption | Keep money out of v1. Only tracking and alerts. Payments come after trust |
| 8 | **Who pays for the SMS and the domain?** "Free" really means ~₹1k/month. | Silent cost creep | Budget line in the sheet. Stop-loss at ₹2k/month |
| 9 | **Google Maps and OSM accuracy in narrow Bangalore lanes.** | Wrong pins mean wrong ETAs | Let Dad drop pins on the map himself. Use "last seen" instead of "ETA" when accuracy is poor |
| 10 | **Founder's job and IP.** Coding "during office hours" can give the employer a claim on the code. | Ruin-class risk (`04`) | Check the contract this week. Build on personal device and time. Keep the job until C1–C3 pass |
| 11 | **Founder as sole builder.** One person, one repo, no backups of your own time. | Burnout ends the bet | Fixed weekly hour cap (`08` P2). One cofounder or freelancer for ops after C2 |
| 12 | **Web push on iOS.** Works only after Add to Home Screen, on iOS 16.4+. | Some parents won't see alerts | Show the install step in onboarding. Track "alerted" stage in the funnel |
| 13 | **Free tiers can change or pause.** Supabase pauses after inactivity. | Silent outage on demo day | UptimeRobot + daily keep-alive ping. Export backups weekly |
| 14 | **No revenue story until after the pilot.** | Funders and recruits will ask in February | Use the desperate-stakeholder pricing test (C3) to get one real number by April |
| 15 | **Founder learning curve vs deadline.** The Supabase, OTP and PWA stack is new to you. | Slip past 15 Feb misses the window | Keep the first build to one flow. Use the Claude-assisted workflow (`09`) and ask for help early |

## 4. Answers to the direct questions

| Question | Answer |
|---|---|
| Do I need an app on the Play Store or App Store? | Not for the pilot. A PWA is enough. Play Store comes in Feb if background GPS requires it ($25 one-time). App Store is later ($99/yr) |
| Can I do it all for free? | Almost: the stack is free. SMS and the domain cost about ₹1k/month |
| Where does the data live? | Supabase (Postgres, in India-region if available — verify), with row-level security. Child data minimised |
| Do I keep the current code? | No. Port the trip logic and tests (`11` §1) |
| What do I ship first? | The driver's start/stop trip, then the parent's invite-to-alert loop. Nothing else |
| What's the "Claude-certified developer" lesson? | I didn't find a course in the repo. If you mean a learning path, use it as `09` FDE track evidence, not as a blocker |

## 5. Next decision the founder must make

Decide whether to create a **new private GitHub repo** named for the pilot (for example `ashwa-pilot`), and whether to scaffold the PWA + Supabase project locally now. Creating a repo and Supabase project is outward-facing, so confirm before doing either.
