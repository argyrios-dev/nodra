import { byCategory } from "../data/knowledge.ts";
import type { Concept, Difficulty, Signal } from "./types.ts";
export function normalize(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\+\+/g, "plusplus")
    .replace(/#/g, "sharp")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}
export const letterCount = (name: string) =>
  name.normalize("NFKD").replace(/[^a-zA-Z]/g, "").length;
export function fits(concept: Concept, s: Signal): boolean {
  if (!concept.categories.includes(s.category)) return false;
  if (s.secondary && !concept.categories.includes(s.secondary)) return false;
  const names = [concept.name, ...concept.aliases].map(normalize);
  if (
    s.letter &&
    !names.some((n) =>
      s.ending
        ? n.endsWith(s.letter.toLowerCase())
        : n.startsWith(s.letter.toLowerCase()),
    )
  )
    return false;
  if (s.rule === "long" && letterCount(concept.name) < 6) return false;
  if (s.rule === "length" && letterCount(concept.name) !== s.length)
    return false;
  if (s.rule === "even" && letterCount(concept.name) % 2 !== 0) return false;
  if (s.rule === "historic" && (!concept.year || concept.year >= 1990))
    return false;
  if (s.rule === "europe" && concept.region !== "Europe") return false;
  return true;
}
const inflectable = new Set([
  "hardware",
  "security",
  "auto",
  "science",
  "music",
  "internet",
  "computing",
  "space",
  "history",
]);
function oneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0,
    j = 0,
    d = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++d > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return d + (i < a.length ? 1 : 0) + (j < b.length ? 1 : 0) <= 1;
}
export type Validation =
  | { ok: true; concept: Concept; corrected: boolean }
  | { ok: false; reason: string };
export function validate(
  input: string,
  s: Signal,
  difficulty: Difficulty,
  used: Set<string>,
): Validation {
  const n = normalize(input.trim().slice(0, 100));
  if (!n) return { ok: false, reason: "Type an answer first." };
  const pool = byCategory.get(s.category) ?? [];
  let c = pool.find((c) =>
    [c.name, ...c.aliases].some((a) => normalize(a) === n),
  );
  let corrected = false;
  if (!c && inflectable.has(s.category))
    c = pool.find((c) =>
      [c.name, ...c.aliases].some((a) => {
        const v = normalize(a);
        return (
          (n === v + "s" || v === n + "s") && Math.min(v.length, n.length) > 3
        );
      }),
    );
  if (!c && difficulty === "beginner" && n.length >= 5) {
    const matches = pool.filter(
      (c) =>
        fits(c, s) &&
        [c.name, ...c.aliases].some((a) => oneEdit(n, normalize(a))),
    );
    if (matches.length === 1) {
      c = matches[0];
      corrected = true;
    }
  }
  if (!c)
    return {
      ok: false,
      reason: "Not in this category’s local Codex. Try another answer.",
    };
  if (!fits(c, s))
    return {
      ok: false,
      reason: "Known answer, but it does not fit this Signal’s letter or rule.",
    };
  if (used.has(c.id))
    return {
      ok: false,
      reason: "Already transmitted this run. Find a fresh answer.",
    };
  return { ok: true, concept: c, corrected };
}
