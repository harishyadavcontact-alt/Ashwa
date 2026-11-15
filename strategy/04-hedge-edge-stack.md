# 04 — Hedge Stack, Edge Stack & Option Greeks

Status: v0.1. Frameworks: Mark Spitznagel (*Safe Haven*, *The Dao of Capital*), Taleb (convexity, via negativa), options thinking.

**Core rule: linear costs, geometric returns. Cap the downside, uncap the upside. Be long volatility.**

---

## 1. Safe havens — Spitznagel's three types, applied to the founder and the venture

| Type | What it means | Ashwa / founder equivalent | Status |
|---|---|---|---|
| **Store of value** | Preserves capital; doesn't pay off in a crash, but doesn't lose | **Your day job + savings runway.** Don't quit until the pilot proves C1–C3 | Keep |
| **Insurer** | Small steady cost, big payoff in a crisis | **Backup-driver pool**: costs little in normal weeks, pays off hugely when a driver is sick or quits. **Verification records**: cheap now, priceless after an incident | Build in Phase 1 (manual first) |
| **Alpha** | Protects *and* compounds | **Dad's network + insider knowledge.** Nobody can buy it, and it compounds with every driver onboarded | Use now |

Spitznagel's point: a good safe haven lets you take **more** risk elsewhere. The day job lets you run aggressive, non-predictive bets on Ashwa without existential risk.

## 2. Hedge stack — what can hurt us, by type

| Class | Risk | Likelihood (pilot) | Impact | Cost-effective mitigation | Owner |
|---|---|---|---|---|---|
| **Catastrophic (ruin)** | Child harmed on an Ashwa-tracked trip and the brand is blamed | Low | Ruin | Clear terms (we provide information, not transport); incident protocol (`08`); verified drivers only for new matches; never market as "safety guarantee" | Founder |
| | Child location data leak | Low–Med | Ruin | Collect the minimum (no child photos, no DOB); location only during active trips; access restricted to parent + driver; auth on everything; DPDP consent | Founder |
| | Employer IP or moonlighting claim on the code | Med | Ruin for the company | Read the employment contract; build on personal devices and time only; get written clearance if needed | Founder |
| | Regulatory crackdown on unpermitted vans | Med | High | Path-to-compliance positioning; never the enforcement arm; diversify beyond grey-zone vans as you grow | Founder |
| **Fractional (% loss)** | Parents stop opening the app after novelty fades | Med | Med | Push alerts are the value, not app opens. Measure alert delivery, not DAU | Product |
| | Driver forgets to start the trip | High | Med | One-tap start; auto-start reminder at the usual time; Dad as peer coach | Product |
| | Off-platform leakage (later, for paid features) | High | Low early | Charge only for what needs the platform (matching, backups) | Business |
| **Geometric (compounding)** | One bad driver → trust erosion across the cluster | Low | High | Verification + suspension; parent vouch system; respond within 24h | Ops |
| | Founder burnout | Med | High | Fixed weekly cadence (`08`); one cluster only; stop-loss on hours per week | Founder |
| | Volatility drag: chasing many clusters at once and winning none | Med | High | Concentrate: one cluster until >40% | Founder |
| **Linear costs** | Maps API, SMS/OTP, hosting | Certain | Low | Free tiers; OSM/MapLibre for display; distance math locally; WhatsApp/Firebase phone-auth free quotas; one small VM | Eng |
| | Founder time | Certain | Med | Automate only what was done manually ≥3 times | Founder |

**Via negativa list (things we will NOT do):** monetise child data; promise safety; lend from our own balance sheet; pay to acquire drivers; expand to cluster #2 before #1 is dense; quit the job before C1–C3 pass.

## 3. Edge stack — what compounds for us

| Edge | Mechanism | Metric | Convexity source |
|---|---|---|---|
| Supply-led distribution | 1 driver → 15–30 parents | Parents per driver invite | Each driver unlock is a batch, not one user |
| Parent → parent | Live-trip card shared to family and groups | Shares per active parent | Free reach into school WhatsApp groups |
| Driver → driver | Backup pool + referral | New drivers per existing driver | Supply density lowers match time |
| Density flywheel | More vans per cluster → faster matches → more parents → more vans | Driver penetration % per cluster | Winner-take-most per cluster |
| Data → credit | Trips + collections = underwriting signal | Loans originated via partners | Finance revenue with zero book risk |
| Disorder (long vol) | Driver quits, strikes, Uber surge pricing, new safety rules | Inbound spikes after disruptions | We gain from chaos; incumbents lose |

## 4. Option Greeks — tuned for the venture

Think of Ashwa as a portfolio of cheap call options (bets). We want: cheap premium, slow decay, high convexity, and a payoff from volatility.

| Greek | Meaning in markets | Meaning for Ashwa | Target | How |
|---|---|---|---|---|
| **Delta** (direction exposure) | P&L vs underlying move | How much each bet depends on one assumption being right | **Low per bet**, many bets | Small, independent pilot bets (`05`); none needs a forecast to be right |
| **Gamma** (convexity) | Delta grows as you win | Wins accelerate: each success makes the next cheaper | **High** | Network effects, referrals, density. Design every feature to create a share or invite |
| **Theta** (time decay) | Premium lost per day | Burn per week, and seasonal windows closing | **Near zero burn**; time bets to season | Keep the job (no burn); align launches to academic term start and admission season, when theta flips in our favour |
| **Vega** (volatility) | Gains from rising volatility | Benefit from disorder in the market | **Long vega** | Backup pool, verification and concierge matching all get *more* valuable when drivers quit, rules change or Uber spikes |
| **Rho** (rates) | Sensitivity to interest rates | Dependence on cheap capital | **Low now** | Bootstrapped; finance layer via partners so rate risk sits with lenders |
| **"Alpha"** (edge) | Return beyond risk taken | Insider knowledge + Dad's network | **Maximise** | Spend founder time on the field, not on things anyone could build |

**Barbell:** ~90% of effort on the safe, boring core (tracking + alerts for Dad's network), ~10% on wild, cheap, high-upside bets (concierge match fees, a school endorsement, a government MoU, Instagram reels). Nothing in the fragile middle (a big city-wide launch, paid ads at scale, a big hire).

## 5. Reuse this for other life bets

The same template works for any bet: identify the safe haven, list the hedge stack by class, list the edge stack, set the Greeks, write the via-negativa list, run it as a capped pilot bet (`08-protocols.md` bet card).
