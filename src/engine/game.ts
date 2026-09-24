import { byId } from "../data/knowledge.ts";
import { createSignal } from "./signals.ts";
import { validate } from "./validation.ts";
import { scoreAnswer } from "./scoring.ts";
import type {
  Difficulty,
  Feedback,
  Mode,
  Route,
  Run,
  Signal,
} from "./types.ts";
export class Game {
  run: Run;
  signal: Signal;
  next: Signal;
  route: Route = "power";
  used = new Set<string>();
  signalUsed = new Set<string>();
  routeCharge = new Set<Route>();
  feedback: Feedback = {
    kind: "event",
    title: "Channel open",
    detail: "Type a matching answer. Press Enter to transmit.",
  };
  signalStarted = 0;
  paused = false;
  pauseAt = 0;
  revealed = false;
  hinted = false;
  signalCount = 0;
  adaptive = 0;
  revision = 0;
  limit: number;
  fixed: boolean;
  successes: number[] = [];
  constructor(
    mode: Mode,
    difficulty: Difficulty,
    seed: number,
    now: number,
    date: string,
  ) {
    this.fixed = mode === "daily" || mode === "duel" || mode === "party";
    this.limit =
      mode === "endless"
        ? Infinity
        : mode === "daily" || mode === "duel"
          ? Infinity
          : mode === "party"
            ? 30
            : 90;
    this.run = {
      mode,
      difficulty,
      seed,
      date,
      score: 0,
      health: 100,
      shield: 0,
      chain: 0,
      longestChain: 0,
      correct: 0,
      misses: 0,
      invalid: 0,
      rare: 0,
      fastest: null,
      nodes: [],
      categories: {},
      startedAt: now,
      elapsed: 0,
      ended: false,
      circuits: 0,
      echoes: 0,
      hints: 0,
      assisted: false,
    };
    this.signal = createSignal(seed, 0, mode, difficulty);
    this.next = createSignal(seed, 1, mode, difficulty);
    this.signalStarted = now;
  }
  get signalRemaining() {
    return Math.max(
      0,
      this.signal.duration - (this.currentTime - this.signalStarted) / 1000,
    );
  }
  currentTime = 0;
  tick(now: number) {
    if (this.run.ended || this.paused) return;
    this.currentTime = now;
    this.run.elapsed = (now - this.run.startedAt) / 1000;
    if (this.run.elapsed >= this.limit) {
      this.finish();
      return;
    }
    if (this.signalRemaining <= 0) this.miss(now);
  }
  setRoute(route: Route) {
    this.route = route;
    this.revision++;
  }
  categoryResult(correct: boolean) {
    const c = (this.run.categories[this.signal.category] ??= {
      correct: 0,
      missed: 0,
    });
    correct ? c.correct++ : c.missed++;
  }
  submit(input: string, now: number): boolean {
    if (this.run.ended || this.paused) return false;
    const oldIndex = this.signal.index;
    this.tick(now);
    if (this.run.ended || this.signal.index !== oldIndex) return false;
    if (this.signal.event === "zero" && !this.revealed) {
      this.revealed = true;
      this.feedback = {
        kind: "hint",
        title: "Rule decoded",
        detail:
          this.signal.rule === "long"
            ? "Use a canonical name with 6+ letters."
            : "Use a canonical name with an even number of letters.",
      };
      this.revision++;
      return false;
    }
    const result = validate(
      input,
      this.signal,
      this.run.difficulty,
      this.signal.event === "cache" || this.fixed
        ? this.signalUsed
        : new Set([...this.used, ...this.signalUsed]),
    );
    if (!result.ok) {
      this.run.invalid++;
      this.feedback = {
        kind: "error",
        title: "Signal rejected",
        detail: result.reason,
      };
      this.revision++;
      return false;
    }
    const c = result.concept;
    const seconds = Math.max(0.1, (now - this.signalStarted) / 1000);
    const previous = this.run.nodes.at(-1);
    const echo =
      !!previous &&
      previous.category === this.signal.category &&
      previous.route !== this.route;
    this.run.chain++;
    this.run.longestChain = Math.max(this.run.longestChain, this.run.chain);
    const score = scoreAnswer(
      c,
      this.signal,
      seconds,
      this.run.chain,
      this.run.health,
      this.route,
      echo,
      this.hinted,
    );
    this.run.score += score.total;
    this.run.correct++;
    this.run.rare += c.rarity >= 2 ? 1 : 0;
    this.run.fastest =
      this.run.fastest === null ? seconds : Math.min(this.run.fastest, seconds);
    this.run.echoes += echo ? 1 : 0;
    this.run.health = Math.min(100, this.run.health + 2);
    if (this.route === "shield")
      this.run.shield = Math.min(30, this.run.shield + 8);
    if (this.route === "memory")
      this.run.health = Math.min(100, this.run.health + 4);
    this.routeCharge.add(this.route);
    let circuit = false;
    if (this.routeCharge.size === 3) {
      circuit = true;
      this.run.circuits++;
      this.run.score += 150;
      this.run.health = Math.min(100, this.run.health + 12);
      this.routeCharge.clear();
      const dead = this.run.nodes.find((n) => !n.alive);
      if (dead) dead.alive = true;
    }
    this.run.nodes.push({
      id: this.run.nodes.length,
      name: c.name,
      conceptId: c.id,
      category: this.signal.category,
      route: this.route,
      rarity: c.rarity,
      alive: true,
      circuit: this.run.circuits,
    });
    this.used.add(c.id);
    this.signalUsed.add(c.id);
    this.categoryResult(true);
    this.feedback = {
      kind: "success",
      title: circuit
        ? "Circuit closed +150"
        : this.run.chain === 20
          ? "SYSTEM ASCENSION"
          : this.run.chain === 10
            ? "OVERDRIVE"
            : `${c.name} connected`,
      detail: `+${score.fast} FAST${score.rare ? ` · +${score.rare} RARITY` : ""} · ×${score.multiplier.toFixed(2)} CHAIN${echo ? " · ECHO +45" : ""}${result.corrected ? " · SPELLING ASSIST" : ""}${this.hinted ? " · HINT −50%" : ""}`,
      points: score.total,
      fact: c.fact,
    };
    this.successes.push(1);
    this.revision++;
    if (this.signalUsed.size >= this.signal.target) this.advance(now);
    return true;
  }
  hint() {
    if (this.run.ended || this.paused || this.hinted) return;
    const c = this.signal.candidates
      .map((id) => byId.get(id)!)
      .find((c) => !this.signalUsed.has(c.id));
    if (!c) return;
    this.hinted = true;
    this.run.hints++;
    this.run.assisted = true;
    this.feedback = {
      kind: "hint",
      title: "A little bandwidth",
      detail: `${c.name.slice(0, Math.max(2, Math.ceil(c.name.length * 0.4)))}${"·".repeat(Math.min(12, Math.floor(c.name.length * 0.6)))} · ${c.name.length} characters. This Signal earns half points.`,
    };
    this.revision++;
  }
  miss(now: number) {
    if (this.run.ended || this.paused) return;
    const damage = 18 + Math.floor(this.signal.difficulty * 2);
    const absorbed = Math.min(damage, this.run.shield);
    this.run.shield -= absorbed;
    this.run.health = Math.max(0, this.run.health - damage + absorbed);
    this.run.chain = 0;
    this.run.misses++;
    this.categoryResult(false);
    const victim = [...this.run.nodes].reverse().find((n) => n.alive);
    if (victim) victim.alive = false;
    const example = this.signal.candidates
      .map((id) => byId.get(id))
      .find((c) => c && !this.signalUsed.has(c.id));
    this.feedback = {
      kind: "miss",
      title: absorbed >= damage ? "Shield absorbed impact" : "Packet lost",
      detail: `${absorbed ? `${absorbed} shield absorbed · ` : ""}${example ? `One answer: ${example.name}` : "New channel opening."}`,
    };
    this.successes.push(0);
    this.revision++;
    if (this.run.health <= 0) this.finish();
    else this.advance(now);
  }
  advance(now: number) {
    this.signalCount++;
    if (
      (this.run.mode === "daily" || this.run.mode === "duel") &&
      this.signalCount >= 12
    ) {
      this.finish();
      return;
    }
    if (!this.fixed && this.successes.length >= 6) {
      const last = this.successes.slice(-6);
      this.adaptive = Math.max(
        -1,
        Math.min(
          1,
          this.adaptive + (last.reduce((a, b) => a + b, 0) >= 5 ? 0.12 : -0.12),
        ),
      );
    }
    // The preview is a promise: consume the exact previously displayed Signal.
    this.signal = this.next;
    // If a preview candidate was used, allow a cache revisit instead of broadcasting an impossible prompt.
    if (
      !this.fixed &&
      this.signal.candidates.filter((id) => !this.used.has(id)).length <
        this.signal.target
    )
      this.signal = { ...this.signal, event: "cache" };
    this.next = createSignal(
      this.run.seed,
      this.signal.index + 1,
      this.run.mode,
      this.run.difficulty,
      this.fixed ? 0 : this.adaptive,
      this.fixed ? new Set() : this.used,
    );
    this.signalStarted = now;
    this.currentTime = now;
    this.signalUsed.clear();
    this.hinted = false;
    this.revealed = false;
    this.revision++;
  }
  pause(now: number) {
    if (this.run.ended || this.paused) return;
    this.tick(now);
    this.paused = true;
    this.pauseAt = now;
    this.revision++;
  }
  resume(now: number) {
    if (!this.paused) return;
    const gap = now - this.pauseAt;
    this.signalStarted += gap;
    this.run.startedAt += gap;
    this.currentTime = now;
    this.paused = false;
    this.revision++;
  }
  finish() {
    this.run.ended = true;
    this.revision++;
  }
}
