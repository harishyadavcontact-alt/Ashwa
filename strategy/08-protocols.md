# 08 — Protocols

Status: v0.1. Protocols turn the frameworks in this folder into repeatable behaviour. They're reusable for other life bets.

---

## P1. Bootstrap Bet Protocol (pilot bets and pivot bets)

Every initiative starts as a **bet card**. No card, no work.

```markdown
### Bet: <name>            ID: B-###      Type: pilot | pivot (of B-###)
Conjecture (ID from 05):
Null hypothesis:
Test / pretotype:
Metric + pass threshold:            Kill threshold:
Cost cap:  ₹____   hours ____      Time box: __ days
Capex: 0 (if not 0, justify)        Opex/month:
Downside if it fails (capped at):
Upside if it works (uncapped because):
Greeks: delta (dependence on one assumption) __ / gamma (does success compound?) __ / vega (gains from chaos?) __
Start date:        Review date:
Result:            Decision: continue | kill | pivot → B-###
```

Rules: capex ≈ 0 · opex minimal · cap hit = fail · thresholds locked before start · log the result in `05` either way.

## P2. Weekly operating rhythm

| Day | Activity | Output |
|---|---|---|
| Mon | Ship release to pilot drivers | Release note in WhatsApp group |
| Daily (15 min) | Read event logs + feedback | One paper cut fixed |
| Wed | One bet review | Bet card updated |
| Fri (pickup time) | Field visit: ride along / school gate | Field notes → conjectures |
| Sun | Weekly review: metrics, bets, risks (`04`), next week's top 3 | Build-in-public post |

**Stop-loss on founder time:** a fixed number of hours per week (set it, e.g. 20). If it's exceeded for 2 weeks running, cut scope, don't add hours.

## P3. Field visit protocol (FDE-style discovery)

1. Go at real operating hours (morning pickup, afternoon drop).
2. Observe before asking. Count calls, waits, absences, payments.
3. Ask about the **last time** something went wrong (not hypotheticals).
4. Never ask "would you use X?" Ask "what did you do last time Y happened?"
5. Write notes within 1 hour: facts / quotes / surprises / new conjectures.
6. Promise only what can ship in a week.

## P4. Child safety incident protocol

| Step | Action | Within |
|---|---|---|
| 1 | Parent or driver reports an incident (helpline WhatsApp) | — |
| 2 | Call the parent and driver; confirm the child is safe; escalate to police/emergency if needed | 15 min |
| 3 | Preserve trip events and location pings for that trip (no deletion) | 1 h |
| 4 | Suspend the driver's discovery listing pending review (`SUSPENDED`) if any doubt | 1 h |
| 5 | Written summary; decision on reinstatement | 48 h |
| 6 | Root cause → product/protocol change | 1 week |

Language rule: Ashwa provides **trip information**, not transport. Never claim "guaranteed safety".

## P5. Data protocol

- Minimum data (see `07` §4). No ID numbers stored, ever.
- Access: parent sees their child; driver sees their own manifest; admin access logged.
- Secrets never in the repo. Rotate on any doubt.
- Deletion on request within 7 days.

## P6. Decision protocol

| Decision type | Rule |
|---|---|
| Reversible (copy, feature, channel) | Decide same day; ship; measure |
| Hard to reverse (pricing to drivers, equity, government agreements, raising money) | Write a one-page memo; sleep on it; ask Dad + one outside mentor |
| Anything touching child safety or data | Default to the conservative option |

## P7. Stakeholder promise ledger

Track every promise made to drivers, parents and schools (date, who, what, due). Broken promises compound geometrically in a trust network.

| Date | Stakeholder | Promise | Due | Kept? |
|---|---|---|---|---|
| | | | | |
