# Ashwa Pilot Launch Runbook

## Ownership
- Product owner: confirms pilot scope, participating institutions, and support contacts.
- Engineering owner: validates build, deploy, environment config, and health checks.
- Operations/admin owner: reviews driver trust states and handles verify, reject, or suspend actions.

## Driver Verification Policy
- `PENDING`: default state while documents or service data are incomplete or awaiting review.
- `VERIFIED`: driver is review-approved and fully configured for parent-visible search and assignment requests.
- `REJECTED`: review failed; driver must correct missing or invalid data before a new review.
- `SUSPENDED`: driver is intentionally hidden from parents and must not receive new work.

## Incident Handling
- Auth or API outage: check `/health`, request logs, and database reachability first.
- Tracking mismatch: verify active trip exists, driver remains verified and service-ready, and websocket auth succeeds.
- Parent reports missing trust data: inspect `/admin/drivers/review-queue` and the driver summary payload for missing items.
- Driver cannot start trip: confirm verification is `VERIFIED`, required documents exist, vehicle is configured, and at least one institution is linked.

## Support Procedure
1. Identify whether the issue is parent-facing, driver-facing, or admin-facing.
2. Capture the affected user, trip, and request time from logs or support report.
3. Check trust summary and review queue state before modifying assignments.
4. Prefer suspension over silent edits when trust or document integrity is unclear.
5. Record the resolution and any follow-up task in Linear.

## Secret Ownership
- Engineering owns `DATABASE_URL`, `JWT_SECRET`, `STORAGE_PATH`, and service deployment config.
- Operations owns push credential rotation and admin account access.
- Product/ops jointly own seed/demo account handling for pilot support.
