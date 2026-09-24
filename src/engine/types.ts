export type Mode =
  | "quick"
  | "endless"
  | "daily"
  | "party"
  | "duel"
  | "tech"
  | "garage"
  | "chaos";
export type Difficulty = "beginner" | "standard" | "expert" | "nightmare";
export type Route = "power" | "shield" | "memory";
export type Event =
  | "normal"
  | "firewall"
  | "mirror"
  | "overclock"
  | "blackout"
  | "packet"
  | "root"
  | "cache"
  | "leak"
  | "bridge"
  | "checksum"
  | "zero";
export interface Concept {
  id: string;
  name: string;
  aliases: string[];
  categories: string[];
  difficulty: number;
  rarity: number;
  year?: number;
  region?: string;
  fact?: string;
}
export interface Category {
  id: string;
  name: string;
  group: string;
  technical?: boolean;
  garage?: boolean;
}
export interface Signal {
  index: number;
  category: string;
  letter: string;
  ending: boolean;
  rule: "none" | "long" | "length" | "historic" | "europe" | "even";
  length?: number;
  event: Event;
  duration: number;
  difficulty: number;
  secondary?: string;
  target: number;
  candidates: string[];
}
export interface NetworkNode {
  id: number;
  name: string;
  conceptId: string;
  category: string;
  route: Route;
  rarity: number;
  alive: boolean;
  circuit: number;
}
export interface Run {
  mode: Mode;
  difficulty: Difficulty;
  seed: number;
  date: string;
  score: number;
  health: number;
  shield: number;
  chain: number;
  longestChain: number;
  correct: number;
  misses: number;
  invalid: number;
  rare: number;
  fastest: number | null;
  nodes: NetworkNode[];
  categories: Record<string, { correct: number; missed: number }>;
  startedAt: number;
  elapsed: number;
  ended: boolean;
  circuits: number;
  echoes: number;
  hints: number;
  assisted: boolean;
}
export interface Feedback {
  kind: "success" | "error" | "miss" | "hint" | "event";
  title: string;
  detail: string;
  fact?: string;
  points?: number;
}
export interface Settings {
  sound: boolean;
  motion: boolean;
  contrast: boolean;
  difficulty: Difficulty;
  theme: "signal" | "ice" | "phosphor";
  shape: "square" | "diamond";
}
export interface Profile {
  version: 1;
  games: number;
  totalScore: number;
  best: number;
  correct: number;
  misses: number;
  longestChain: number;
  fastest: number | null;
  unlocked: string[];
  rare: string[];
  categories: Record<string, { correct: number; missed: number }>;
  dailyDates: string[];
  records: Record<string, number>;
  settings: Settings;
}
