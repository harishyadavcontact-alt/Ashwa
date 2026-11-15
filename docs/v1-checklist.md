# Ashwa V1 checklist

Date: 2026-11-16. Maps the Grand Slam Offers in `strategy/02-grand-slam-offers.md` to the features in the app, with status and copy.

**Status key**
- **Live (demo)**: works in the app, tested in demo mode in the browser or with unit tests.
- **Needs Supabase**: the code and SQL are written, but not yet run against a real Supabase project.
- **Not built**: planned, not in the app.

---

## 1. Features by stakeholder

### Existing van drivers (Dad's network: the first 10)

| Promise (GSO) | Feature | Status |
|---|---|---|
| Stop the "where are you" calls | Live map and automatic parent updates during a run | Live (demo); needs Supabase |
| Customers stay mine | Ownership promise on the setup screen; no other driver shown to my families | Copy in place; policy to confirm with Dad |
| Set up in one minute | Name, then Start; route from current location | Live (demo) |
| Add my families in one tap | Customer form: name, phone, fee, home from current location; send WhatsApp invite | Live (demo) |
| See who joined | Pins and customer list show Joined or Invited | Live (demo) |
| Invite families from my pin | Tap a pin, then Invite | Live (demo) |
| Run the morning and afternoon | Run screen: one big button per stop | Live (demo) |
| Track fees by month | Fees tab: Got cash, received, undo | Live (demo) |
| Share with other drivers | Invite a driver button, with referral link | Live (demo); needs Supabase |
| Replacement driver | Route code: a driver joins and runs the route | Live (demo) |

### New van drivers (2 in the first 90 days)

| Promise | Feature | Status |
|---|---|---|
| Get started without a fleet | Same as above, plus "Join with code" from a referral | Live (demo) |
| Earn from empty seats | Parents search by school, see seats left | Live (demo); seat fee not built |
| Get verified | Verification pending chip; founder verifies in admin | Live (demo); needs Supabase |

### Existing parents (switching from cash and calls)

| Promise | Feature | Status |
|---|---|---|
| Know where my child is | Map with the van moving, child card with minutes away | Live (demo) |
| No calls | Updates: on the van, reached school, dropped | Live (demo) |
| Join in one tap | WhatsApp link from the driver, then sign in with my mobile | Live (demo); needs SMS (Supabase) |
| Pay without cash hassle | Pay button: UPI, cash or bank, then the driver confirms | Live (demo) |
| Family can see too | Invite a parent button | Live (demo) |

### New parents (desperate: admissions, moving, a driver quits)

| Promise | Feature | Status |
|---|---|---|
| Find a van near my home | Search by school; vans sorted by distance; seats left | Live (demo); school suggestions need Supabase |
| Choose my home on the map | Use my location, or pin on the map | Live (demo) |
| Meet the driver before paying | Driver name and seats in results | Live (demo); meeting is manual |
| Money-back if no match | Concierge process, outside the app | Manual |

### Recruits (cofounder and first team)

| Promise | Feature | Status |
|---|---|---|
| Real work with drivers | Public repo and build-in-public updates | Manual (GitHub) |

### Funders

| Promise | Feature | Status |
|---|---|---|
| Show traction | Admin page: verified drivers and 7-day event counts | Live (demo); needs Supabase |
| Show retention | Event log: trips started, updates tapped | Live (demo) |

### Government and regulators

| Promise | Feature | Status |
|---|---|---|
| Verified drivers only | Verification before search | Live (demo); needs Supabase |
| Privacy by design | Consent, privacy notice, delete my data | Live (demo) |
| Data for safety audits | Trip records kept; export not built | Partial |

### Schools (added)

| Promise | Feature | Status |
|---|---|---|
| Safe, verified vans | Verified drivers list | Partial |
| School link for parents | Not built | Not built |

---

## 2. Go-live steps for tomorrow morning

These need your accounts. I can't create them from this laptop.

1. **Supabase project.** Create one (free). Send me the project URL and the anon key. Never send the service-role key.
2. **Apply the SQL in order:** `0001`, `0002`, `0003`, `0004`, `0005` (in `supabase/migrations`). Use the SQL editor, or the CLI.
3. **Make yourself admin.** In the SQL editor, run `insert into public.admins (user_id) values ('<your auth user id>');`. You find the id under Authentication, after your first sign-in.
4. **Phone sign-in.** In Supabase, turn on Phone auth and connect an SMS provider. Test with your own number before anyone else.
5. **Host the app.** Cloudflare Pages, connected to the `pilot-scaffold` branch. Add the two `VITE_` variables. Note the URL.
6. **Test on a real phone.** Sign in, add a route, add one family, open the parent link on a second phone, start a run.
7. **Dad's first day.** Dad signs in, creates his route from where he parks, adds his families, and sends the invite links.

---

## 3. Copy for the screens

Keep it short. One line of help at most.

| Screen | Copy |
|---|---|
| Sign in | "Sign in with your mobile" · button: "Get code" · code field: "6-digit code" |
| Parent name | "Your name" · "Continue" |
| Driver name | "Your name" · "Start" |
| Consent (parent) | "I agree that my child’s details are used only for their van. Privacy" |
| Consent (driver) | "I will keep my customers’ details private. Privacy" |
| Driver home | "New route" · "Invite a driver" · "Join with code" |
| New route | "Use my location: van start" · "Use my location: school gate" · "Create route" |
| Customers | "Add customer" · "Use my location: pickup" · "Send invite" |
| Pin: families | "Joined" · "Invite" |
| Run | "Morning run" · "Afternoon run" · next step: "Reached pickup", "Picked up", "Reached school", "Left school", "Reached drop", "Dropped" |
| Fees | "Got cash" · "Received" · "No" · "Undo" |
| Parent map | Child card: "On the van" · "Van coming" · "Home" · "No run" |
| Pay | "Pay ₹1500" · "I paid" · "Sent to driver" |
| Find a van | "Find vans" · "Choose" · "Tap your home" · "Confirm home" |
| Account | "Invite a parent" · "Switch to driver" · "I also run a van" · "Delete my data" |
| Verification | "Verification pending" · "Not approved" · "Paused" |

---

## 4. Known risks before real families

- The map tiles are free OpenStreetMap; heavy use needs a paid tile host.
- The map library makes the first load about 1.4 MB. It should load only on map screens.
- Parent updates work while the app is open. Background push needs a Supabase function and keys.
- Trip rules and seat limits are checked in the app and the functions, not fully on the server.
- Driver consent is logged as an event, not stored on the driver's record.
- The privacy notice is a draft: have a lawyer review it.
