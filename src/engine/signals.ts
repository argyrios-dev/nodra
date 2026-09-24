import { byCategory, categories } from "../data/knowledge.ts";
import { fits, letterCount, normalize } from "./validation.ts";
import type { Difficulty, Event, Mode, Signal } from "./types.ts";
export const DIFFICULTY: Record<
  Difficulty,
  { level: number; seconds: number; label: string }
> = {
  beginner: {
    level: 1,
    seconds: 14,
    label: "Familiar categories · gentle spelling · hints",
  },
  standard: {
    level: 2,
    seconds: 10,
    label: "Broad knowledge · modifiers · fast decisions",
  },
  expert: {
    level: 3,
    seconds: 8,
    label: "Deeper categories · exact spelling · hard rules",
  },
  nightmare: {
    level: 4,
    seconds: 6.5,
    label: "Technical categories · compound constraints",
  },
};
export const EVENTS: Record<Event, { name: string; description: string }> = {
  normal: {
    name: "Open channel",
    description: "A fresh answer creates a node.",
  },
  firewall: {
    name: "Firewall",
    description: "Canonical name must have at least 6 letters.",
  },
  mirror: {
    name: "Mirror route",
    description: "The highlighted letter goes at the END.",
  },
  overclock: {
    name: "Overclock",
    description: "Short window. Speed bonus amplified.",
  },
  blackout: {
    name: "Blackout",
    description: "Next-Signal preview is offline.",
  },
  packet: {
    name: "Packet storm",
    description: "Transmit two different answers before time runs out.",
  },
  root: { name: "Root access", description: "Double points for this Signal." },
  cache: {
    name: "Cache hit",
    description: "Previously transmitted answers may be used again.",
  },
  leak: {
    name: "Memory leak",
    description: "Your recent-answer log is temporarily hidden.",
  },
  bridge: {
    name: "Double route",
    description: "One answer must belong to both categories.",
  },
  checksum: {
    name: "Checksum",
    description: "Canonical name must contain an even number of letters.",
  },
  zero: {
    name: "Zero day",
    description:
      "Probe an answer to reveal the hidden constraint. Probes are free.",
  },
};
export function hashSeed(text: string): number {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function random(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function createSignal(
  seed: number,
  index: number,
  mode: Mode,
  difficulty: Difficulty,
  adaptive = 0,
  used = new Set<string>(),
): Signal {
  const rand = random(hashSeed(`${seed}:${index}:v1`));
  const pick = <T>(a: readonly T[]) => a[Math.floor(rand() * a.length)];
  const cfg = DIFFICULTY[difficulty];
  const level = Math.max(
    1,
    Math.min(
      4,
      cfg.level +
        adaptive +
        (mode === "endless" ? Math.floor(index / 12) * 0.25 : 0),
    ),
  );
  let cats = categories.filter((c) =>
    mode === "garage"
      ? c.garage
      : mode === "tech" || difficulty === "nightmare"
        ? c.technical
        : true,
  );
  if (level < 1.7 && mode !== "tech" && mode !== "garage")
    cats = cats.filter(
      (c) =>
        ![
          "command",
          "protocol",
          "algorithm",
          "computing",
          "ai",
          "security",
        ].includes(c.id),
    );
  let category = pick(cats).id;
  let pool = (byCategory.get(category) ?? []).filter(
    (c) => c.difficulty <= Math.ceil(level) && !used.has(c.id),
  );
  if (!pool.length)
    pool = [...(byCategory.get(category) ?? [])].filter((c) => !used.has(c.id));
  let recycled = false;
  if (!pool.length) {
    pool = [...(byCategory.get(category) ?? [])];
    recycled = true;
  }
  const exemplar = pick(pool);
  let event: Event = "normal";
  if (
    index > 1 &&
    difficulty !== "beginner" &&
    rand() < (mode === "chaos" ? 0.9 : 0.48)
  )
    event = pick<Event>([
      "firewall",
      "mirror",
      "overclock",
      "blackout",
      "packet",
      "root",
      "cache",
      "leak",
      "bridge",
      "checksum",
      ...(level >= 3 ? ["zero" as Event] : []),
    ]);
  if (recycled) event = "cache";
  const s: Signal = {
    index,
    category,
    letter: normalize(exemplar.name).charAt(0).toUpperCase(),
    ending: false,
    rule: "none",
    event,
    duration: cfg.seconds,
    difficulty: level,
    target: 1,
    candidates: [],
  };
  if (event === "mirror") {
    s.ending = true;
    s.letter = normalize(exemplar.name).slice(-1).toUpperCase();
  }
  if (event === "firewall") s.rule = "long";
  if (event === "checksum") s.rule = "even";
  if (event === "packet") {
    s.letter = "";
    s.target = 2;
    s.duration += 4;
  }
  if (event === "zero") s.rule = pick(["long", "even"] as const);
  if (event === "bridge") {
    const shared = pool.filter((c) => c.categories.length > 1);
    if (shared.length) {
      const c = pick(shared);
      s.secondary = pick(c.categories.filter((x) => x !== category));
      s.letter = normalize(c.name)[0].toUpperCase();
    } else {
      s.event = "root";
    }
  }
  if (
    level >= 2.5 &&
    s.rule === "none" &&
    s.event === "normal" &&
    rand() < 0.6
  ) {
    if (category === "language" && exemplar.year && exemplar.year < 1990)
      s.rule = "historic";
    else if (category === "car" && exemplar.region === "Europe")
      s.rule = "europe";
    else {
      s.rule = "length";
      s.length = letterCount(exemplar.name);
      s.letter = "";
    }
  }
  if (mode === "chaos") s.duration = Math.max(4, s.duration * 0.65);
  if (event === "overclock") s.duration *= 0.65;
  s.duration = Math.max(4, s.duration - Math.max(0, adaptive) * 0.5);
  // Derive candidates after constraints. Impossible combinations are relaxed before broadcast.
  const available = (byCategory.get(category) ?? []).filter(
    (c) => s.event === "cache" || !used.has(c.id),
  );
  let matches = available.filter((c) => fits(c, s));
  if (matches.length < s.target) {
    s.rule = "none";
    s.secondary = undefined;
    if (["firewall", "checksum", "zero", "bridge"].includes(s.event))
      s.event = "normal";
    matches = available.filter((c) => fits(c, s));
  }
  if (matches.length < s.target) {
    s.letter = "";
    matches = available.filter((c) => fits(c, s));
  }
  if (matches.length < s.target) {
    s.target = 1;
    s.event = "normal";
  }
  s.candidates = matches.map((c) => c.id);
  return s;
}
export function ruleText(s: Signal, revealed = true): string {
  if (s.event === "zero" && !revealed)
    return "Hidden: try a valid category answer to reveal the rule";
  const rules = {
    none: "Any matching answer",
    long: "6+ letters",
    length: `Exactly ${s.length} letters`,
    historic: "Created before 1990",
    europe: "European manufacturer",
    even: "An even number of letters",
  };
  return (
    rules[s.rule] +
    (s.rule === "length" || s.rule === "long" || s.rule === "even"
      ? " · canonical name"
      : "")
  );
}
