import { byId, categoryById } from "../data/knowledge.ts";
import type { Profile, Run } from "./types.ts";
const KEY = "nodra.profile.v1";
export let storageAvailable = true;
export const emptyProfile = (): Profile => ({
  version: 1,
  games: 0,
  totalScore: 0,
  best: 0,
  correct: 0,
  misses: 0,
  longestChain: 0,
  fastest: null,
  unlocked: [],
  rare: [],
  categories: {},
  dailyDates: [],
  records: {},
  settings: {
    sound: false,
    motion: true,
    contrast: false,
    difficulty: "standard",
    theme: "signal",
    shape: "square",
  },
});
const num = (x: unknown) =>
  typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : 0;
export function readProfile(): Profile {
  const base = emptyProfile();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const p = JSON.parse(raw);
    if (p.version !== 1) return base;
    for (const key of [
      "games",
      "totalScore",
      "best",
      "correct",
      "misses",
      "longestChain",
    ] as const)
      base[key] = num(p[key]);
    base.fastest = p.fastest === null ? null : num(p.fastest) || null;
    base.unlocked = Array.isArray(p.unlocked)
      ? [
          ...new Set<string>(
            p.unlocked.filter(
              (id: unknown) => typeof id === "string" && byId.has(id),
            ),
          ),
        ]
      : [];
    base.rare = Array.isArray(p.rare)
      ? [
          ...new Set<string>(
            p.rare.filter(
              (id: unknown) => typeof id === "string" && byId.has(id),
            ),
          ),
        ]
      : [];
    base.dailyDates = Array.isArray(p.dailyDates)
      ? [
          ...new Set<string>(
            p.dailyDates.filter(
              (d: unknown) =>
                typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d),
            ),
          ),
        ].sort()
      : [];
    if (p.categories && typeof p.categories === "object")
      for (const [key, value] of Object.entries(p.categories)) {
        if (categoryById.has(key) && value && typeof value === "object") {
          const v = value as Record<string, unknown>;
          base.categories[key] = {
            correct: num(v.correct),
            missed: num(v.missed),
          };
        }
      }
    if (p.records && typeof p.records === "object")
      for (const [key, value] of Object.entries(p.records))
        if (/^[a-z]+:[a-z]+$/.test(key)) base.records[key] = num(value);
    const s = p.settings ?? {};
    for (const key of ["sound", "motion", "contrast"] as const)
      if (typeof s[key] === "boolean") base.settings[key] = s[key];
    if (["beginner", "standard", "expert", "nightmare"].includes(s.difficulty))
      base.settings.difficulty = s.difficulty;
    if (["signal", "ice", "phosphor"].includes(s.theme))
      base.settings.theme = s.theme;
    if (["square", "diamond"].includes(s.shape)) base.settings.shape = s.shape;
    return base;
  } catch {
    storageAvailable = false;
    return base;
  }
}
export function saveProfile(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}
export function recordRun(p: Profile, r: Run) {
  p.games++;
  p.totalScore += r.score;
  p.best = Math.max(p.best, r.score);
  p.correct += r.correct;
  p.misses += r.misses;
  p.longestChain = Math.max(p.longestChain, r.longestChain);
  if (r.fastest !== null)
    p.fastest = p.fastest === null ? r.fastest : Math.min(p.fastest, r.fastest);
  for (const node of r.nodes) {
    if (!p.unlocked.includes(node.conceptId)) p.unlocked.push(node.conceptId);
    if (node.rarity >= 2 && !p.rare.includes(node.conceptId))
      p.rare.push(node.conceptId);
  }
  for (const [key, c] of Object.entries(r.categories)) {
    const item = (p.categories[key] ??= { correct: 0, missed: 0 });
    item.correct += c.correct;
    item.missed += c.missed;
  }
  const k = `${r.mode}:${r.difficulty}`;
  p.records[k] = Math.max(p.records[k] ?? 0, r.score);
  if (r.mode === "daily" && !p.dailyDates.includes(r.date))
    p.dailyDates.push(r.date);
  saveProfile(p);
}
export function streak(
  p: Profile,
  today = new Date().toISOString().slice(0, 10),
) {
  const date = new Date(`${today}T00:00:00Z`);
  let n = 0;
  if (!p.dailyDates.includes(today)) date.setUTCDate(date.getUTCDate() - 1);
  while (p.dailyDates.includes(date.toISOString().slice(0, 10))) {
    n++;
    date.setUTCDate(date.getUTCDate() - 1);
  }
  return n;
}
