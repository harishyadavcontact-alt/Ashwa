# Ashwa MVP Monorepo

Ashwa is a school-transport MVP with parent trust signals, deterministic trip events, live tracking, and dual mobile clients for parents and drivers.

## Stack
- TypeScript across the repo
- Backend: NestJS + Prisma + PostgreSQL
- Mobile: Expo React Native (parent + driver)
- Realtime: authenticated Socket.IO gateway on `/ws`
- Notifications: Expo permissions on mobile, FCM-backed push on backend when credentials exist

## Repo Structure
```text
ashwa/
  apps/
    mobile-parent-expo/
    mobile-driver-expo/
  packages/
    shared/
  services/
    backend-nest/
  docs/
    release-checklist.md
    pilot-launch-runbook.md
  .github/workflows/ci.yml
  docker-compose.yml
```

## Environment
### Backend `services/backend-nest/.env`
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV`
- `PORT`
- `STORAGE_PATH`
- `FCM_SERVICE_ACCOUNT_JSON`
- `GOOGLE_MAPS_API_KEY`
- `ARRIVAL_RADIUS_METERS`
- `PING_INTERVAL_SECONDS`
- `TEN_MIN_ETA_SECONDS`
- `ASSUMED_SPEED_KMPH`

### Mobile apps
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

## Local Bootstrap
1. Start PostgreSQL:
   ```bash
   docker compose up -d
   ```
2. Install dependencies and generate Prisma client:
   ```bash
   npm install
   npm run prisma:generate
   ```
3. Copy env files and seed local data:
   ```bash
   copy services\backend-nest\.env.example services\backend-nest\.env
   copy apps\mobile-parent-expo\.env.example apps\mobile-parent-expo\.env
   copy apps\mobile-driver-expo\.env.example apps\mobile-driver-expo\.env
   cd services\backend-nest
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```
4. Build and verify:
   ```bash
   cd E:\Ashwa
   npm run build
   npm run typecheck
   npm run test
   ```
5. Run services:
   ```bash
   npm run dev
   cd apps/mobile-parent-expo && npm run dev
   cd ../mobile-driver-expo && npm run dev
   ```

## Core APIs
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/device-token`
- `GET|POST|PATCH /children`
- `GET /institutions`
- `GET /drivers/search`
- `GET /drivers/me/summary`
- `GET /drivers/:id/summary`
- `POST /assignments/request`
- `GET /assignments/incoming`
- `GET /assignments/current`
- `POST /trips/start`
- `POST /trips/:id/end`
- `GET /trips/current`
- `GET /trips/today`
- `POST /tracking/ping`
- `POST /trips/:id/event`
- `GET /events`
- `GET /health`
- `GET /admin/drivers`
- `GET /admin/drivers/review-queue`
- `POST /admin/drivers/:driverId/reject`

## Reliability Notes
- Backend requests are validated against shared contracts in `packages/shared`.
- Tracking subscriptions require auth and are scoped to real trip or driver access.
- Driver trust readiness is enforced before parents can request a driver or drivers can start trips.
- Parent and driver apps are now structured app shells instead of single-file demos, but they still need the full product backlog from Linear to reach pilot-complete depth.
- CI validates install, Prisma generation, build, typecheck, and tests on pushes and pull requests.
- Pilot operations docs live in [docs/release-checklist.md](/E:/Ashwa/docs/release-checklist.md) and [docs/pilot-launch-runbook.md](/E:/Ashwa/docs/pilot-launch-runbook.md).
