import type { NetworkNode, Route, Settings } from "../engine/types";
type Point = {
  x: number;
  y: number;
  z: number;
  id: number;
  route: Route;
  rarity: number;
  alive: boolean;
  name: string;
};
const routes: Route[] = ["power", "shield", "memory"];
export class NetworkView {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  settings: Settings;
  nodes: NetworkNode[] = [];
  health = 100;
  home: boolean;
  frame = 0;
  observer: ResizeObserver;
  width = 0;
  height = 0;
  progress = 0;
  last = 0;
  alive = true;
  dirty = true;
  constructor(canvas: HTMLCanvasElement, settings: Settings, home = false) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.settings = settings;
    this.home = home;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
    this.animate(0);
  }
  resize() {
    const b = this.canvas.getBoundingClientRect();
    this.width = b.width;
    this.height = b.height;
    const d = Math.min(devicePixelRatio, 2);
    this.canvas.width = b.width * d;
    this.canvas.height = b.height * d;
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
    this.dirty = true;
  }
  set(nodes: NetworkNode[], health = 100) {
    this.nodes = nodes;
    this.health = health;
    this.dirty = true;
  }
  destroy() {
    this.alive = false;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
  }
  animate = (t: number) => {
    if (!this.alive) return;
    const reduced =
      !this.settings.motion ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    const container = this.canvas.closest(".hero");
    if (this.home && container) {
      const box = container.getBoundingClientRect();
      this.progress = Math.max(0, Math.min(1, -box.top / (box.height * 0.58)));
    }
    if ((!reduced && !document.hidden) || this.dirty) {
      this.draw(reduced ? 0 : t, reduced);
      this.dirty = false;
    }
    this.frame = requestAnimationFrame(this.animate);
  };
  draw(t: number, reduced: boolean) {
    const ctx = this.ctx,
      w = this.width,
      h = this.height;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const accent =
      this.settings.theme === "ice"
        ? "#91d4f4"
        : this.settings.theme === "phosphor"
          ? "#b9ee78"
          : "#ff6b35";
    const shield = "#a7c7bf",
      memory = "#dedccf";
    const color = (r: Route) =>
      r === "power" ? accent : r === "shield" ? shield : memory;
    const points: Point[] = [];
    const counts = { power: 0, shield: 0, memory: 0 };
    const source = this.home
      ? Array.from({ length: 66 }, (_, i) => ({
          id: i,
          route: routes[i % 3],
          rarity: i % 11 === 0 ? 4 : i % 4 === 0 ? 3 : 1,
          alive: true,
          name: "",
        }))
      : this.nodes.slice(-84);
    for (const n of source) {
      const ri = routes.indexOf(n.route),
        j = counts[n.route]++;
      const spread = this.home ? 1 + this.progress * 0.75 : 1;
      const angle = (ri * Math.PI * 2) / 3 - Math.PI / 2;
      const a = angle + ((j % 3) - 1) * 0.19;
      const radius = (65 + Math.floor(j / 3) * 24 + (j % 3) * 13) * spread;
      points.push({
        x: Math.cos(a) * radius,
        y: Math.sin(a) * radius,
        z: Math.sin(j * 2.1 + ri) * 45 * (1 + this.progress * 3),
        id: n.id,
        route: n.route,
        rarity: n.rarity,
        alive: n.alive,
        name: n.name,
      });
    }
    // Perspective projection: scroll rotates all three axes and separates the network layers.
    const ry = this.home
      ? -0.35 + this.progress * 2.5 + Math.sin(t * 0.00012) * 0.08
      : 0.2;
    const rx = this.home ? 0.3 + this.progress * 0.45 : 0.18;
    const rz = this.home ? -0.25 + this.progress * 0.45 : 0;
    const scale = Math.min(w / (this.home ? 600 : 620), h / 540, 1.4);
    const project = (p: { x: number; y: number; z: number }) => {
      let x = p.x * Math.cos(ry) + p.z * Math.sin(ry),
        z = -p.x * Math.sin(ry) + p.z * Math.cos(ry);
      let y = p.y * Math.cos(rx) - z * Math.sin(rx);
      z = p.y * Math.sin(rx) + z * Math.cos(rx);
      const xx = x * Math.cos(rz) - y * Math.sin(rz),
        yy = x * Math.sin(rz) + y * Math.cos(rz);
      const perspective = 700 / (700 + z);
      return {
        x: w * 0.5 + xx * scale * perspective,
        y: h * 0.48 + yy * scale * perspective,
        z,
        scale: perspective * scale,
      };
    };
    const root = project({ x: 0, y: 0, z: 0 });
    // Fine telemetry field.
    ctx.fillStyle = this.settings.contrast ? "#545750" : "#2c2f2b";
    for (let x = 16; x < w; x += 28)
      for (let y = 16; y < h; y += 28) {
        ctx.fillRect(x, y, 1, 1);
      }
    ctx.strokeStyle = this.settings.contrast ? "#60635c" : "#2b2e29";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 8]);
    for (const rad of [110, 210]) {
      ctx.beginPath();
      ctx.ellipse(
        root.x,
        root.y,
        rad * scale,
        rad * scale * 0.7,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    ctx.setLineDash([]);
    const prev: Partial<Record<Route, Point>> = {};
    for (const p of points) {
      const from = prev[p.route] ? project(prev[p.route]!) : root,
        to = project(p);
      ctx.strokeStyle = p.alive ? `${color(p.route)}65` : "#d9646450";
      ctx.lineWidth = p.rarity >= 3 ? 1.3 : 0.7;
      if (!p.alive) ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      const bend = { x: from.x + (to.x - from.x) * 0.5, y: from.y };
      ctx.lineTo(bend.x, bend.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (p.alive && !reduced) {
        const f = (t * 0.00035 + p.id * 0.131) % 1;
        ctx.fillStyle = color(p.route);
        const px = from.x + (to.x - from.x) * f,
          py = from.y + (to.y - from.y) * f;
        ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
      }
      prev[p.route] = p;
    }
    for (const p of [...points].sort((a, b) => project(b).z - project(a).z)) {
      const at = project(p),
        size = (p.rarity >= 3 ? 6 : 3.5) * Math.max(0.6, at.scale);
      ctx.save();
      ctx.translate(at.x, at.y);
      if (this.settings.shape === "diamond") ctx.rotate(Math.PI / 4);
      ctx.fillStyle = p.alive ? color(p.route) : "#30221e";
      ctx.strokeStyle = p.alive ? color(p.route) : "#dd6c62";
      if (p.rarity >= 3) {
        ctx.strokeRect(-size - 3, -size - 3, size * 2 + 6, size * 2 + 6);
        ctx.globalAlpha = 0.85;
      }
      ctx.fillRect(-size, -size, size * 2, size * 2);
      if (!p.alive) {
        ctx.beginPath();
        ctx.moveTo(-size, -size);
        ctx.lineTo(size, size);
        ctx.stroke();
      }
      ctx.restore();
      if (!this.home && p.name && p === points.at(-1)) {
        ctx.fillStyle = "#f0f0e6";
        ctx.font = "12px ui-monospace, monospace";
        ctx.fillText(p.name.slice(0, 23), at.x + 12, at.y - 10);
      }
    }
    // A small rotating wireframe core makes the 3D depth legible even before the first answer.
    const cube = [
      [-22, -22, -22],
      [22, -22, -22],
      [22, 22, -22],
      [-22, 22, -22],
      [-22, -22, 22],
      [22, -22, 22],
      [22, 22, 22],
      [-22, 22, 22],
    ].map(([x, y, z]) => project({ x, y, z }));
    ctx.fillStyle = "#131511";
    ctx.beginPath();
    for (const [i, p] of cube.slice(4).entries())
      i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.health < 30 ? "#ff6666" : accent;
    ctx.lineWidth = 1.5;
    for (const [a, b] of [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ]) {
      ctx.beginPath();
      ctx.moveTo(cube[a].x, cube[a].y);
      ctx.lineTo(cube[b].x, cube[b].y);
      ctx.stroke();
    }
    ctx.fillStyle = accent;
    ctx.font = "bold 16px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("N", root.x, root.y + 5);
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = "#92998b";
    ctx.fillText(
      this.home ? "CORE / 001" : `INTEGRITY / ${this.health}%`,
      root.x,
      root.y + 50 * scale,
    );
    ctx.textAlign = "left";
    for (let r = 0; r < 3; r++) {
      const angle = (r * Math.PI * 2) / 3 - Math.PI / 2;
      const point = project({
        x: Math.cos(angle) * 270,
        y: Math.sin(angle) * 250,
        z: 0,
      });
      ctx.fillStyle = color(routes[r]);
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign =
        point.x < w * 0.3 ? "left" : point.x > w * 0.7 ? "right" : "center";
      ctx.fillText(
        routes[r].toUpperCase(),
        Math.min(w - 6, Math.max(6, point.x)),
        Math.min(h - 12, Math.max(16, point.y)),
      );
    }
    ctx.textAlign = "left";
  }
}
