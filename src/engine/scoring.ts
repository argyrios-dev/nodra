import type { Concept, Route, Signal } from "./types.ts";
export function scoreAnswer(
  c: Concept,
  s: Signal,
  seconds: number,
  chain: number,
  health: number,
  route: Route,
  echo: boolean,
  hinted: boolean,
) {
  const fast = Math.round(100 * Math.max(0, 1 - seconds / s.duration));
  const rare = (c.rarity - 1) * 35;
  const difficulty = Math.round((s.difficulty - 1) * 20);
  const constraint = s.rule !== "none" ? 35 : 0;
  const multiplier = 1 + Math.min(chain - 1, 19) * 0.08;
  const total = Math.round(
    (100 + fast + rare + difficulty + constraint + (echo ? 45 : 0)) *
      multiplier *
      (0.8 + health / 500) *
      (route === "power" ? 1.2 : 1) *
      (s.event === "root" ? 2 : 1) *
      (s.event === "overclock" ? 1.15 : 1) *
      (hinted ? 0.5 : 1),
  );
  return { total, fast, rare, multiplier };
}
