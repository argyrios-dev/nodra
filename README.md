<div align="center">
  <img src="public/wordmark.svg" alt="NODRA" width="330">
  <p><strong>Think fast. Build the network.</strong></p>
  <p>A browser game where your knowledge becomes living infrastructure.</p>
</div>

---

A Signal arrives: a letter, a category, a constraint. Your answer becomes a node. Route it into **Power**, **Shield**, or **Memory**. Connect all three branches to close a circuit, repair the core, and keep the network alive.

NODRA is a complete static application built with TypeScript, Vite, Canvas, and Web Audio. No account, backend, external model, runtime CDN, analytics, or API key is required. The first page load requires access to the host; gameplay and validation then run locally. There is no service worker or promised offline reload.

## Play in ten seconds

1. Press **Play** and read the Signal.
2. Type a matching answer and press **Enter**.
3. Keep connecting before the core collapses.

A common answer submitted quickly is valuable. Rare answers earn more. Wrong guesses can be retried; an expired or skipped Signal damages the network.

| Route              | Effect                                         |
| ------------------ | ---------------------------------------------- |
| **Power** · Alt+1  | 20% more answer points                         |
| **Shield** · Alt+2 | Store 8 protection, up to 30                   |
| **Memory** · Alt+3 | Restore 4 extra health                         |
| **All three**      | +150 points, +12 health, and one repaired node |

Every correct answer also restores 2 health. Health is capped at 100. Repeating a category on a different branch creates an **Echo** bonus. The **next-Signal preview** makes forward planning possible. Every finished run produces an answer-free **network fingerprint** for sharing.

## Eight playable modes

| Mode         | Format                                                                     |
| ------------ | -------------------------------------------------------------------------- |
| Quick run    | 90 seconds or network collapse                                             |
| Endless      | Escalating difficulty until collapse                                       |
| Daily Signal | 12 deterministic Signals, refreshed at midnight UTC; Standard for everyone |
| Local party  | 2–8 players, two rounds of alternating 30-second turns                     |
| Duel         | Two players, the same 12 Signals, sequential turns on one device           |
| Tech mode    | Programming, systems, Linux, networking, security, and computing           |
| Garage mode  | Manufacturers, models, automotive technology, and racing                   |
| Chaos mode   | Shorter windows and a much higher frequency of modifiers                   |

**Duel is local, not online multiplayer.** Players pass the device and avoid watching the other turn. The seeded engine and separate match coordinator provide a foundation for a future transport layer, but no server, matchmaking, remote opponents, or online leaderboard is implemented or implied.

Beginner, Standard, Expert, and Nightmare vary category complexity, answer difficulty, constraints, spelling tolerance, and pacing. Solo modes adapt gradually. Daily and local competitive sequences never adapt to individual performance. Repeated concepts across different Signals are allowed in fixed competitive sequences; duplicates within one Signal are always rejected.

## A living, three-dimensional network

The home topology uses real perspective projection of 3D coordinates. Scrolling rotates the network and separates its layers. During play, packets move between routed nodes; misses disconnect nodes; circuits repair them. The renderer caps device pixel ratio and visible node count, uses Canvas, and respects reduced motion.

The visual identity uses an angular connected-node **N**, warm white, near-black, and signal orange. Ice Blue and Phosphor are earned cosmetic finishes. No gameplay advantage can be unlocked.

## Knowledge, collected

- **2,001 canonical concepts** across **29 categories**.
- Case-insensitive validation, curated aliases, accent and punctuation normalization, and safe category-specific plural handling.
- Beginner-only single-edit spelling assistance for unambiguous longer answers.
- Technical punctuation stays meaningful: `C`, `C++`, and `C#` remain distinct.
- A collectible Codex with search, categories, canonical names, accepted aliases, and 55 short contextual facts.
- Four editorial node tiers: Basic, Rare, Core, and Legendary. These are game-design tiers, not measured global answer frequencies.

The validator uses a finite local dataset. A real answer that has not been curated can be rejected; the interface explains this and allows another attempt. No external AI adjudicator is simulated.

Read [the content guide](docs/CONTENT.md) to expand the database.

## Local development

Use **Node.js 24** and npm.

```bash
npm ci
npm run dev
```

```bash
npm test          # Engine, validation, fairness, and generation checks
npm run build    # Type-check and produce dist/
npm run preview  # Serve the production build
```

There are no production dependencies. Vite and TypeScript are build tools.

## Publish on GitHub Pages

1. Open this repository’s **Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Open **Actions → Deploy GitHub Pages → Run workflow** and select `main`.
4. Open the deployment URL shown by the completed workflow.

The deployment workflow is intentionally manual so that pushing code does not change the public website without running it. The separate verification workflow runs on pushes and pull requests and produces a downloadable static build.

Vite uses relative asset paths, so the build works under a repository subpath. `dist/` can also be served by any static host. Open it through an HTTP server, not a `file://` URL.

## Controls and accessibility

| Control               | Action                                                                 |
| --------------------- | ---------------------------------------------------------------------- |
| Enter                 | Submit an answer; start from the home screen when no control has focus |
| Alt+1 / Alt+2 / Alt+3 | Power / Shield / Memory                                                |
| Escape                | Pause or close the active dialog                                       |
| Tab / Shift+Tab       | Navigate controls                                                      |

Touch controls expose the same actions. There are visible focus states, labeled inputs, semantic dialogs, live answer feedback, a high-contrast setting, and system-aware reduced motion. Switching away from the page pauses an active run. Sound is off by default and generated locally with Web Audio.

## Progress and privacy

Progress lives under `nodra.profile.v1` in localStorage. Scores, discoveries, daily dates, category performance, and settings stay in this browser. Export and import JSON backups from **Settings**. Storage failure is reported without preventing play.

There are no cookies, trackers, third-party scripts, or external fonts. Scores are device-local and client-controlled; they should not be treated as verified competition results.

## Project map

```text
src/
  data/knowledge.ts       Curated content and indexes
  engine/
    types.ts             Shared domain models
    validation.ts        Normalization and category/rule validation
    signals.ts           Seeded Signal generation and modifiers
    scoring.ts           Transparent scoring function
    game.ts              Clock-driven game state and routing
    storage.ts           Versioned persistence and statistics
    audio.ts             Local synthesized sound
  modes/match.ts         Local party and duel coordination
  ui/
    network.ts           Perspective-projected 3D topology
    screens.ts           Screen templates
    share.ts             Answer-free result text and PNG cards
    dom.ts               Escaping, icons, and download utilities
  styles/main.css        Responsive visual system
  main.ts                Application controller and interactions
public/                  Logo and favicon
tests/engine.test.ts     Behavioral checks
.github/workflows/       Verification and GitHub Pages deployment
```

See [architecture and scoring](docs/ARCHITECTURE.md) and [validation notes](docs/QA.md).

## Ownership

Created for **[argyrios-dev](https://github.com/argyrios-dev)**. No open-source license is granted by this repository. Referenced product and brand names belong to their respective owners.
