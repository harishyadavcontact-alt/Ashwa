# 11 — Tech Stack Decision, Free-Tier Plan & Shipping Calendar

Status: decision v1 (2026-11-15). Free-tier limits and vendor policies change often. Re-check each one before relying on it (marked ⚠).

---

## 1. Decision: scrap the current stack for the pilot

The current repo (NestJS + Prisma + Postgres + Expo + Docker + Azure pipelines + Helm charts) is built for a multi-service company, not a 3-month pilot. It needs a server that never sleeps, a database you run yourself, and two native apps. None of that is free to run or quick to ship.

**Keep from the repo:** the logic, not the stack.
- `services/backend-nest/src/trips/trip-progression.ts` (deterministic trip events, with tests). Port it to a pure TypeScript module.
- The event names in `packages/shared` (`DRIVER_10_MIN_TO_PICKUP`, `CHILD_BOARDED`, and so on).
- The trust states (`PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED`).
- Test cases in `test/*.spec.ts`. Reuse them with Vitest.

**Path-dependency check:** the repo has a lot of sunk cost, and its structure pushes you toward building the platform before the pilot. Starting over costs about two weeks. Keeping it costs months and the window in March. Start fresh, port the logic.

> Note: the parent folder `ScanHealth` also holds unrelated stacks (`backend-spring`, `chat`, `heb`, `charts`). Keep Ashwa in its own repo so nothing leaks between them.

## 2. Target stack (one developer, zero fixed cost)

| Layer | Choice | Why | Free tier ⚠ | Upgrade trigger |
|---|---|---|---|---|
| **App shape** | **PWA**: one React + TypeScript web app, two role-based routes (`/parent`, `/driver`) | No app store, no install friction, instant deploys, works on Android and iPhone (Add to Home Screen) | Free | Native wrapper only when background GPS is needed (see §5) |
| **Frontend build** | Vite + React + TypeScript + `vite-plugin-pwa` | Fastest dev loop, smallest bundle for low-end phones | Free (OSS) | — |
| **Backend + DB** | **Supabase**: Postgres, Auth, Realtime, Storage, Row Level Security | Replaces NestJS + Prisma + Docker. Privacy enforced in the database. Realtime gives live tracking for free | Free plan ⚠ (project **pauses after 7 days of inactivity**; a daily cron ping keeps it alive) | Pro plan once paid pilots start |
| **Business logic** | Supabase Edge Functions (Deno) for the event engine and the scheduled ETA job | No server to manage | Free tier ⚠ | — |
| **Hosting** | **Cloudflare Pages** | Free for commercial use. (Vercel's Hobby plan prohibits commercial use, so it's a trap once you charge money.) | Free ⚠ | — |
| **Phone login** | Supabase phone OTP with an SMS provider | Parents may have no email. OTP is the expected login in India | ⚠ No reliable free SMS. Budget about ₹500–1,000/month for the pilot (verify current per-SMS rate with the provider) | Cheaper DLT-registered route (see §4) |
| **Maps** | **MapLibre GL + OpenStreetMap tiles** | Free display. Google Maps costs money at scale and needs a billing account | Free ⚠ (OSM tile policy: keep usage modest, or use a free tile host) | Paid tiles if traffic grows |
| **Geocoding** | Pin-drop on the map + "use my location". Avoid geocoding APIs in v0 | Removes a cost and a failure point | Free | — |
| **Live location** | Driver PWA: `navigator.geolocation.watchPosition` + Screen Wake Lock. Sends a ping every 10 s over Supabase Realtime | Free, no native code | Free ⚠ (Realtime message limits) | Native background GPS (§5) |
| **Alerts** | v0: **Web Push** (service worker) + **in-app timeline**. Critical alerts also get a WhatsApp share link | Free. WhatsApp automation costs money and needs Meta verification | Free | WhatsApp Business Cloud API for alerts once revenue exists |
| **Invites & sharing** | `wa.me/?text=` deep links with prefilled Kannada/English text and a rich-preview link | Free and familiar. Drivers already live in WhatsApp | Free | — |
| **Analytics / funnels** | **PostHog** (free tier) | Event funnels for each stakeholder, with no cookie banner needed for basic events | Free ⚠ | — |
| **Error tracking** | **Sentry** free plan | Catches broken alerts before Dad does | Free ⚠ | — |
| **Uptime** | **UptimeRobot** free | Pings the app and the database every 5 min | Free ⚠ | — |
| **CRM / pipeline** | A `leads` table in Supabase + a Google Sheet view for the founder | No CRM subscription. Founder edits it on a phone | Free | HubSpot free only if sales team grows |
| **Repo + CI/CD** | **GitHub** (private repo) + **GitHub Actions** (typecheck, unit tests, Lighthouse) + Cloudflare Pages preview per PR | "Git push = live". Every PR gets a preview URL to test on Dad's phone | Free ⚠ (private repo minutes are limited; keep the CI job short) | — |
| **DB schema changes** | Supabase migrations committed in the repo, applied by the CLI in CI | Reproducible, reviewable schema | Free | — |
| **Secrets** | GitHub Actions secrets + Cloudflare env vars. Never in the repo | Stops key leaks | Free | — |
| **Payments (later)** | UPI deep link (free) first. Razorpay when fees are charged | No fees until someone pays | Razorpay charges per transaction | — |

**What the MVP never touches:** Docker, Kubernetes, Helm, Azure, Expo native builds, Prisma migrations, separate backend deploys.

## 3. DevOps: how we ship daily with one person

