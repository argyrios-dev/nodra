import "./styles/main.css";
import { turnSeed, standings } from "./modes/match";
import type { Match } from "./modes/match";
import { byId, categoryById } from "./data/knowledge";
import { Game } from "./engine/game";
import { DIFFICULTY, EVENTS, hashSeed, ruleText } from "./engine/signals";
import {
  readProfile,
  saveProfile,
  recordRun,
  storageAvailable,
} from "./engine/storage";
import { AudioEngine } from "./engine/audio";
import type { Difficulty, Mode, Profile, Route, Run } from "./engine/types";
import { NetworkView } from "./ui/network";
import {
  $,
  $$,
  arrow,
  download,
  escape as e,
  format,
  logo,
  soundIcon,
} from "./ui/dom";
import {
  MODES,
  home,
  results,
  stats,
  codex,
  codexEntries,
  conceptDetail,
  settings,
  howTo,
} from "./ui/screens";
import { shareCard, shareText } from "./ui/share";
let profile = readProfile();
let screen = "home";
let network: NetworkView | null = null;
let game: Game | null = null;
let lastRun: Run | null = null;
let loop = 0;
let lastRevision = -1;
let lastSignal = -1;
let lastTimer = -1;
let codexLimit = 60;
let pendingMode: Mode = "quick";
let selectedDifficulty: Difficulty = profile.settings.difficulty;
const audio = new AudioEngine();
let match: Match | null = null;
const app = $("#app");
function applySettings() {
  document.documentElement.dataset.theme = profile.settings.theme;
  document.documentElement.dataset.contrast = String(profile.settings.contrast);
  document.documentElement.dataset.motion = String(profile.settings.motion);
  audio.enabled = profile.settings.sound;
  if (network) network.settings = profile.settings;
}
applySettings();
function shell(content: string, active = "") {
  network?.destroy();
  network = null;
  cancelAnimationFrame(loop);
  app.innerHTML = `<header class="app-header"><button class="wordmark" data-action="home" aria-label="NODRA home">${logo}<span>NODRA</span></button><nav aria-label="Main navigation"><button class="nav-button ${active === "play" ? "active" : ""}" data-action="home">Play</button><button class="nav-button ${active === "codex" ? "active" : ""}" data-action="codex">Codex <span class="nav-count">${profile.unlocked.length}</span></button><button class="nav-button ${active === "stats" ? "active" : ""}" data-action="stats">Stats</button><button class="nav-button ${active === "settings" ? "active" : ""}" data-action="settings">Settings</button></nav><button class="sound-toggle" data-action="sound" aria-label="${profile.settings.sound ? "Turn sound off" : "Turn sound on"}" aria-pressed="${profile.settings.sound}">${soundIcon}<span>${profile.settings.sound ? "ON" : "OFF"}</span></button></header><main id="main" tabindex="-1">${content}</main><div id="toast" class="toast" role="status"></div><dialog id="dialog" aria-labelledby="dialog-title"><button class="dialog-close" data-action="close" aria-label="Close dialog">×</button><div id="dialog-content"></div></dialog>`;
  if (!storageAvailable)
    toast(
      "Browser storage is unavailable. Progress will last for this session.",
    );
}
function showHome() {
  screen = "home";
  game = null;
  match = null;
  window.scrollTo(0, 0);
  shell(home(profile), "play");
  network = new NetworkView($("#network"), profile.settings, true);
  $("#home-difficulty").addEventListener("change", (ev) => {
    profile.settings.difficulty = (ev.target as HTMLSelectElement)
      .value as Difficulty;
    saveProfile(profile);
  });
}
function showPage(page: "codex" | "stats" | "settings") {
  screen = page;
  window.scrollTo(0, 0);
  shell(
    page === "codex"
      ? codex(profile)
      : page === "stats"
        ? stats(profile)
        : settings(profile),
    page,
  );
  $("#main").focus();
  if (page === "codex") {
    codexLimit = 60;
    renderCodex();
    for (const id of ["#codex-search", "#codex-category", "#codex-locked"])
      $(id).addEventListener("input", () => {
        codexLimit = 60;
        renderCodex();
      });
  }
  if (page === "settings") bindSettings();
}
function renderCodex() {
  const list = codexEntries(
    profile,
    $<HTMLInputElement>("#codex-search").value,
    $<HTMLSelectElement>("#codex-category").value,
    $<HTMLInputElement>("#codex-locked").checked,
    codexLimit,
  );
  $("#codex-grid").innerHTML = list.html;
  $("#codex-count").textContent =
    `${list.total} ${list.total === 1 ? "concept" : "concepts"} · ${Math.min(codexLimit, list.total)} shown`;
  $<HTMLButtonElement>("#codex-more").hidden = list.total <= codexLimit;
}
function openDialog(content: string) {
  $("#dialog-content").innerHTML = content;
  const heading = $("#dialog-content h2");
  if (heading) heading.id = "dialog-title";
  $<HTMLDialogElement>("#dialog").showModal();
}
function closeDialog() {
  $<HTMLDialogElement>("#dialog").close();
}
let toastTimer: ReturnType<typeof setTimeout>;
function toast(message: string) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = message;
  t.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("visible"), 3500);
}
function setupMode(mode: Mode) {
  pendingMode = mode;
  selectedDifficulty =
    mode === "daily" ? "standard" : profile.settings.difficulty;
  openDialog(
    `<div class="eyebrow">${MODES[mode].tag}</div><h2>${MODES[mode].name}</h2><p class="muted">${MODES[mode].description}</p>${
      mode === "daily"
        ? `<div class="daily-date mono">${new Date().toISOString().slice(0, 10)} / STANDARD / 12 SIGNALS</div><p>Everyone gets the same sequence. Replays and hints are welcome; scores stay on your device.</p>`
        : `<label class="field-label">Difficulty<select id="setup-difficulty">${Object.entries(
            DIFFICULTY,
          )
            .map(
              ([k, v]) =>
                `<option value="${k}" ${k === selectedDifficulty ? "selected" : ""}>${k[0].toUpperCase() + k.slice(1)} — ${v.label}</option>`,
            )
            .join("")}</select></label>`
    }${mode === "party" || mode === "duel" ? `<label class="field-label">Players${mode === "party" ? '<select id="player-count">' + Array.from({ length: 7 }, (_, i) => `<option value="${i + 2}">${i + 2} players</option>`).join("") + "</select>" : '<span class="muted small">2 players · taking turns on this device</span>'}</label><div id="player-names" class="player-names"></div><p class="small muted">${mode === "duel" ? "Both players face the same 12 Signals. Pass the device without watching the other turn. This is a local, honor-system duel." : "Two rounds. Players alternate 30-second turns. Every player faces the same seeded sequence within each round."}</p>` : ""}<button class="button primary full" data-action="start-mode">${mode === "party" || mode === "duel" ? "READY THE NETWORK" : "START TRANSMISSION"} ${arrow}</button>`,
  );
  if (mode === "party" || mode === "duel") {
    renderPlayerNames(2);
    $("#player-count")?.addEventListener("change", (ev) =>
      renderPlayerNames(Number((ev.target as HTMLSelectElement).value)),
    );
  }
}
function renderPlayerNames(n: number) {
  $("#player-names").innerHTML = Array.from(
    { length: n },
    (_, i) =>
      `<label><span class="sr-only">Player ${i + 1} name</span><input class="player-name" maxlength="24" value="Player ${i + 1}" aria-label="Player ${i + 1} name"></label>`,
  ).join("");
}
function startMode() {
  const d = $<HTMLSelectElement>("#setup-difficulty");
  selectedDifficulty = d ? (d.value as Difficulty) : "standard";
  if (pendingMode === "party" || pendingMode === "duel") {
    const names = $$<HTMLInputElement>(".player-name").map(
      (input, i) => input.value.trim() || `Player ${i + 1}`,
    );
    match = {
      mode: pendingMode,
      names,
      seed: cryptoSeed(),
      turn: 0,
      rounds: pendingMode === "party" ? 2 : 1,
      results: [],
      difficulty: selectedDifficulty,
    };
    closeDialog();
    handoff();
  } else {
    closeDialog();
    match = null;
    startRun(pendingMode, selectedDifficulty);
  }
}
function cryptoSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
function startRun(mode: Mode, difficulty: Difficulty, seed?: number) {
  const date = new Date().toISOString().slice(0, 10);
  game = new Game(
    mode,
    difficulty,
    seed ??
      (mode === "daily" ? hashSeed(`nodra-daily:${date}:v1`) : cryptoSeed()),
    performance.now(),
    date,
  );
  screen = "game";
  lastRevision = -1;
  lastSignal = -1;
  lastTimer = -1;
  window.scrollTo(0, 0);
  shell(
    `<section class="game-shell"><div class="game-top mono"><span>${match ? `${e(match.names[match.turn % match.names.length]).toUpperCase()} / ` : ""}${MODES[mode].name.toUpperCase()} <span class="muted">/ ${difficulty.toUpperCase()}</span></span><div><span id="run-time">90.0s</span><button class="text-button" data-action="pause">PAUSE <kbd>ESC</kbd></button></div></div><div class="hud"><div class="hud-score"><span class="mono">SIGNAL SCORE</span><strong id="score">0</strong></div><div><span class="mono">CHAIN</span><strong id="chain">×0</strong></div><div class="health-cell"><span class="mono">INTEGRITY <b id="health">100%</b></span><div class="health-track"><i id="health-bar"></i></div><small class="mono" id="shield">SHIELD 00</small></div></div><div class="play-grid"><div class="signal-console"><div id="signal-panel"></div><form id="answer-form" autocomplete="off"><label for="answer" class="sr-only">Your answer</label><div class="answer-field"><span class="input-prompt" aria-hidden="true">›</span><input id="answer" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" maxlength="100" placeholder="Transmit an answer…"><button type="submit" aria-label="Transmit answer">${arrow}</button></div><div class="input-meta"><span class="mono">ENTER TO CONNECT</span><div><button type="button" class="text-button" data-action="hint">Hint <span>−50%</span></button><button type="button" class="text-button" data-action="skip">Skip</button></div></div></form><div id="feedback" class="feedback" role="status" aria-live="polite" aria-atomic="true"></div><div class="next-signal" id="next-panel"></div></div><div class="network-console"><div class="network-heading mono"><span>LIVE TOPOLOGY</span><span id="node-count">0 NODES</span></div><canvas id="network" role="img" aria-label="Your live network: nodes connect as correct answers arrive"></canvas><div class="circuit-status mono" id="circuit-status"></div><div class="routes" role="group" aria-label="Route your next answer">${(["power", "shield", "memory"] as Route[]).map((r, i) => `<button class="route-button ${r}" data-action="route" data-route="${r}" aria-pressed="${i === 0}"><span class="route-hotkey">${i + 1}</span><span><strong>${r[0].toUpperCase() + r.slice(1)}</strong><small>${["+20% points", "+8 protection", "+4 repair"][i]}</small></span><i></i></button>`).join("")}</div><div class="route-tip mono">ALT + 1 / 2 / 3 TO ROUTE · ALL THREE = CIRCUIT</div></div></div><div class="transmission-log"><span class="mono muted">RECENT CONNECTIONS</span><div id="history"></div></div></section>`,
    "play",
  );
  network = new NetworkView($("#network"), profile.settings);
  const input = $<HTMLInputElement>("#answer");
  $("#answer-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!game) return;
    const ok = game.submit(input.value, performance.now());
    if (ok) {
      input.value = "";
      audio.play(
        game.run.chain % 5 === 0
          ? "combo"
          : game.run.nodes.at(-1)!.rarity >= 3
            ? "rare"
            : "correct",
      );
    } else audio.play("fail");
    updateGame();
  });
  let lastType = 0;
  input.addEventListener("input", () => {
    const now = performance.now();
    if (now - lastType > 90) {
      audio.play("type");
      lastType = now;
    }
  });
  audio.unlock();
  audio.play("signal");
  input.focus();
  frame(performance.now());
}
function frame(now: number) {
  if (!game || screen !== "game") return;
  game.tick(now);
  updateGame();
  if (screen === "game") loop = requestAnimationFrame(frame);
}
function updateGame() {
  if (!game || screen !== "game") return;
  const g = game,
    r = g.run;
  if (r.ended) {
    completeRun();
    return;
  }
  const tenth = Math.ceil(g.signalRemaining * 10);
  if (tenth !== lastTimer) {
    const timer = $("#signal-time");
    if (timer) timer.textContent = (tenth / 10).toFixed(1);
    const bar = $<HTMLElement>("#signal-progress");
    if (bar) {
      bar.style.transform = `scaleX(${g.signalRemaining / g.signal.duration})`;
      bar.classList.toggle("urgent", g.signalRemaining < 2.5);
    }
    $("#run-time").textContent =
      r.mode === "daily" || r.mode === "duel"
        ? `${Math.min(12, g.signal.index + 1)} / 12 SIGNALS`
        : r.mode === "endless"
          ? `${r.elapsed.toFixed(0)}s ELAPSED`
          : `${Math.max(0, g.limit - r.elapsed).toFixed(1)}s`;
    if (tenth === 25) audio.play("warning");
    lastTimer = tenth;
  }
  if (lastRevision === g.revision) return;
  lastRevision = g.revision;
  $("#score").textContent = format(r.score);
  $("#chain").textContent = `×${r.chain}`;
  $("#chain").classList.toggle("overdrive", r.chain >= 10);
  $("#health").textContent = `${r.health}%`;
  $("#health-bar").style.width = `${r.health}%`;
  $("#health-bar").classList.toggle("urgent", r.health < 30);
  $("#shield").textContent = `SHIELD ${String(r.shield).padStart(2, "0")}`;
  $("#node-count").textContent = `${r.nodes.length} NODES`;
  $("#feedback").className = `feedback ${g.feedback.kind}`;
  $("#feedback").innerHTML =
    `<div><strong>${e(g.feedback.title)}</strong>${g.feedback.points ? `<b>+${format(g.feedback.points)}</b>` : ""}</div><p>${e(g.feedback.detail)}</p>${g.feedback.fact ? `<small class="fact">${e(g.feedback.fact)}</small>` : ""}`;
  for (const b of $$<HTMLButtonElement>(".route-button"))
    b.setAttribute("aria-pressed", String(b.dataset.route === g.route));
  $("#circuit-status").innerHTML =
    `<span>CIRCUIT ${String(r.circuits + 1).padStart(2, "0")}</span><span>${(["power", "shield", "memory"] as Route[]).map((route) => `<i class="circuit-pip ${g.routeCharge.has(route) ? "charged" : ""}"></i>`).join("")} ${g.routeCharge.size}/3 ROUTED</span>`;
  $("#history").innerHTML =
    g.signal.event === "leak"
      ? '<span class="muted">Memory leak · recent log temporarily unavailable</span>'
      : r.nodes
          .slice(-6)
          .reverse()
          .map(
            (n) =>
              `<span class="history-node ${n.alive ? "" : "lost"}"><i class="${n.route}"></i>${e(n.name)}</span>`,
          )
          .join("") ||
        '<span class="muted">Your first connection starts here.</span>';
  if (lastSignal !== g.signal.index) {
    if (lastSignal >= 0) $<HTMLInputElement>("#answer").value = "";
    lastSignal = g.signal.index;
    renderSignal();
    audio.play("signal");
  } else if (g.signal.event === "zero" || g.signal.event === "packet")
    renderSignal();
  const next = g.next;
  $("#next-panel").innerHTML =
    g.signal.event === "blackout"
      ? '<span class="mono muted">NEXT SIGNAL / BLACKOUT</span><strong>Preview connection lost.</strong>'
      : `<span class="mono muted">NEXT SIGNAL / PLAN YOUR ROUTE</span><div><b>${e(next.letter || "*")}</b><span>${e(categoryById.get(next.category)?.name)}<small>${next.ending ? "Ends with " + e(next.letter) : ruleText(next, next.event !== "zero")}</small></span></div>`;
  $<HTMLButtonElement>('[data-action="hint"]').disabled = g.hinted;
  network?.set(r.nodes, r.health);
}
function renderSignal() {
  if (!game) return;
  const s = game.signal,
    ev = EVENTS[s.event];
  $("#signal-panel").innerHTML =
    `<div class="signal-heading mono"><span>SIGNAL ${String(s.index + 1).padStart(3, "0")}</span><span id="signal-time">${game.signalRemaining.toFixed(1)}</span></div><div class="signal-progress-track"><i id="signal-progress"></i></div><div class="signal-brief" role="status" aria-live="polite" aria-atomic="true"><div class="letter-token">${e(s.letter || "*")}<span>${s.letter ? (s.ending ? "ENDS WITH" : "STARTS WITH") : "ANY LETTER"}</span></div><div class="category-brief"><span class="mono muted">${s.secondary ? "BOTH CATEGORIES" : "CATEGORY"}</span><h1>${e(categoryById.get(s.category)?.name)}${s.secondary ? `<span class="secondary-cat">+ ${e(categoryById.get(s.secondary)?.name)}</span>` : ""}</h1></div></div><div class="signal-rule"><span class="rule-mark" aria-hidden="true">⌁</span><span>${e(ruleText(s, game.revealed))}</span></div><div class="event-label ${s.event !== "normal" ? "active-event" : ""}"><span class="mono">${ev.name.toUpperCase()}</span><small>${s.event === "packet" ? `${game.signalUsed.size}/${s.target} connected · ` : ""}${ev.description}</small></div>`;
}
function pauseGame() {
  if (!game || game.run.ended) return;
  game.pause(performance.now());
  openDialog(
    `<div class="eyebrow">TRANSMISSION ON HOLD</div><h2>Take a breath.</h2><p class="muted">Your network and both timers are paused.</p><div class="button-row"><button class="button primary" data-action="resume">Resume ${arrow}</button><button class="button" data-action="end-run">End run</button></div>`,
  );
}
function completeRun() {
  if (!game) return;
  const r = game.run;
  lastRun = r;
  const record = r.score > (profile.records[`${r.mode}:${r.difficulty}`] ?? 0);
  recordRun(profile, r);
  audio.play("finish");
  if (match) {
    match.results.push({
      name: match.names[match.turn % match.names.length],
      run: r,
    });
    match.turn++;
    if (match.turn < match.names.length * match.rounds) {
      handoff();
      return;
    }
    matchResults();
    return;
  }
  screen = "results";
  shell(results(r, record));
  network = new NetworkView($("#network"), profile.settings);
  network.set(r.nodes, r.health);
  $("#main").focus();
}
function handoff() {
  if (!match) return;
  screen = "handoff";
  const round = Math.floor(match.turn / match.names.length) + 1,
    name = match.names[match.turn % match.names.length];
  shell(
    `<section class="handoff"><div class="eyebrow">${MODES[match.mode].name.toUpperCase()} / ROUND ${round} OF ${match.rounds}</div><div class="handoff-logo">${logo}</div><h1>Your channel,<br><em>${e(name)}.</em></h1><p class="muted">Pass the device. The timer starts when you are ready.</p><button class="button primary" data-action="match-turn">I’M READY ${arrow}</button><p class="mono small muted">${match.mode === "duel" ? "12 SHARED SIGNALS" : "30-SECOND TURN"} · ${match.difficulty.toUpperCase()}</p></section>`,
  );
  $("#main").focus();
}
function matchResults() {
  if (!match) return;
  screen = "match-results";
  const table = standings(match);
  const tied = table.filter((t) => t.score === table[0].score);
  shell(
    `<section class="page-section match-results"><div class="eyebrow">${MODES[match.mode].name.toUpperCase()} / COMPLETE</div><h1>${tied.length > 1 ? "Shared frequency." : `${e(table[0].name)} wins.`}</h1><p class="muted">${tied.length > 1 ? "A tie at the top. The network has more than one architect." : "Same conditions. Different connections."}</p><div class="leaderboard">${table.map((p, i) => `<div><span class="mono">${String(i + 1).padStart(2, "0")}</span><strong>${e(p.name)}</strong><b>${format(p.score)}</b></div>`).join("")}</div><div class="button-row"><button class="button primary" data-action="rematch">REMATCH ${arrow}</button><button class="button" data-action="home">Back to network</button></div><p class="muted small">Local match · scores saved on this device.</p></section>`,
  );
}
function bindSettings() {
  for (const input of $$<HTMLInputElement | HTMLSelectElement>(
    "[data-setting]",
  ))
    input.addEventListener("change", () => {
      const key = input.dataset.setting!;
      if (key === "shape")
        profile.settings.shape = (input as HTMLInputElement).checked
          ? "diamond"
          : "square";
      else if (key === "difficulty")
        profile.settings.difficulty = input.value as Difficulty;
      else
        (profile.settings as unknown as Record<string, unknown>)[key] = (
          input as HTMLInputElement
        ).checked;
      saveProfile(profile);
      applySettings();
      if (key === "sound") {
        audio.unlock();
        audio.play("correct");
        updateSound();
      }
    });
  $<HTMLInputElement>("#import-progress").addEventListener(
    "change",
    async (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        if (file.size > 2_000_000) throw new Error("File too large");
        const parsed = JSON.parse(await file.text());
        if (
          parsed.version !== 1 ||
          !Array.isArray(parsed.unlocked) ||
          !parsed.settings
        )
          throw new Error("Invalid backup");
        openDialog(
          `<h2>Restore this backup?</h2><p>This replaces the progress saved in this browser with the selected NODRA backup.</p><div class="button-row"><button class="button primary" id="confirm-import">Restore backup</button><button class="button" data-action="close">Cancel</button></div>`,
        );
        $("#confirm-import").addEventListener("click", () => {
          try {
            localStorage.setItem("nodra.profile.v1", JSON.stringify(parsed));
            profile = readProfile();
            saveProfile(profile);
            applySettings();
            showPage("settings");
            toast("Progress restored.");
          } catch {
            toast("This browser could not save the backup.");
          }
        });
      } catch {
        toast("That file is not a valid NODRA progress backup.");
      }
    },
  );
}
function updateSound() {
  for (const b of $$<HTMLButtonElement>('[data-action="sound"]')) {
    b.setAttribute("aria-pressed", String(profile.settings.sound));
    b.setAttribute(
      "aria-label",
      profile.settings.sound ? "Turn sound off" : "Turn sound on",
    );
    b.innerHTML = `${soundIcon}<span>${profile.settings.sound ? "ON" : "OFF"}</span>`;
  }
}
async function copyResult() {
  if (!lastRun) return;
  const text = shareText(lastRun);
  try {
    await navigator.clipboard.writeText(text);
    $("#share-status").textContent = "Result copied. No answers included.";
  } catch {
    openDialog(
      `<h2>Your result</h2><p class="muted">Copy the text below.</p><textarea class="share-text" readonly>${e(text)}</textarea>`,
    );
    $<HTMLTextAreaElement>(".share-text").select();
  }
}
function navigateSafely(action: () => void) {
  if (screen === "game" && game && !game.run.ended) {
    game.pause(performance.now());
    openDialog(
      '<h2>Leave this run?</h2><p>The unfinished run will not be saved.</p><div class="button-row"><button class="button" data-action="resume">Keep playing</button><button class="button primary" id="confirm-leave">Leave run</button></div>',
    );
    $("#confirm-leave").onclick = action;
  } else action();
}
app.addEventListener("click", (event) => {
  const b = (event.target as Element).closest<HTMLElement>("[data-action]");
  if (!b || b.hasAttribute("disabled")) return;
  const action = b.dataset.action;
  if (action === "home") navigateSafely(showHome);
  else if (action === "codex" || action === "stats" || action === "settings")
    navigateSafely(() => showPage(action));
  else if (action === "play") {
    match = null;
    startRun("quick", profile.settings.difficulty);
  } else if (action === "mode") setupMode(b.dataset.mode as Mode);
  else if (action === "start-mode") startMode();
  else if (action === "how") openDialog(howTo);
  else if (action === "close") {
    closeDialog();
    if (game?.paused && screen === "game") {
      game.resume(performance.now());
      $("#answer").focus();
    }
  } else if (action === "sound") {
    profile.settings.sound = !profile.settings.sound;
    saveProfile(profile);
    applySettings();
    audio.unlock();
    audio.play("correct");
    updateSound();
  } else if (action === "route" && game) {
    game.setRoute(b.dataset.route as Route);
    updateGame();
    $("#answer").focus();
  } else if (action === "hint") {
    game?.hint();
    updateGame();
    $("#answer").focus();
  } else if (action === "skip") {
    game?.miss(performance.now());
    updateGame();
    $("#answer")?.focus();
  } else if (action === "pause") pauseGame();
  else if (action === "resume") {
    closeDialog();
    game?.resume(performance.now());
    $("#answer")?.focus();
  } else if (action === "end-run") {
    closeDialog();
    game?.finish();
    updateGame();
  } else if (action === "again" && lastRun) {
    match = null;
    startRun(
      lastRun.mode,
      lastRun.difficulty,
      lastRun.mode === "daily" ? lastRun.seed : undefined,
    );
  } else if (action === "share") void copyResult();
  else if (action === "card" && lastRun) {
    shareCard(lastRun);
    $("#share-status").textContent = "Share card prepared for download.";
  } else if (action === "codex-more") {
    codexLimit += 60;
    renderCodex();
  } else if (action === "concept" && profile.unlocked.includes(b.dataset.id!))
    openDialog(conceptDetail(b.dataset.id!));
  else if (action === "theme") {
    profile.settings.theme = b.dataset.theme as Profile["settings"]["theme"];
    saveProfile(profile);
    applySettings();
    showPage("settings");
  } else if (action === "export")
    download(
      new Blob([JSON.stringify(profile, null, 2)], {
        type: "application/json",
      }),
      `nodra-progress-${new Date().toISOString().slice(0, 10)}.json`,
    );
  else if (action === "reset")
    openDialog(
      '<h2>Reset your network?</h2><p>This removes all scores, discoveries, settings, and records from this browser. Export a backup first if you want to keep them.</p><div class="button-row"><button class="button" data-action="close">Keep progress</button><button class="button danger" data-action="confirm-reset">Reset everything</button></div>',
    );
  else if (action === "confirm-reset") {
    try {
      localStorage.removeItem("nodra.profile.v1");
      profile = readProfile();
      applySettings();
      showPage("settings");
      toast("Progress reset.");
    } catch {
      toast("Could not reset browser storage.");
    }
  } else if (action === "match-turn" && match)
    startRun(match.mode, match.difficulty, turnSeed(match));
  else if (action === "rematch" && match) {
    match.turn = 0;
    match.results = [];
    match.seed = cryptoSeed();
    handoff();
  }
});
app.addEventListener(
  "cancel",
  (ev) => {
    if (
      (ev.target as Element).tagName === "DIALOG" &&
      game?.paused &&
      screen === "game"
    ) {
      game.resume(performance.now());
      queueMicrotask(() => $("#answer")?.focus());
    }
  },
  true,
);
document.addEventListener("keydown", (ev) => {
  if (ev.isComposing) return;
  const dialog = $<HTMLDialogElement>("#dialog");
  if (dialog?.open) return;
  const target = ev.target as HTMLElement;
  if (
    screen === "home" &&
    ev.key === "Enter" &&
    !["BUTTON", "INPUT", "SELECT", "A"].includes(target.tagName)
  ) {
    ev.preventDefault();
    match = null;
    startRun("quick", profile.settings.difficulty);
  }
  if (screen === "game" && game) {
    if (ev.key === "Escape") {
      ev.preventDefault();
      pauseGame();
    }
    if (ev.altKey && ["1", "2", "3"].includes(ev.key)) {
      ev.preventDefault();
      game.setRoute(
        (["power", "shield", "memory"] as Route[])[Number(ev.key) - 1],
      );
      updateGame();
      $("#answer").focus();
    }
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && screen === "game" && game && !game.paused) pauseGame();
});
showHome();
