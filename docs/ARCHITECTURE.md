# Architecture and game design

## Product loop

A Signal has a category, optional leading or trailing character, optional canonical-name constraint, a time window, and an event. Valid answers create nodes. The player routes each node, earns points, maintains a chain, and keeps the core alive. A miss damages the core and disconnects a node. Completing a Power–Shield–Memory circuit repairs the system.

The three additional mechanics are:

- **Circuit routing:** Fill all branches to earn a repair and a fixed bonus. Greed and survival compete.
- **Foresight and Echo:** The next Signal is visible. Switching branches while answering the same category produces an Echo, rewarding deliberate routing.
- **Network fingerprint:** A deterministic, answer-free topology becomes the share card. It reflects the run’s routing decisions rather than exposing its solutions.

## Signal generation

A seeded PRNG uses the run seed, Signal index, and generator version. The generator selects a category and a candidate, then constructs constraints. It validates the resulting candidate set before broadcasting. Unsatisfiable constraints are relaxed; corresponding event labels are also reset. Every broadcast has enough distinct local answers to meet its target.

The queued preview is consumed as-is, so the advertised next prompt does not silently change. In adaptive solo modes, exhausted preview candidates cause a Cache Hit, permitting reuse. Daily and local competition allow concept reuse between Signals and reject duplicates within a Signal; this keeps challenge sequences independent of individual answers.

Daily seeds include the UTC date and version. Content releases can change sequences; comparisons assume the same deployed content version. Fixed modes disable adaptive generation. Solo adaptation uses the latest six outcomes and adjusts difficulty gently within one level. Endless adds gradual depth over time.

## Modifiers

| Event        | Implemented behavior                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| Firewall     | Canonical name must contain at least six alphabetic letters                     |
| Mirror route | The Signal character matches the end of a known name or alias                   |
| Overclock    | Shorter time window and 15% scoring multiplier                                  |
| Blackout     | Hide the next-Signal preview, never the current accessible prompt               |
| Packet storm | Two distinct answers to one broad category in one shared window                 |
| Root access  | Double answer score for this Signal                                             |
| Cache hit    | Previously used concepts are eligible again                                     |
| Memory leak  | Temporarily hide the recent-answer log                                          |
| Double route | An answer must belong to both displayed categories                              |
| Checksum     | Canonical name must have an even alphabetic letter count                        |
| Zero day     | First probe reveals an unknown length constraint without invalid-answer penalty |

Zero Day probes consume normal clock time. It is a deduction/decoding variation, not an external security interaction. Packet Storm deliberately uses two answers in one input rather than two competing input fields, preserving keyboard speed and mobile clarity.

## Score

For a valid answer:

```text
speed      = round(100 × max(0, 1 − elapsed / signalDuration))
rarity     = (editorialRarity − 1) × 35
challenge  = round((effectiveDifficulty − 1) × 20)
constraint = 35 when a canonical-name rule is active, otherwise 0
echo       = 45 for same-category answers routed into a different branch
chain      = 1 + min(chainLength − 1, 19) × 0.08
integrity  = 0.8 + health / 500
route      = 1.2 for Power, otherwise 1
event      = 2 for Root, 1.15 for Overclock, otherwise 1
hint       = 0.5 when the current Signal used a hint, otherwise 1

points = round((100 + speed + rarity + challenge + constraint + echo)
               × chain × integrity × route × event × hint)
```

A completed circuit adds 150 points independently. The interface exposes speed, rarity, chain, and total points rather than the full equation. Accuracy counts connected answers divided by connected answers plus missed Signals; rejected guesses are tracked in the run but do not reduce that metric. Rare-answer totals include Rare, Core, and Legendary nodes.

## Engine/UI boundary

`Game` receives explicit timestamps. It does not read DOM, localStorage, network services, or browser clocks. Validation, generation, scoring, and content are separate modules. `main.ts` owns browser events and supplies `performance.now()` to the engine. Revision counters prevent whole-interface updates on every animation frame; the active input is not recreated when the clock ticks.

`NetworkView` owns its Canvas and animation frame, caps visible nodes at 84, caps pixel ratio at 2, and disconnects its ResizeObserver on disposal. Reduced-motion drawing occurs on state/size changes. CSS media queries handle the mobile hierarchy: Signal and input first, compact route controls next, topology below.

## Local competition and future online transport

`modes/match.ts` separates turn seeding and standings from the solo engine. A local match stores named player runs, rotates turns, and uses one shared seed per round. Duel has one 12-Signal turn per player. Party has two 30-second turns per player.

For an online implementation, keep the pure generation/scoring modules but move authoritative time, input validation, and score calculation to a server. A transport should send match seed/version, accepted inputs, route changes, and authoritative state snapshots. Client localStorage and submitted scores are untrusted. No network transport is present in this release.

## Persistence

The versioned profile is validated when read; unknown concept IDs and invalid category keys are discarded. Storage errors fall back to in-memory play. Cosmetic unlocks depend on discoveries and chains. Import is bounded to 2 MB, requires the expected envelope, and passes through the same sanitizing reader. The schema can be adapted to an account/cloud repository later.

## Trust boundaries

User-controlled names and input are escaped before insertion into templates. Answer validation uses strings, never evaluation. There are no secrets or runtime external scripts. All scoring and content are shipped to the browser, so they can be inspected or changed locally. There is intentionally no claim of anti-cheat or verified global rankings.