```
laptop ──git push──▶ GitHub PR ──▶ Actions: typecheck + unit tests
                         │
                         ├──▶ Cloudflare Pages preview URL  (test on Dad's phone)
                         │
                       merge to main ──▶ production deploy (Cloudflare Pages)
                                        Supabase migration applied (CLI)
```

Rules to keep it fast and safe:
1. **Trunk-based.** One `main`. Short-lived branches (under 2 days).
2. **Feature flags in a config file.** Turn things off without a redeploy (for example, the evening alert).
3. **Preview before production.** A change must be checked on the preview URL with one real driver.
4. **Rollback = redeploy the previous commit** (Cloudflare Pages keeps history).
5. **Daily backup.** Supabase export to a private Google Drive folder, weekly by hand until automated.
6. **Monitoring:** Sentry (errors), UptimeRobot (down), PostHog (funnels). Check each morning for two minutes.

## 4. Cost ceiling for the pilot (honest version)

| Item | Monthly | Notes |
|---|---|---|
| Hosting, DB, auth, realtime, maps, analytics, errors, CI | ₹0 | Within free tiers ⚠ |
| SMS OTP | ~₹500–1,000 | The one real cost. Pilot sign-ups are a few hundred OTPs per month |
| Domain name | ~₹800–1,000/year | Needed for a clean link and WhatsApp preview |
| Posters / stickers (admission season, C3) | ~₹2,000 | Inside the bet cap |
| **Total** | **~₹1,000/month** | Keeps the founder's day job as the safe haven (`04`) |

WhatsApp Business API costs per message and needs a verified business. Don't start it until there is revenue to pay for it.

## 5. Mobile apps and app stores: do you need them?

**No, not for the pilot.** Start with the PWA. Reasons:
- Parents install nothing. They tap a WhatsApp link, enter an OTP, and are in.
- Fixes ship in minutes, not in store review (days).
- Both the Play Store and the App Store cost money and time, and nothing in the pilot needs them yet.

| Store | Cost | Time | When to do it |
|---|---|---|---|
| **Google Play** | One-time **$25** developer account ⚠ | Personal accounts created after late 2023 must run a closed test with **12 testers for 14 days** before production access ⚠ (verify current rule) | When drivers need **background GPS** (phone locked, screen off). Wrap the same web app with **Trusted Web Activity** or Capacitor. Plan this for Feb 2027 |
| **Apple App Store** | **$99/year** ⚠ | Review takes days. Needs an Apple ID and an Xcode build (cloud build options cost money) | After Android is proven and paying users exist. Until then, iPhone users use the web app (Add to Home Screen works; web push works on iOS 16.4+) |

**Background GPS caveat:** a web page can't track a driver with the phone locked. The pilot works if the driver keeps the screen on (Wake Lock) and the app open. That's a real limit, so tell Dad at the start. Play Store also reviews background-location use with a declaration form, so start that paperwork early if Android is the path.

## 6. Shipping calendar (working backwards from the admission window)

Admission and new-term window: roughly **March–June 2027**. Miss it, and the next chance is a year away. The hard deadline is **V1 live by 15 February 2027**.

| When | Milestone | Done means |
|---|---|---|
| **16–29 Nov 2026** | Decide stack (this doc). Create a new repo. Port trip logic + tests. Dad's morning run observed (`10` A1). Read employment contract (`10` C-1) | Empty PWA deploys to Cloudflare Pages via a PR preview |
| **30 Nov–13 Dec** | Supabase schema + RLS. Phone OTP working with a test number. Driver: add van and schools; start/stop trip | Dad starts and stops a real trip on his phone |
| **14–31 Dec** | Parent: invite link → OTP → child + pickup/drop pins. Live map for parent. Web-push alert on "5 min away" | One parent on Dad's van sees the van move on their phone |
| **Jan 2027** | Pilot with Dad + 3 drivers (~50–80 kids). Kannada strings. Evening per-child boarding and absent flag. Daily fixes | 85% of school days have a started trip; no missed alert for 5 days in a row |
| **1–15 Feb** | **Freeze features.** Per-school landing page. Concierge WhatsApp number. Posters printed. Analytics funnels live. Privacy policy and parental consent screen live | **V1 live. Admission-ready.** |
| **15 Feb–28 Feb** | Decide Android wrapper (Play Store, $25 + closed test). Only if background GPS is the bottleneck | Decision recorded in `05` |
| **Mar–Jun 2027** | Admission and new-term window: concierge matches (C3), driver invites (C1), paid tests inside the cap | Results in `05` log. Go/pivot decision by 30 Apr |
| **Jul–Dec 2027** | Scale to cluster #2 only if cluster #1 passes 40% penetration (C10). Start the fleet mode prototype (C8) | — |

**Weekly cadence:** ship to Dad every Monday, review metrics Friday at pickup time (`08` P2).

## 7. What I decided, and what I'm unsure about

| Decision | Confidence | What would change it |
|---|---|---|
| PWA, not native, for the pilot | High | Drivers' phones block background GPS in the field |
| Supabase as the only backend | High | Free plan limits hit before March (unlikely at pilot size) |
| Cloudflare Pages, not Vercel | High | — (avoids the Hobby commercial-use trap) |
| Free SMS doesn't exist. Budget ~₹1k/month | Medium | A cheaper DLT-registered SMS route, or WhatsApp OTP |
| Web push works for parents | Medium | Low-end Android or iOS settings block it. Test on 3 real phones in week 3 |
| Port the logic, not the code | High | — |
