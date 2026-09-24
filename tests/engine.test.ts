import test from "node:test";
import assert from "node:assert/strict";
import { concepts, byId, categories } from "../src/data/knowledge.ts";
import { validate, normalize, fits } from "../src/engine/validation.ts";
import { createSignal } from "../src/engine/signals.ts";
import { Game } from "../src/engine/game.ts";
import { scoreAnswer } from "../src/engine/scoring.ts";
import type { Signal, Mode, Difficulty, Route } from "../src/engine/types.ts";
const prompt = (category: string, letter = ""): Signal => ({
  index: 0,
  category,
  letter,
  ending: false,
  rule: "none",
  event: "normal",
  duration: 10,
  difficulty: 2,
  target: 1,
  candidates: [],
});
test("knowledge is substantial, uniquely identified and categorized", () => {
  assert.ok(concepts.length > 1500);
  assert.equal(categories.length, 29);
  assert.equal(new Set(concepts.map((c) => c.id)).size, concepts.length);
  for (const c of concepts) {
    assert.ok(
      c.categories.every((id) => categories.some((cat) => cat.id === id)),
    );
    assert.ok(c.rarity >= 1 && c.rarity <= 4);
  }
});
test("aliases preserve language distinctions and accents", () => {
  assert.notEqual(normalize("C"), normalize("C++"));
  assert.notEqual(normalize("C++"), normalize("C#"));
  for (const [input, cat, letter] of [
    ["cpp", "language", "C"],
    ["Mac OS", "os", "M"],
    ["citroen", "car", "C"],
    ["PYTHON", "language", "P"],
    ["graphics card", "hardware", "G"],
    ["processors", "hardware", "C"],
  ])
    assert.equal(
      validate(input, prompt(cat, letter), "standard", new Set()).ok,
      true,
      input,
    );
  assert.equal(
    validate(
      "<script>alert(1)</script>",
      prompt("language"),
      "standard",
      new Set(),
    ).ok,
    false,
  );
});
test("rules validate canonical names, regions, and dates", () => {
  assert.equal(
    validate(
      "cpp",
      { ...prompt("language", "C"), rule: "historic" },
      "expert",
      new Set(),
    ).ok,
    true,
  );
  assert.equal(
    validate(
      "Python",
      { ...prompt("language", "P"), rule: "historic" },
      "expert",
      new Set(),
    ).ok,
    false,
  );
  assert.equal(
    validate(
      "Ford",
      { ...prompt("car", "F"), rule: "europe" },
      "expert",
      new Set(),
    ).ok,
    false,
  );
  assert.equal(
    validate(
      "Ferrari",
      { ...prompt("car", "F"), rule: "europe" },
      "expert",
      new Set(),
    ).ok,
    true,
  );
  assert.equal(
    validate(
      "py",
      { ...prompt("language", "P"), rule: "long" },
      "expert",
      new Set(),
    ).ok,
    true,
  );
});
test("beginner typo tolerance is bounded and category-specific", () => {
  assert.equal(
    validate("Pythom", prompt("language", "P"), "beginner", new Set()).ok,
    true,
  );
  assert.equal(
    validate("Pythom", prompt("language", "P"), "expert", new Set()).ok,
    false,
  );
  assert.equal(
    validate("never-a-language", prompt("language"), "beginner", new Set()).ok,
    false,
  );
});
test("generator produces solvable Signals across all modes and difficulties", () => {
  const modes: Mode[] = [
    "quick",
    "daily",
    "endless",
    "party",
    "duel",
    "tech",
    "garage",
    "chaos",
  ];
  const ds: Difficulty[] = ["beginner", "standard", "expert", "nightmare"];
  let count = 0;
  for (const mode of modes)
    for (const d of ds)
      for (let i = 0; i < 60; i++) {
        const s = createSignal(12345 + (i % 5), i, mode, d);
        assert.ok(s.candidates.length >= s.target, `${mode} ${d} ${i}`);
        for (const id of s.candidates) assert.ok(fits(byId.get(id)!, s));
        if (mode === "garage")
          assert.ok(categories.find((c) => c.id === s.category)?.garage);
        if (mode === "tech" || (d === "nightmare" && mode !== "garage"))
          assert.ok(categories.find((c) => c.id === s.category)?.technical);
        count++;
      }
  assert.equal(count, 1920);
});
test("daily sequences are deterministic and independent of performance", () => {
  const a = new Game("daily", "standard", 99, 0, "2026-09-23"),
    b = new Game("daily", "standard", 99, 0, "2026-09-23");
  for (let i = 0; i < 3; i++) {
    assert.deepEqual(a.signal, b.signal);
    let now = i * 20000 + 1000;
    while (a.signal.index === i && !a.run.ended) {
      a.submit(
        byId.get(a.signal.candidates.find((id) => !a.signalUsed.has(id))!)!
          .name,
        now,
      );
      now += 100;
    }
    b.miss(now);
    assert.deepEqual(a.signal, b.signal);
  }
});
test("routing creates a circuit, shielding absorbs a miss, and used answers cannot be farmed", () => {
  const g = new Game("quick", "beginner", 3, 0, "2026-09-23");
  let time = 500;
  for (const route of ["power", "shield", "memory"] as Route[]) {
    g.setRoute(route);
    const c = byId.get(g.signal.candidates.find((id) => !g.used.has(id))!)!;
    assert.ok(g.submit(c.name, time));
    time += 500;
  }
  assert.equal(g.run.circuits, 1);
  assert.equal(g.run.nodes.length, 3);
  assert.ok(g.run.shield > 0);
  const shield = g.run.shield;
  g.miss(time);
  assert.equal(g.run.shield, 0);
  assert.equal(
    g.run.health,
    100 - (18 + Math.floor(g.signal.difficulty * 2)) + shield,
  );
  const id = g.run.nodes[0].conceptId;
  assert.equal(
    validate(
      byId.get(id)!.name,
      prompt(byId.get(id)!.categories[0]),
      "standard",
      new Set([id]),
    ).ok,
    false,
  );
});
test("pausing freezes both deadlines and resuming cannot add score", () => {
  const g = new Game("quick", "standard", 4, 1000, "2026-09-23");
  g.tick(2000);
  const remaining = g.signalRemaining;
  g.pause(2000);
  g.tick(100000);
  assert.equal(g.signalRemaining, remaining);
  g.resume(102000);
  assert.equal(g.signalRemaining, remaining);
  assert.equal(g.run.score, 0);
  g.tick(200000);
  assert.equal(g.run.ended, true);
});
test("speed, rarity and routing have bounded meaningful score effects", () => {
  const c = concepts.find((c) => c.name === "Python")!,
    s = prompt("language", "P");
  const fast = scoreAnswer(c, s, 1, 1, 100, "power", false, false).total;
  const slow = scoreAnswer(c, s, 9, 1, 100, "power", false, false).total;
  assert.ok(fast > slow);
  assert.ok(scoreAnswer(c, s, 1, 1, 100, "power", false, true).total < fast);
  assert.ok(fast < 1000);
});
test("full daily completes exactly twelve Signals with valid answers", () => {
  const g = new Game("daily", "standard", 912, 0, "2026-09-23");
  let time = 100;
  let attempts = 0;
  while (!g.run.ended && attempts++ < 40) {
    const c = g.signal.candidates
      .map((id) => byId.get(id)!)
      .find((c) => !g.signalUsed.has(c.id))!;
    assert.ok(c);
    g.submit(c.name, time);
    time += 250;
  }
  assert.equal(g.run.ended, true);
  assert.equal(g.signalCount, 12);
  assert.equal(g.run.misses, 0);
  assert.ok(g.run.correct >= 12);
});
test("duplicate cache submissions within one Signal are rejected", () => {
  const id = concepts.find((c) => c.name === "Python")!.id;
  assert.equal(
    validate(
      "py",
      { ...prompt("language", "P"), event: "cache" },
      "standard",
      new Set([id]),
    ).ok,
    false,
  );
});
