# Ashwa Pilot

Know where your child's school van is, without calling anyone.

A PWA for parents and van drivers. No app store needed for the pilot. Built to ship fast on free tiers.

- **Stack:** Vite + React + TypeScript (PWA) · Supabase (Postgres, phone login, RLS, SQL functions) · Cloudflare Pages · GitHub Actions.
- **Strategy and decisions:** see the `strategy/` folder in the Ashwa repo (`11-tech-stack-and-shipping.md`, `07-pilot-mvp-spec.md`).
- **Trip rules:** `src/logic/tripProgression.ts` is ported from `Ashwa/services/backend-nest/src/trips/trip-progression.ts`.

## Run locally

```bash
npm install
npm run dev        # demo mode unless .env.local is set
npm test
npm run build
```

## How it works

**Route = one van, one school, one start point.** Each route has two ordered lists of stops:

- **To school (morning):** start → stops → school
- **Back home (afternoon):** school → stops → start

A driver maps the stops in order. The stops are the points the van actually visits. A replacement driver joins the route with its code and sees the same list, so they can follow it without being told.

**Customers.** The owner adds a customer with the child's name, the parent's mobile number, a monthly fee, and a pickup point. The drop point is the same by default. Each point becomes a stop on the route, and stops within 30 m are shared. The owner then sends the parent a WhatsApp link.

**Joining.** When a parent signs in with that mobile number, the child is linked to them automatically.

**Finding a van (new parents).** A parent enters the school name, the child's name, and a pickup point. The app lists vans with free seats for that school, nearest first. Choosing one adds the parent's point as a stop on that route and links the child.

**Runs.** The driver starts a morning or afternoon run and taps each stop in order. The app blocks out-of-order taps, publishes the van's location every 10 s, and parents see the van's position and get a "5 minutes away" alert.

**Fees.** Each child has a monthly fee, set by the owner.
- Driver: marks a child paid (cash, UPI, bank or other), or confirms a parent's report, or marks not received.
- Parent: taps "I've paid", picks how they paid, and adds an optional reference. The driver then confirms.
- The fee is tracked per month, so the driver sees who has paid for the current month.
- The app does not collect money. Parents pay the driver directly, and the app records it.

**Referrals.** Each parent has a referral code and a WhatsApp share link. A new parent who signs up through that link is recorded as referred. There is no joining bonus yet.

## Demo mode vs Supabase mode

- **Demo mode** (no `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`): data stays in this browser's localStorage. Sign in with any 10-digit number and the code `000000`. Use it to try the flows. Never use it with real families.
- **Supabase mode** (variables set): real SMS codes, database rules, and the functions in the migration.

## Database

`supabase/migrations/0001_pilot_schema.sql` holds the schema, row-level security and the functions the parent screens use (`search_routes`, `join_route`, `enrol_child`, `claim_children`, `route_driver_name`). It has not been applied to a real Supabase project yet. Apply it with the Supabase CLI once the project exists:

```bash
supabase link --project-ref <ref>
supabase db push
```

## Known gaps (fix before the pilot)

- **Supabase mode is untested.** The UI and logic were tested in demo mode. The migration and row-level security need a real project to check them.
- Trip rules, seat limits and "one child per stop" are enforced in the app or the functions, not fully on the server. Review before real families use it.
- Parents poll every 10 s. Switch to Supabase Realtime for the pilot.
- Parents can't pick a school from a list yet. They type the school name, and it has to match closely enough.
- Stops added by a parent are placed at the end of the list in Supabase mode. The owner reorders them with the arrows. Demo mode places them at the cheapest position.
- ETA uses straight-line distance at an assumed 20 km/h, not road routing.
- Driver base and stop coordinates: parents can read only their own children's stops. Driver base is still readable by that driver's linked parents, so it needs moving to a driver-only table.
- Web push isn't wired up. Alerts are in-app, plus browser notifications where allowed.
- Driver background GPS needs the screen on. A native wrapper is needed later.
- Template leftovers (`src/App.css`, `public/icons.svg`) are unused and can be deleted.

## Rules

- Never commit `.env*` files or the Supabase service-role key. The app uses the anon key only.
- Child data: minimum fields only (first name, school, pickup and drop points, parent's mobile number). No photos, DOB or ID numbers.
- Trunk-based: short branches, every PR gets a preview deploy, merge to `main` deploys to production.
