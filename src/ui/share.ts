import type { Run } from "../engine/types";
import { download } from "./dom";
export function shareText(r: Run) {
  return `NODRA / ${r.mode === "daily" ? r.date : r.mode.toUpperCase()}\n${r.assisted ? "ASSISTED · " : ""}${r.difficulty.toUpperCase()}\n${"■".repeat(Math.round(r.health / 10))}${"□".repeat(10 - Math.round(r.health / 10))} ${r.health}%\nSCORE ${r.score.toLocaleString("en-US")} · CHAIN ${r.longestChain}\n${r.nodes.length} NODES · ${r.rare} RARE · ${r.circuits} CIRCUITS\nThink fast. Build the network.`;
}
export function shareCard(r: Run) {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 630;
  const x = c.getContext("2d")!;
  x.fillStyle = "#101110";
  x.fillRect(0, 0, 1200, 630);
  x.strokeStyle = "#30332d";
  x.strokeRect(30, 30, 1140, 570);
  x.fillStyle = "#ff6b35";
  x.fillRect(58, 62, 12, 32);
  x.font = "bold 32px sans-serif";
  x.fillStyle = "#eeeee6";
  x.fillText("NODRA", 87, 90);
  x.font = "16px monospace";
  x.fillStyle = "#a7ab9f";
  x.fillText(
    `${r.mode.toUpperCase()} / ${r.date} / ${r.difficulty.toUpperCase()}${r.assisted ? " / ASSISTED" : ""}`,
    60,
    143,
  );
  x.fillStyle = "#eeeee6";
  x.font = "bold 118px sans-serif";
  x.fillText(r.score.toLocaleString("en-US"), 55, 294);
  x.font = "16px monospace";
  x.fillStyle = "#a7ab9f";
  x.fillText("SIGNAL SCORE", 60, 330);
  const metrics = [
    ["CHAIN", r.longestChain],
    ["NODES", r.nodes.length],
    ["RARE", r.rare],
    ["CIRCUITS", r.circuits],
  ];
  metrics.forEach(([label, value], i) => {
    x.fillStyle = "#f1f1e8";
    x.font = "bold 34px monospace";
    x.fillText(String(value), 60 + i * 166, 435);
    x.font = "14px monospace";
    x.fillStyle = "#a7ab9f";
    x.fillText(String(label), 60 + i * 166, 465);
  });
  for (let i = 0; i < 20; i++) {
    x.fillStyle = i < Math.round(r.health / 5) ? "#ff6b35" : "#2b2e26";
    x.fillRect(60 + i * 23, 526, 17, 18);
  }
  x.fillStyle = "#eeeee6";
  x.font = "16px monospace";
  x.fillText(`NETWORK ${r.health}%`, 540, 541);
  // Answer-free, deterministic topology fingerprint.
  const centers = [
    { x: 927, y: 156 },
    { x: 791, y: 443 },
    { x: 1065, y: 443 },
  ];
  x.lineWidth = 1.4;
  const counts = [0, 0, 0];
  for (const n of r.nodes) {
    const k = n.route === "power" ? 0 : n.route === "shield" ? 1 : 2,
      j = counts[k]++,
      p = centers[k],
      angle = j * 2.399;
    const px = p.x + Math.cos(angle) * Math.sqrt(j + 1) * 12,
      py = p.y + Math.sin(angle) * Math.sqrt(j + 1) * 12;
    x.strokeStyle = n.alive ? "#ff6b3566" : "#6b433966";
    x.beginPath();
    x.moveTo(928, 305);
    x.lineTo(px, py);
    x.stroke();
    x.fillStyle = n.alive ? "#ff6b35" : "#5c443b";
    x.fillRect(px - 3, py - 3, 6, 6);
  }
  x.fillStyle = "#ff6b35";
  x.fillRect(916, 293, 24, 24);
  x.font = "14px monospace";
  x.fillStyle = "#a7ab9f";
  x.fillText("YOUR NETWORK FINGERPRINT", 792, 550);
  c.toBlob((b) => {
    if (b) download(b, `nodra-${r.date}-${r.score}.png`);
  });
}
