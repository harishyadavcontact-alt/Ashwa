# Ashwa Pilot Release Checklist

## Before Release
- Run `npm install`, `npm run prisma:generate`, `npm run build`, `npm run typecheck`, and `npm run test`.
- Apply database migrations and seed demo data only in non-production environments.
- Confirm `JWT_SECRET`, `DATABASE_URL`, `STORAGE_PATH`, and push credentials are set for the target environment.
- Verify the admin review queue has no drivers marked ready with missing trust information.

## Smoke Validation
- Parent can sign in, add a child, search a verified driver, inspect trust signals, and request a seat.
- Driver can sign in, review trust readiness, accept a request, start a trip, ping location, and emit trip events.
- Parent tracking receives live location and recent events for the active trip.
- Health endpoint responds successfully and logs include request IDs.

## Monitoring
- Check application logs for auth failures, trip validation failures, and notification warnings.
- Confirm database connectivity and disk/storage availability before traffic opens.
- Verify review queue counts for pending, rejected, suspended, and service-ready drivers.

## Rollback Basics
- Keep the previous deploy artifact available until smoke checks pass.
- If critical auth, tracking, or assignment regressions appear, roll back the app and stop new driver verification actions.
- Re-run health and smoke validation after rollback.
