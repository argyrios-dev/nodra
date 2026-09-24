import { categories, concepts, byId, categoryById } from "../data/knowledge";
import { DIFFICULTY } from "../engine/signals";
import { streak } from "../engine/storage";
import type { Mode, Profile, Run } from "../engine/types";
import { arrow, escape as e, format, logo } from "./dom";
export const MODES: Record<
  Mode,
  { name: string; tag: string; description: string; mark: string }
> = {
  quick: {
    name: "Quick run",
    tag: "90 SECONDS",
    description: "Build fast. Route smart. Keep the core alive.",
    mark: "01",
  },
  daily: {
    name: "Daily Signal",
    tag: "12 SIGNALS · UTC",
    description: "One shared sequence. A fresh network every day.",
    mark: "02",
  },
  endless: {
    name: "Endless",
    tag: "UNTIL COLLAPSE",
    description: "An expanding network. An escalating challenge.",
    mark: "03",
  },
  party: {
    name: "Local party",
    tag: "2–8 PLAYERS",
    description: "Pass the device. Two rounds of 30-second turns.",
    mark: "04",
  },
  duel: {
    name: "Duel",
    tag: "2 PLAYERS · LOCAL",
    description: "Same 12 Signals. Two turns. Highest score wins.",
    mark: "05",
  },
  tech: {
    name: "Tech mode",
    tag: "SYSTEMS / CODE",
    description: "Languages, Linux, security, hardware, and more.",
    mark: "06",
  },
  garage: {
    name: "Garage mode",
    tag: "MACHINES / MOTORSPORT",
    description: "Manufacturers, models, engineering, racing.",
    mark: "07",
  },
  chaos: {
    name: "Chaos mode",
    tag: "UNSTABLE CHANNEL",
    description: "Short windows. Relentless network events.",
    mark: "08",
  },
};
export function modeCards() {
  return Object.entries(MODES)
    .map(
      ([id, m]) =>
        `<button class="mode-card" data-action="mode" data-mode="${id}"><span class="mode-top mono"><span>${m.mark} / ${m.tag}</span>${arrow}</span><span class="mode-title">${m.name}</span><span class="mode-description">${m.description}</span></button>`,
    )
    .join("");
}
export function home(p: Profile) {
  return `<section class="hero" aria-label="Start a game"><div class="hero-sticky"><div class="hero-content"><div class="eyebrow"><span class="live-dot"></span> A KNOWLEDGE SURVIVAL GAME</div><h1>Think fast.<br>Build the<br><em>network.</em></h1><p class="hero-description">One Signal. One answer.<br>Every connection keeps you alive.</p><div class="launch"><button class="button primary play-button" data-action="play">PLAY <span class="play-key">ENTER</span>${arrow}</button><label class="difficulty-picker"><span class="sr-only">Game difficulty</span><select id="home-difficulty">${Object.keys(
    DIFFICULTY,
  )
    .map(
      (d) =>
        `<option value="${d}" ${p.settings.difficulty === d ? "selected" : ""}>${d[0].toUpperCase() + d.slice(1)}</option>`,
    )
    .join(
      "",
    )}</select></label></div><div class="start-meta mono">90 SEC <span>/</span> NO ACCOUNT <span>/</span> ALL INSTINCT</div><button class="daily-shortcut" data-action="mode" data-mode="daily"><span class="daily-glyph">◈</span><span>Daily Signal<small>${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }).toUpperCase()} · SAME SEQUENCE FOR EVERYONE</small></span>${arrow}</button></div><div class="hero-visual"><div class="visual-top mono"><span>NETWORK / LIVE TOPOLOGY</span><span>3D</span></div><canvas id="network" aria-label="Three-dimensional network that rotates and separates into layers as you scroll" role="img"></canvas><div class="visual-bottom mono"><span>POWER <b>●</b> SHIELD <b>●</b> MEMORY</span><span>SCROLL TO REWIRE ↓</span></div></div><div class="hero-bottom"><span class="mono">WORDS BECOME INFRASTRUCTURE.</span><button class="text-button" data-action="how">How to play ${arrow}</button></div></div></section><section class="route-explainer" aria-label="How answers shape your network"><div class="section-kicker mono">01 / CHOOSE WHAT YOUR KNOWLEDGE BECOMES</div><div class="route-columns"><article><span class="route-number power">[ 1 ]</span><h2>Power.</h2><p>Route answers into Power for 20% more points. Keep the chain alive.</p></article><article><span class="route-number shield">[ 2 ]</span><h2>Shield.</h2><p>Store protection against missed Signals. A little insurance under pressure.</p></article><article><span class="route-number memory">[ 3 ]</span><h2>Memory.</h2><p>Repair the core. Fill all three branches to close a circuit and reconnect a lost node.</p></article></div></section><section class="modes-section" id="modes"><div class="section-heading"><div><div class="section-kicker mono">02 / FIND YOUR FREQUENCY</div><h2>Eight ways in.</h2></div><span class="mono muted">ONE LIVING NETWORK</span></div><div class="mode-grid">${modeCards()}</div></section><footer class="home-footer"><span>${logo} NODRA <span class="muted">/</span> THINK FAST. BUILD THE NETWORK.</span><span>${format(concepts.length)} CONCEPTS <span class="muted">/</span> ${categories.length} CATEGORIES</span></footer>`;
}
export function results(r: Run, record: boolean) {
  const accuracy =
    r.correct + r.misses
      ? Math.round((100 * r.correct) / (r.correct + r.misses))
      : 0;
  const metrics = [
    ["Accuracy", `${accuracy}%`],
    ["Longest chain", r.longestChain],
    ["Network health", `${r.health}%`],
    ["Rare answers", r.rare],
    ["Fastest answer", r.fastest ? `${r.fastest.toFixed(2)}s` : "—"],
    ["Nodes built", r.nodes.length],
    ["Circuits closed", r.circuits],
    ["Echo links", r.echoes],
  ];
  return `<section class="results"><div class="result-top mono"><span>${r.health > 0 ? "TRANSMISSION COMPLETE" : "NETWORK OFFLINE"}</span><span>${MODES[r.mode].name.toUpperCase()} / ${r.difficulty.toUpperCase()}</span></div><div class="result-layout"><div><div class="eyebrow">${record ? "PERSONAL RECORD" : "SIGNAL SCORE"}${r.assisted ? " · ASSISTED" : ""}</div><h1 class="result-score">${format(r.score)}</h1><p class="result-line">${r.circuits >= 3 ? "A network with a mind of its own." : r.longestChain >= 10 ? "You found your frequency." : r.correct ? "Every connection counts." : "A new network is one run away."}</p><div class="result-metrics">${metrics.map(([k, v]) => `<div><strong>${v}</strong><span>${k}</span></div>`).join("")}</div></div><div class="result-network"><canvas id="network" role="img" aria-label="Your completed network fingerprint"></canvas><span class="mono">YOUR NETWORK FINGERPRINT</span></div></div><div class="category-line"><span class="mono muted">KNOWLEDGE CONNECTED</span><div>${
    Object.keys(r.categories)
      .filter((k) => r.categories[k].correct)
      .map((k) => `<span>${e(categoryById.get(k)?.name)}</span>`)
      .join("") ||
    "<span>No nodes this time. Try Beginner for more thinking time.</span>"
  }</div></div><div class="result-actions"><button class="button primary" data-action="again">PLAY AGAIN ${arrow}</button><button class="button" data-action="share">Copy result</button><button class="button" data-action="card">Save share card</button><button class="text-button" data-action="home">Back to network</button></div><p class="muted small" id="share-status" role="status">Share cards reveal your network, never your answers.</p></section>`;
}
export function stats(p: Profile) {
  const entries = Object.entries(p.categories).filter(
    ([, v]) => v.correct + v.missed > 0,
  );
  const sorted = [...entries]
    .filter(([, v]) => v.correct + v.missed >= 3)
    .sort(
      (a, b) =>
        b[1].correct / (b[1].correct + b[1].missed) -
        a[1].correct / (a[1].correct + a[1].missed),
    );
  const favorite = [...entries].sort(
    (a, b) => b[1].correct + b[1].missed - (a[1].correct + a[1].missed),
  )[0];
  const metrics = [
    ["Games played", format(p.games)],
    ["Best score", format(p.best)],
    ["Average score", p.games ? format(p.totalScore / p.games) : "—"],
    [
      "Accuracy",
      p.correct + p.misses
        ? `${Math.round((p.correct / (p.correct + p.misses)) * 100)}%`
        : "—",
    ],
    ["Longest chain", p.longestChain],
    ["Fastest answer", p.fastest ? `${p.fastest.toFixed(2)}s` : "—"],
    ["Rare discoveries", p.rare.length],
    ["Daily streak", `${streak(p)} days`],
  ];
  return `<section class="page-section"><div class="page-heading"><div class="eyebrow">YOUR LOCAL TELEMETRY</div><h1>Signal history.</h1><p class="muted">Every run on this device. Every connection you earned.</p></div><div class="stats-grid">${metrics.map(([k, v]) => `<div class="stat-tile"><span>${k}</span><strong>${v}</strong></div>`).join("")}</div><div class="insight-row">${[
    ["Most played", favorite?.[0]],
    ["Strongest", sorted[0]?.[0]],
    ["Room to grow", sorted.length > 1 ? sorted.at(-1)?.[0] : undefined],
  ]
    .map(
      ([k, v]) =>
        `<div><span class="mono muted">${k?.toUpperCase()}</span><h3>${v ? e(categoryById.get(v)?.name) : "Keep connecting"}</h3></div>`,
    )
    .join(
      "",
    )}</div><h2 class="subheading">Category performance</h2><p class="muted small">Accuracy = connected answers ÷ (connected answers + missed Signals). Category rankings need at least 3 attempts.</p><div class="category-stats">${
    entries.length
      ? entries
          .sort((a, b) => b[1].correct - a[1].correct)
          .map(([k, v]) => {
            const rate = Math.round((v.correct / (v.correct + v.missed)) * 100);
            return `<div><span>${e(categoryById.get(k)?.name)}</span><div class="stat-track"><i style="width:${rate}%"></i></div><b class="mono">${rate}%</b><small>${v.correct} / ${v.correct + v.missed}</small></div>`;
          })
          .join("")
      : '<div class="empty-state"><h3>No transmissions yet.</h3><p>Play a run to start building your history.</p><button class="button primary" data-action="play">Play your first run ${arrow}</button></div>'
  }</div></section>`;
}
export function codex(p: Profile) {
  return `<section class="page-section"><div class="page-heading split"><div><div class="eyebrow">YOUR KNOWLEDGE, COLLECTED</div><h1>The Codex.</h1><p class="muted">Connect an answer to unlock its place in the collection.</p></div><div class="collection-count"><strong>${p.unlocked.length}</strong><span class="mono">/ ${concepts.length} DISCOVERED</span></div></div><div class="codex-controls"><label class="search"><span class="sr-only">Search unlocked concepts</span><input id="codex-search" type="search" placeholder="Search your discoveries…" autocomplete="off"></label><label><span class="sr-only">Filter category</span><select id="codex-category"><option value="">All categories</option>${categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}</select></label><label class="check-label"><input id="codex-locked" type="checkbox"> Show undiscovered</label></div><p id="codex-count" class="small muted" role="status"></p><div class="codex-grid" id="codex-grid"></div><button id="codex-more" class="button" data-action="codex-more" hidden>Show more</button></section>`;
}
export function codexEntries(
  p: Profile,
  query: string,
  category: string,
  locked: boolean,
  limit: number,
) {
  const q = query.toLowerCase();
  const matches = concepts.filter(
    (c) =>
      (!category || c.categories.includes(category)) &&
      (p.unlocked.includes(c.id)
        ? !q || [c.name, ...c.aliases].some((a) => a.toLowerCase().includes(q))
        : locked && !q),
  );
  return {
    total: matches.length,
    html:
      matches
        .slice(0, limit)
        .map((c) =>
          p.unlocked.includes(c.id)
            ? `<button class="codex-card rarity-${c.rarity}" data-action="concept" data-id="${c.id}"><span class="codex-symbol">${e(c.name[0])}<i>${["", "I", "II", "III", "IV"][c.rarity]}</i></span><span class="mono small muted">${e(categoryById.get(c.categories[0])?.name.toUpperCase())}</span><strong>${e(c.name)}</strong><span class="rarity-label">${["", "BASIC", "RARE", "CORE", "LEGENDARY"][c.rarity]}</span></button>`
            : `<div class="codex-card locked"><span class="codex-symbol">?</span><span class="mono small muted">${e(categoryById.get(c.categories[0])?.name.toUpperCase())}</span><strong>Unexplored</strong><span class="rarity-label">CONNECT TO DISCOVER</span></div>`,
        )
        .join("") ||
      '<div class="empty-state"><h3>No connections here yet.</h3><p>Discover concepts by submitting them during a run.</p><button class="button" data-action="play">Start a run</button></div>',
  };
}
export function conceptDetail(id: string) {
  const c = byId.get(id)!;
  return `<div class="eyebrow">${["", "BASIC NODE", "RARE NODE", "CORE NODE", "LEGENDARY NODE"][c.rarity]}</div><h2>${e(c.name)}</h2><p>${e(c.fact ?? `Connected in ${c.categories.map((k) => categoryById.get(k)?.name).join(" and ")}.`)}</p><dl class="detail-list"><dt>Categories</dt><dd>${c.categories.map((k) => e(categoryById.get(k)?.name)).join(", ")}</dd>${c.year ? `<dt>First appeared</dt><dd>${c.year}</dd>` : ""}${c.aliases.length ? `<dt>Also accepted</dt><dd>${c.aliases.map(e).join(", ")}</dd>` : ""}<dt>Node class</dt><dd>${["", "Basic", "Rare", "Core", "Legendary"][c.rarity]} · ${c.rarity}/4</dd></dl>`;
}
export function settings(p: Profile) {
  const s = p.settings;
  return `<section class="page-section settings-page"><div class="page-heading"><div class="eyebrow">MAKE THE NETWORK YOURS</div><h1>Control room.</h1></div><div class="settings-section"><h2>Experience</h2>${[
    ["sound", "Sound", "Subtle synthesized tones. No external audio."],
    [
      "motion",
      "Animation",
      "Disable for a still network. System reduced-motion settings always take priority.",
    ],
    [
      "contrast",
      "High contrast",
      "Stronger borders and brighter secondary text.",
    ],
  ]
    .map(
      ([key, label, description]) =>
        `<label class="setting-row"><span><strong>${label}</strong><small>${description}</small></span><input type="checkbox" data-setting="${key}" ${s[key as "sound"] ? "checked" : ""} role="switch"></label>`,
    )
    .join(
      "",
    )}<label class="setting-row"><span><strong>Default difficulty</strong><small>Daily Signal uses Standard for everyone.</small></span><select data-setting="difficulty">${Object.keys(
    DIFFICULTY,
  )
    .map(
      (d) =>
        `<option value="${d}" ${s.difficulty === d ? "selected" : ""}>${d[0].toUpperCase() + d.slice(1)}</option>`,
    )
    .join(
      "",
    )}</select></label></div><div class="settings-section"><h2>Network finishes</h2><p class="muted">Cosmetic unlocks only. Every player starts with the same power.</p><div class="theme-options">${[
    ["signal", "Signal orange", 0],
    ["ice", "Ice blue", 15],
    ["phosphor", "Phosphor", 50],
  ]
    .map(
      ([id, name, n]) =>
        `<button class="theme-option ${s.theme === id ? "selected" : ""}" data-action="theme" data-theme="${id}" ${p.unlocked.length < Number(n) ? "disabled" : ""}><i class="theme-swatch ${id}"></i><strong>${name}</strong><small>${p.unlocked.length >= Number(n) ? (s.theme === id ? "ACTIVE" : "UNLOCKED") : `Discover ${n} concepts`}</small></button>`,
    )
    .join(
      "",
    )}</div><label class="setting-row"><span><strong>Diamond nodes</strong><small>${p.longestChain >= 10 ? "Unlocked with a 10-answer chain." : "Reach a 10-answer chain to unlock."}</small></span><input data-setting="shape" type="checkbox" role="switch" ${s.shape === "diamond" ? "checked" : ""} ${p.longestChain < 10 ? "disabled" : ""}></label><div class="profile-title"><span class="mono muted">YOUR TITLE</span><strong>${p.unlocked.length >= 100 ? "Network architect" : p.longestChain >= 20 ? "System ascendant" : p.longestChain >= 10 ? "Overdriver" : p.games >= 5 ? "Signal runner" : "New connection"}</strong></div></div><div class="settings-section"><h2>Your data</h2><p class="muted">Progress stays in this browser. Export a backup before changing devices or clearing site data.</p><div class="button-row"><button class="button" data-action="export">Export progress</button><label class="button import-label">Import progress<input id="import-progress" type="file" accept="application/json,.json" class="sr-only"></label><button class="text-button danger" data-action="reset">Reset progress</button></div><p class="small muted" id="settings-status" role="status"></p></div></section>`;
}
export const howTo = `<div class="eyebrow">TEN SECONDS TO CONNECT</div><h2>See the Signal.<br>Send an answer.</h2><div class="how-example"><span>P</span><div>Programming language<small>Try Python. Press Enter.</small></div></div><ol class="how-list"><li><b>Read the letter, category, and rule.</b> Type any known matching answer. Aliases count.</li><li><b>Your answer becomes a node.</b> Speed, rarity, and a longer chain mean more points.</li><li><b>Choose a branch.</b> Alt+1 Power = +20% score. Alt+2 Shield = absorb damage. Alt+3 Memory = extra healing.</li><li><b>Close the circuit.</b> Use all three branches for +150 points, +12 health, and one repaired node.</li></ol><p class="muted">Miss a Signal and the network takes damage. Wrong guesses let you retry until time runs out. Read the next Signal to plan ahead.</p><div class="help-keys mono">ENTER TRANSMIT · ESC PAUSE · ALT+1/2/3 ROUTE</div><p class="small muted">Constraints use the canonical name. For example, “cpp” maps to “C++”. The offline Codex is curated, so an unlisted valid answer may need an alternative.</p>`;
