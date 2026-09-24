# Validation record

## Automated

`npm test` covers:

- Dataset size, unique concept IDs, valid categories, and tier bounds.
- Aliases, accent folding, category-specific plurals, and C/C++/C# distinctions.
- Canonical-name, date, and region constraints.
- Bounded Beginner spelling tolerance.
- 1,920 generated Signals across all modes and difficulty levels, each with enough valid candidates.
- Deterministic daily sequences independent of answers and misses.
- Three-route circuit completion, shield absorption, and repeat-answer protection.
- Pause/resume deadlines and run expiry.
- Score ordering, speed reward, and hint penalties.
- Complete 12-Signal daily runs and duplicate-cache rejection.

`npm run build` type-checks the application and produces the static Vite build.

## Browser inspection

Desktop and a 390-pixel-wide embedded mobile viewport were inspected in Chromium. Checks included home rendering, the scroll-driven perspective animation, answer submission, route selection, shield charging, circuit completion, pause/resume, and result metrics. The mobile viewport is a layout check, not a physical-device or virtual-keyboard test.

## Limits

No Safari/iOS/Android device-lab run, automated screen-reader audit, empirical 60-FPS benchmark, security certification, or formal gameplay balance study has been performed. The rendering strategy targets smooth animation but performance varies by device. Online multiplayer and verified global rankings are outside this release.
