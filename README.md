# Ashwa Pilot

Know where your child's school van is, without calling anyone.

A PWA for parents and van drivers. No app store needed for the pilot. Built to ship fast on free tiers.

- **Stack:** Vite + React + TypeScript (PWA) · Supabase (Postgres, phone auth, realtime, RLS) · Cloudflare Pages · GitHub Actions.
- **Strategy and decisions:** see the `strategy/` folder in the Ashwa repo (`11-tech-stack-and-shipping.md`, `07-pilot-mvp-spec.md`).
- **Trip logic:** `src/logic/tripProgression.ts` is ported from `Ashwa/services/backend-nest/src/trips/trip-progression.ts`. It is tested.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL and anon key (later)
npm run dev
npm test
npm run build
```

## What works now

- **Driver:** set up the van (name, seats, base location), share the invite link on WhatsApp, see enrolled children, start a morning or afternoon trip, tap each stop in the right order, publish the van's location every 10 s, end the trip.
- **Parent:** sign in, enter their name, open a driver's invite link (`/parent?driver=<id>`), add a child with school, pickup and drop points, and see live status: waiting, on the van, reached school, dropped. Shows "about N min away" when the van is within 5 minutes of the child's stop. Browser alert if allowed.
- **Trip rules:** the same event order as the legacy backend. The app won't accept a tap out of order.

## Demo mode vs Supabase mode

- Without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, the app runs in **demo mode**: data is kept in the browser's localStorage, and the sign-in code is `000000`. Use it to try the flows. Never use it with real families.
- With the variables set, it uses Supabase: real SMS codes and the row-level security in the migration.

## Known gaps (fix before the pilot)

- Event rules are checked in the app only. Enforce them on the server before real money or real kids depend on it.
- Parents poll every 10 s. Switch to Supabase Realtime once the pilot is running.
- Driver base coordinates are visible to that driver's linked parents. Move them to a driver-only table.
- ETA uses straight-line distance at an assumed 20 km/h, not road routing.
- Web push isn't wired up yet. Alerts are in-app, plus browser notifications where allowed.
- Driver background GPS needs the screen on. A native wrapper is needed later.
- Template leftovers (`src/App.css`, `public/icons.svg`) are unused and can be deleted.

## Database

`supabase/migrations/0001_pilot_schema.sql` holds the pilot schema with row-level security. Apply it with the Supabase CLI once the project exists:

```bash
supabase link --project-ref <ref>
supabase db push
```

## Rules

- Never commit `.env*` files or the Supabase service-role key. The app uses the anon key only.
- Child data: minimum fields only (first name, school, pickup/drop points). No photos, DOB or ID numbers.
- Trunk-based: short branches, every PR gets a preview deploy, merge to `main` deploys to production.
