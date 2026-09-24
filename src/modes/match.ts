import type { Difficulty, Run } from "../engine/types";
import { hashSeed } from "../engine/signals";
/** Hot-seat match coordinator. The engine, sequence seed and results are transport-independent. */
export interface Match {
  mode: "party" | "duel";
  names: string[];
  seed: number;
  turn: number;
  rounds: number;
  results: { name: string; run: Run }[];
  difficulty: Difficulty;
}
export function turnSeed(match: Match) {
  return hashSeed(
    `${match.seed}:${Math.floor(match.turn / match.names.length)}`,
  );
}
export function standings(match: Match) {
  return match.names
    .map((name, index) => ({
      name,
      index,
      score: match.results
        .filter((_, i) => i % match.names.length === index)
        .reduce((sum, result) => sum + result.run.score, 0),
    }))
    .sort((a, b) => b.score - a.score);
}
