# User journeys and the dream app

Date: 2026-11-16. Built from `strategy/02-grand-slam-offers.md` and `docs/v1-checklist.md`.

## First principles

1. **The trust is the product.** A parent who believes the van is coming pays, stays, and refers. A driver who gets paid on time stays and invites.
2. **People already run this on WhatsApp.** We don't ask anyone to learn a new habit. We add a link to the chat they already use.
3. **One tap per decision.** Every screen should have one obvious next step. If it needs a paragraph, the product is wrong.
4. **Do the work for the user.** The phone knows where it is. Use it. Ask for a name, a number and a school, and nothing else.
5. **Money is a record, not a transaction (for now).** We record what changed hands. We don't take it.
6. **The day is the unit.** Everything is organised around one school run, morning and afternoon.

Three words for every screen: **see it, tap it, done.**

---

## Persona 1: Existing driver (Dad, and the 30+ drivers like him)

**Who he is:** runs a van with 8–12 kids, has done it for 10+ years, knows every family and every gate. Phone is a WhatsApp and call device. Pays attention to money. Distrusts apps that make him work more.

**Job to be done:** stop the calls, get paid without chasing, and keep his families from leaving.

**User stories**
- As a driver, I want my families to see where my van is, so that they stop calling me while I drive.
- As a driver, I want to add a family by sending one link, so that I don't type their details.
- As a driver, I want to see who has paid this month at a glance, so that I don't keep a notebook.
- As a driver, I want to know which families have joined, so that I know who still needs the link.
- As a driver, I want to start my run with one tap and tap each stop as I reach it, so that the parents hear it without me calling.
- As a driver, I want a replacement driver to run my route when I'm sick, so that no child is left waiting.
- As a driver, I want to tell another driver about the app, so that they can join my network.

**Journey (the first 10 minutes, a Sunday evening)**
1. Dad opens the link his son sent on WhatsApp. He taps it.
2. Enters his mobile. Gets a code. Types it. Done.
3. Types his name. Ticks one box. Taps Start. (No seats, no forms.)
4. Taps "Use my location" while standing at the van's parking spot. Names the school. Taps "Use my location" at the school gate. Taps Create route.
5. Taps "Add customer". Types the child's name and the parent's number. Taps "Use my location" while standing at the house, with the parent on the phone. Sets fee. Taps Save.
6. Taps "Send invite". WhatsApp opens with the message ready. Sends.

**Moment of truth:** the first parent joins and the pin turns green. Dad sees it on his phone and feels the app is working for him.

**Daily journey (Mon–Fri)**
1. Morning, 7:00: opens the app. Sees today's route on the map. Taps **Morning run**.
2. At each stop: one big button. "Reached pickup." Then "Picked up." The next stop appears.
3. At school: "Reached school." Done. Parents got each message without a call.
4. Afternoon: **Afternoon run** → "Left school" → each drop.

**Month-end:** opens Fees. Sees who has paid. Taps "Got cash" for each one. Done in 2 minutes.

**The dream for Dad:** he never types a phone number after the first day, never explains the app to a parent, and his phone shows only today's run. The app is quieter than his notebook.

---

## Persona 2: Existing parent (switching from calls and cash)

**Who she is:** works, has one or two kids, pays the driver monthly in cash or UPI. Worries about the van being late. Gets WhatsApp messages from the driver's group. Doesn't want another app.

**Job to be done:** know when my child is picked up, and when the child is home. Stop chasing the driver.

**User stories**
- As a parent, I want to join from the link my driver sent, so that I don't have to search for anything.
- As a parent, I want to see the van on a map, so that I know how far away it is.
- As a parent, I want a message when my child is picked up and dropped, so that I can stop worrying.
- As a parent, I want to tell the driver I've paid, so that the driver stops asking me.
- As a parent, I want to add a second child on the same van, so that I manage both in one place.
- As a parent, I want to share the app with a friend, so that they can join through me.
- As a parent, I want to delete my data, so that I control what's stored.

**Journey (first 3 minutes)**
1. Tap the link from the driver. The app opens on the map, with a short sign-in.
2. Enter my mobile. Enter the code. Type my name. Tick the box. Done.
3. The app already knows my child. It shows the van on the map, with my child's name on my stop.

**Daily journey**
1. Morning: a card says "Van coming, 6 min away." Tap the card to see the van.
2. "Ravi is on the van." Then "Ravi has reached school."
3. Afternoon: "The van has left school." Then "Ravi has been dropped off."

**Month-end journey**
1. A card shows "₹1500 due this month." Tap **Pay**.
2. Pick UPI, Cash or Bank. Tap "I paid." The card shows "Sent to driver."
3. Driver confirms. The card shows "Paid."

**Moment of truth:** the first "dropped off" message, while she's in a meeting. She doesn't call anyone.

