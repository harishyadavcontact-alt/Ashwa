# YC-style Application Draft (founder's words)

Status: draft, kept verbatim below. Review notes come first.

## Review notes (fix before submitting anywhere)

| # | Issue | Why it matters | Suggested fix |
|---|---|---|---|
| 1 | Father's history doesn't match: "private van driver for two decades" (Location answer) vs "auto-rickshaw driver ... built a fleet" (Idea answer) | Reviewers look for consistency, and founder-market fit is your strongest card | Tell one story: started in an auto, moved to vans, built a fleet over ~20 years |
| 2 | "allows me to work on this even during office hours" | Reads as a red flag about judgement, and it can trigger your employer's IP and moonlighting clauses (tail risk in `04-hedge-edge-stack.md`) | Say "evenings and weekends", and check your employment contract |
| 3 | Product link points to `popitlikecorn/ashwaApp`, but active work is in `harishyadavcontact-alt/Ashwa` | Reviewers click links | Point to whichever repo or demo actually runs, ideally a 60-second video of the dad pilot |
| 4 | "Are people using your product? No" | The single biggest weakness | Run the dad pilot first (`07-pilot-mvp-spec.md`). Even "11 families tracked 140 trips in 3 weeks" changes the application |
| 5 | Monetisation leads with "free until critical mass" | Sounds like a subsidy war, which is the Uber playbook you say you won't copy | Lead with "paid by the desperate": match fee for parents whose driver quit, fill fee for drivers with empty seats (`06-gtm-funnels-growth.md` §3) |
| 6 | Advertising on children's data | Under India's DPDP Act 2023, children's data needs verifiable parental consent, and targeted advertising aimed at children is restricted. This is a reputational and regulatory tail risk | Drop ads on child data. Keep embedded finance and fleet SaaS as the second and third revenue legs |
| 7 | The "dark side" (bribes, grey-zone permits) | It's an honest insight, but written down it can sound like platform-enabled non-compliance | Frame it as "we give drivers a path to compliance" (`02-grand-slam-offers.md`, government offer) |

---

## Verbatim draft

**Who writes code, or does other technical work on your product? Was any of it done by a non-founder? Please explain.**
I handle all coding and technical work. As a Java Developer, I've built the initial prototype from scratch, iterating based on feedback.

**Are you looking for a cofounder?**
Yes, I'm open to a cofounder who is passionate about this problem or brings complementary technical skills. The right partner could accelerate growth and boost our upside, so I'd consider it if the fit is strong.

**Company name:** Ashwa

**Describe what your company does in 50 characters or less.**
Digitize India's Hidden private school van network

**Please provide a link to the product, if any.**
https://github.com/popitlikecorn/ashwaApp/tree/temp-demo-prototype

**What is your company going to make? Please describe your product and what it does or will do.**

In India's crowded cities, the yellow school bus is a myth. Millions of schoolkids are squeezed into small private vans—typically Maruti Omnis and Tempo Travelers—run by local drivers.

Despite serving millions, this ecosystem remains completely offline and informal: routes planned by memory, paid in cash, arranged through word of mouth.

This isn't gig economy app or a one-time booking layer. It's a decade-long relationship where families stick with the same driver from kindergarten through high school.

*Phase 1: Building the Backbone of India's Invisible School Commute*

We're building a full-stack platform :-
For parents: Discover verified operators, track rides real-time, handle payments digitally.
For drivers: Route optimization, seat management, demand aggregation, backup coverage.
This unlocks first-time capabilities: backup drivers for sick days, cross-school pooling, calendar-synced routing, elimination of empty runs—all designed for India's dense, chaotic streets.

*Phase 2: Recurring Commute Infrastructure*

School transport is a daily, high-frequency Recurring Commute. Once stabilized, this loop expands naturally into adjacent commuter segments—garments & factory workers, corporate employees, & shared car pooling networks.

These aren't side bets—they're structurally adjacent and already within reach of our user base.

Every school parent is a commuter elsewhere. Every driver who fills seats today can earn more with off-peak rides tomorrow. What starts as school transport can evolve into the largest distributed network of commercial drivers, private vehicle owners, in India's growing middle class.

*Phase 3: Empowering Fleet Owners, Not Just Logistics*

Most school van operators are small business owners, managing a single van or few but stuck in the analog hell:
1. No backup drivers
2. Manual collections
3. No access to credit
4. No data to grow their business

We give them leverage:
1. Tools to manage routes, find drivers, payments
2. Access to loans to scale business via partner integrations
3. Matching with new ride demand from schools, offices, and factories

Imagine this:
An 18-year-old, fresh out of school, gets a loan for a van, joins the platform, earns daily income, adds more vans, recruits more drivers—gets more customers all within one app.
From driver to fleet owner. From informal to institution.

We're not replacing anything.
We're formalizing something deeply ingrained in Indian life: how kids get to school, how people get to work, and how trust gets built one ride at a time.

When we win school transport, we unlock the rails for India's largest recurring ride network—one that's already moving, but never been mapped.

We are building to make sure no kid is left waiting—and no seat rides empty.

**Where do you live now, and where would the company be based after YC?**
Bangalore, India / Bangalore, India

**Explain your decision regarding location.**
I grew up in Bangalore, where my dad ran was a private van driver for two decades.
I believe the origin of this idea will be a perfect ground zero for my venture.

