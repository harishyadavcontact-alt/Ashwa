# Ashwa MVP Monorepo

Ashwa is an MVP for private school van coordination with parent trust, live tracking, deterministic trip events, and push notifications.

## Stack
- TypeScript everywhere
- Backend: NestJS + Prisma + PostgreSQL
- Mobile: Expo React Native (parent + driver apps)
- Realtime: `/tracking/ping` + Socket.IO Gateway (`/ws` namespace)
- Notifications: FCM with graceful fallback when credentials are missing
- Maps: react-native-maps (Google Maps key optional)

## Repo Structure
```
ashwa/
  apps/
    mobile-parent-expo/
    mobile-driver-expo/
  services/
    backend-nest/
  packages/
    shared/
  docker-compose.yml
  README.md
```

## Environment
### Backend (`services/backend-nest/.env`)
- `DATABASE_URL`
- `JWT_SECRET`
- `FCM_SERVICE_ACCOUNT_JSON`
- `GOOGLE_MAPS_API_KEY` (optional)
- `STORAGE_PATH`
- `ARRIVAL_RADIUS_METERS` (default 60)
- `PING_INTERVAL_SECONDS` (default 5)
- `TEN_MIN_ETA_SECONDS` (default 600)
- `ASSUMED_SPEED_KMPH` (default 20)

### Mobile
- Parent app `apps/mobile-parent-expo/.env`
  - `EXPO_PUBLIC_API_BASE_URL`
  - `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- Driver app `apps/mobile-driver-expo/.env`
  - `EXPO_PUBLIC_API_BASE_URL`
  - `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

## Setup
1. Start PostgreSQL
```bash
docker compose up -d
```
2. Install deps
```bash
npm install
```
3. Backend migrate + seed
```bash
cd services/backend-nest
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```
4. Run backend
```bash
npm run dev
```
5. Run parent app
```bash
cd ../../apps/mobile-parent-expo
cp .env.example .env
npm install
npm run dev
```
6. Run driver app
```bash
cd ../mobile-driver-expo
cp .env.example .env
npm install
npm run dev
```

## Demo script
1. Login parent (`parent@ashwa.app` / `Password123`).
2. Login driver (`driver@ashwa.app` / `Password123`).
3. Parent requests assignment from driver (`POST /assignments/request`).
4. Driver accepts from inbox (`POST /assignments/:id/accept`).
5. Driver starts trip (`POST /trips/start`) and sends ping every ~5s (`POST /tracking/ping`).
6. Parent Track screen subscribes over websocket and sees moving marker.
7. Driver emits ordered events (`POST /trips/:id/event`) -> backend stores once per `(tripId,childId,eventType)` and tries FCM push.
8. Parent fetches timeline (`GET /events?tripId=`).

## Implemented modules
- AuthModule (email/password JWT)
- UsersModule
- InstitutionsModule
- DriversModule
- ParentsModule
- AssignmentsModule
- TripsModule
- TrackingModule
- EventsModule
- AdminModule

## API minimum endpoints
All required MVP endpoints from specification are implemented in backend controllers.

## Notes
- FCM is optional in local development. If credentials are absent or invalid, backend logs and skips push sending.
- ETA 10-minute events are currently driver-triggered for MVP consistency; fallback speed constants are available in shared config for extension.
- Route ordering is MVP grade with simple stop ordering and pluggable trip-stop generation.
