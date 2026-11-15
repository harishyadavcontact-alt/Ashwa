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