**The dream for a parent:** the app is a single card per child, the van moves on a map, and the messages are the only things that interrupt her. Paying takes two taps.

---

## Persona 3: Ideal new driver (a replacement, or a young person buying a van)

**Who he is:** 18–30, has a licence and a van or access to one. Wants income. Doesn't have customers yet. Uses a smartphone all day. Trusts other drivers more than ads.

**Job to be done:** get enough families quickly to cover the EMI, and build a reputation.

**User stories**
- As a new driver, I want to see which schools near me need a van, so that I know where to start.
- As a new driver, I want to join an existing route as a replacement, so that I earn while I build my own.
- As a new driver, I want to be verified quickly, so that parents trust me.
- As a new driver, I want families to find me in search, so that I don't have to chase them.
- As a new driver, I want a clear path from replacement to owner, so that I can grow.

**Journey (joining through a driver's invite)**
1. An existing driver sends "Join me on Ashwa" on WhatsApp.
2. Opens the link. Signs in with mobile. Types name. Ticks the box. Start.
3. Taps "Join with code" and enters the route code, or taps "Use my location" to see vans nearby (later).
4. Sees the route on the map. Runs the morning with the driver's permission.

**Journey (starting his own route)**
1. Taps "New route." Uses current location for the van start, then the school gate.
2. Adds the first families from the search, or from his own network.
3. Sees a "Verification pending" chip. Visits the founder (or Dad) with his papers.
4. Once verified, appears in parent search. First new family arrives.

**Moment of truth:** the first family finds him in search and joins without a call.

**The dream for a new driver:** he has a route and a waitlist within a week, and he never needs to explain what Ashwa is. The app tells him what to do next.

---

## Persona 4: Ideal new parent (moving, admissions, or a driver quit mid-year)

**Who they are:** just moved to the area, or their child is starting school next month, or their driver left. Anxious. Searching for a trusted van now. Doesn't know any drivers.

**Job to be done:** find a safe, reliable van for my child, near my home, this week.

**User stories**
- As a new parent, I want to find vans for my child's school near my home, so that I can choose one.
- As a new parent, I want to see the driver's name, seats, and how far they are, so that I can judge quickly.
- As a new parent, I want to meet the driver before I pay, so that I trust them.
- As a new parent, I want my money back if no van is found, so that I'm not at risk.
- As a new parent, I want to see other parents' endorsement, so that I believe it's safe.

**Journey**
1. Opens Ashwa from a Google search or a school poster. Enters mobile. Name. Consent.
2. Taps "Add child": the child's first name, the school (suggested as they type).
3. Taps "Find vans." Sees 2–3 vans, nearest first, with names and seats left.
4. Taps "Choose." Taps "Use my location" to set home. Confirms.
5. Sees the driver's card. Taps "Meet the driver" (contact through the app, or a call).

**Moment of truth:** the first morning the van arrives at their door on time.

**The dream for a new parent:** in under three minutes they have a van, they know the driver, and they have a safety net if it fails. The first screen tells them what this is in one sentence.

---

## Ideal app for the driver (the dream, in one screen)

- **Home:** today's run is the top card. One big button: "Start morning run."
- **During a run:** a map with the van at the centre. One big button for the next step. Progress bar. Nothing else.
- **Families:** a map of pins. Green pins are joined. Grey pins have a one-tap invite. Tap a pin to see its families.
- **Money:** a list for the month. "Got cash" and "Received" as the only actions.
- **Growth:** "Invite a driver" and "Invite a family" always in the same place.
- **Setup:** name, one tap for location, done. Everything else can wait.

What it does **not** do: no dashboards, no reports, no charts, no settings screen on day one.

## Ideal app for the parent (the dream, in one screen)

- **Home:** the map, and one card per child.
- **Card:** the van's status in three words ("On the van", "Van coming", "Home"), minutes away when it's close, and a pay button when a fee is due.
- **Messages:** a timeline that appears only when something happens. Never a feed.
- **Family:** "Invite a parent" in the account screen.
- **Privacy:** "Delete my data" in the account screen. Plain words.

What it does **not** do: no ads, no price comparisons, no chat with the driver on day one.

---

## Gaps between today's app and the dream

| Gap | Affects | Next step |
|---|---|---|
| Map loads everywhere (1.4 MB) | All | Load only on map screens |
| Parents don't get updates when the app is closed | Parent | Web push via Supabase function |
| Driver can't see "joined" on the route map without tapping | Driver | Show count on the pin |
| No "meet the driver" action | New parent | Show the driver's number after the parent pays the match fee |
| No waitlist when search finds nothing | New parent, new driver | Capture school and home as a waitlist entry |
| New driver can't see nearby schools needing a van | New driver | Show "families looking" count by school |
| No "absent today" flag | Driver | Add a one-tap absent button per child |
| No incident button | Driver, parent | Add "Report a problem" on the run screen |