Moreover, Bangalore is one of the most startup-friendly cities in India.

I would like to pilot in Bangalore, starting with the same network my dad still operates—a dense urban zone with a dozen schools, each with 10–15 independent van drivers and hundreds of students.

This will validate the concept, help refine product-market fit, tune unit economics, and prepare us to scale across Bangalore and then into cities like Chennai, Delhi, Mumbai, and Hyderabad.

**How far along are you?**
I have already built a React Native prototype version for demo purposes to show what the app would look like and am working on the full-stack version now—for both the supply side (Driver app) and demand side (Parents app).

**How long have each of you been working on this? How much of that has been full-time? Please explain.**
I've been working on this idea since March 2025, for the last 4 months now. Most of it has involved talking to my father and his driver friends and working on the code as I learn along the way.

I've been working part-time while holding a full-time developer job at a corporate company. I'm a fresher, so I don't have much work allocated to me at the company, which allows me to work on this even during office hours.

**What tech stack are you using, or planning to use, to build this product? Include AI models and AI coding tools you use.**
Current Tech Stack — Framework: React Native · Language: TypeScript · Navigation: Expo Router · Environment: Expo · Build Tools: Node.js · Backend & Auth: Firebase · Location Services: Google Maps API
AI Tools: GitHub Copilot with Claude AI
Future AI/ML: Route optimization and seat matching, unlocking new value for drivers like off-peak routes and pooling students from nearby schools. Eventually, we'll match drivers with private van owners to help them scale.

*(Note: the current repo `Ashwa` uses NestJS + Prisma + PostgreSQL, not Firebase. Update this answer to match whatever you actually ship.)*

**Are people using your product?** No
**When will you have a version people can use?** I will have a version that people can use in 3 weeks from now.
**Do you have revenue?** no

**Why did you pick this idea to work on? Do you have domain expertise in this area? How do you know people need what you're making?**
This is personal. My father was an auto-rickshaw driver in Bangalore who, over two decades, built a fleet transporting hundreds of schoolkids. I've grown up inside this system—first as one of the kids in the van, later as a stand-in driver when someone quit or didn't show up. I've seen the chaos firsthand and lived the consequences.

This isn't abstract to me. I've been the kid waiting on a corner. The driver navigating narrow streets. The one calming anxious parents. And the one watching our family struggle every time the system broke down.
I have been hurt by all possible way this business can hurt one, being in all the seat as a kid traveling in one, as an adult driving one.

I don't need to guess what's broken—I've lived every angle of it.

Even if I only solved this for my father's network, I'd improve life for 30+ drivers and 400+ kids. But through conversations with people across the country, it's clear this problem exists nationwide.

**Who are your competitors? What do you understand about your business that they don't?**
Most obvious competitors would be ride hailing platforms.

But big companies like uber & ola would never crack this. They don't have insider knowledge and they won't get it through focus groups or surveys. Drivers won't open up to outsiders—especially not about the "dark side" of how this system actually works.

This is not a clean business. Drivers often have to bribe law enforcement, bend regulations, and operate in legal grey zones just to survive. The payment structure is messy: parents are asked to pay two months' advance, cover summer vacations, and deal with cash-based, trust-heavy arrangements. Drivers won't admit any of this to a stranger with a clipboard.

To build a solution that truly works, you need someone who's been in the van. Someone who knows where the pain is without being told. Like the old saying: "If you asked a horseman what he wanted, he'd say a faster horse." Outsiders will chase the wrong problems—building fancy apps for official use cases while the real market is hidden in plain sight.

Solving this means working not just with software, but with how trust works in Indian neighborhoods. There are driver unions to deal with, social norms around trust and safety, emotional switching costs, and entrenched offline behaviors. To navigate that, you need a team that's fast, gritty, and path-dependent. A team that can build features based on how the system actually works, not how they wish it worked.

Just like Uber had to navigate taxi unions and local politics, we'll need to do the same here—but from the bottom up. This can only be pulled off by a lean, stubborn startup with real ground truth and relentless execution.

**How do or will you make money? How much could you make?**
We'll start by offering the platform for free to both parents and drivers. Once we reach critical mass—where joining the app becomes the default, not the exception—we'll have pricing power. At that point, we'll take a small cut from each recurring ride, from both the parent and the driver.

As the network matures, we'll unlock multiple revenue streams:

Fleet Management Tools: Van owners will use the platform to find replacement drivers when someone calls in sick. Eventually, they'll also use it to scale—applying for loans, buying new vans, hiring drivers, and matching with demand (school kids, workers, employees).

Embedded Finance: If we become the largest network of private commercial vehicle owners, drivers, and daily riders, we'll have leverage with lenders. We can take a cut from financing (loans for vehicles, driver insurance, working capital).

Targeted Advertising: With verified data on families, school zones, and children's age groups, we'll be able to build a high-intent ad platform—valuable for brands targeting school-going kids, educational services, tutoring centers, and training institutes.

In short: this starts as a trust-driven school commute marketplace. But it scales into a vertically integrated platform that connects vehicles, drivers, families, and finance—unlocking multiple monetization layers as we grow.

**Which category best applies to your company?** Transportation

**If you had any other ideas you considered applying with, please list them.** *(blank)*
