import { TAU, drawPhoto, drawSprite, makeLoopParticles, particleAt, particlesFor, sprite } from "../helpers";
import type { VideoTemplate } from "../types";

const CRIMSON = "#9e1b32";
const BROWN = "#5a3a33";
const ROSEWOOD = "#a45a52";

const petals = makeLoopParticles(22, 53, { minSize: 22, maxSize: 40, drift: -160 });

type Palette = { outer: string; inner: string; core: string };
const BLUSH: Palette = { outer: "#fbe0e3", inner: "#e98a9c", core: "#c94b66" };
const CORAL: Palette = { outer: "#f9c9c0", inner: "#de5d5f", core: "#a92a3b" };

export function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
}

/** Hoa mẫu đơn nhiều lớp cánh gợn sóng (vẽ 1 lần vào sprite) */
export function peony(key: string, pal: Palette = BLUSH) {
  return sprite(`peony-${key}`, 440, 440, (ctx) => {
    ctx.translate(220, 220);
    const rings = [
      { r: 205, n: 9, len: 120, off: 0 },
      { r: 168, n: 8, len: 110, off: 0.3 },
      { r: 128, n: 8, len: 95, off: 0.1 },
      { r: 88, n: 7, len: 75, off: 0.5 },
      { r: 52, n: 6, len: 55, off: 0.2 },
    ];
    rings.forEach((ring, ri) => {
      const tt = ri / (rings.length - 1);
      const light = mix(pal.outer, pal.inner, tt * 0.85);
      const dark = mix(pal.outer, pal.core, 0.35 + tt * 0.65);
      const r0 = ring.r - ring.len;
      const w = ((TAU * ring.r) / ring.n) * 0.62;
      for (let i = 0; i < ring.n; i++) {
        ctx.save();
        ctx.rotate(((i + ring.off) * TAU) / ring.n);
        const g = ctx.createLinearGradient(0, r0, 0, ring.r);
        g.addColorStop(0, dark);
        g.addColorStop(1, light);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-w * 0.25, r0);
        ctx.bezierCurveTo(-w * 0.95, r0 + ring.len * 0.4, -w * 0.85, ring.r, -w * 0.4, ring.r);
        ctx.quadraticCurveTo(-w * 0.2, ring.r + ring.len * 0.1, 0, ring.r - ring.len * 0.03);
        ctx.quadraticCurveTo(w * 0.2, ring.r + ring.len * 0.1, w * 0.4, ring.r);
        ctx.bezierCurveTo(w * 0.85, ring.r, w * 0.95, r0 + ring.len * 0.4, w * 0.25, r0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    });
    ctx.fillStyle = "#f1c94e";
    for (let i = 0; i < 14; i++) {
      const a = (i * TAU) / 14;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 16, Math.sin(a) * 16, 4, 0, TAU);
      ctx.fill();
    }
  });
}

export function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, rot: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.28, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.28, 0, 0);
  ctx.fill();
  ctx.strokeStyle = "rgba(230,240,210,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(len * 0.92, 0);
  ctx.stroke();
  ctx.restore();
}

/** Cụm hoa ở góc (0,0) toả vào trong */
function cluster(ctx: CanvasRenderingContext2D, sway: number) {
  ctx.save();
  ctx.rotate(sway);
  leaf(ctx, 120, 60, 260, 0.15, "#5d7a45");
  leaf(ctx, 60, 140, 240, 1.25, "#4a6637");
  leaf(ctx, 300, 120, 200, 0.6, "#6f8f52");
  leaf(ctx, 150, 260, 210, 1.0, "#5d7a45");
  drawSprite(ctx, peony("coral", CORAL), 330, 70, 0.5, sway * 3 + 0.4);
  drawSprite(ctx, peony("blush", BLUSH), 160, 160, 0.85, -sway * 2);
  ctx.save();
  ctx.translate(90, 380);
  ctx.rotate(0.5 + sway * 4);
  const g = ctx.createRadialGradient(-6, -10, 4, 0, 0, 40);
  g.addColorStop(0, "#f7c3cb");
  g.addColorStop(1, "#c94b66");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 38, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#5d7a45";
  ctx.beginPath();
  ctx.moveTo(-30, 10);
  ctx.quadraticCurveTo(0, 50, 30, 10);
  ctx.quadraticCurveTo(0, 30, -30, 10);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

export const mauDon: VideoTemplate = {
  id: "mau-don",
  name: "Mẫu Đơn",
  description: "Nền ngà ấm, hoa mẫu đơn nhiều lớp cánh, cánh hoa bay",
  tier: "free",
  swatch: ["#fbf5ec", "#9e1b32", "#e98a9c"],
  colors: ["trang", "do", "hong"],
  theme: { heading: CRIMSON, names: CRIMSON, body: BROWN, accent: ROSEWOOD, line: "rgba(164,90,82,0.55)" },
  bodyFont: "serif",
  intro: { title: "script", namesLine: "italic", photoMode: "frame" },

  background(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    const g = ctx.createRadialGradient(W / 2, H / 2, 150, W / 2, H / 2, Math.max(W, H) * 0.6);
    g.addColorStop(0, "#fdf9f2");
    g.addColorStop(1, "#f1e2cf");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(164,90,82,0.35)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(46, 46, W - 92, H - 92);
    ctx.save();
    ctx.translate(W + 10, -10);
    ctx.scale(-1, 1);
    cluster(ctx, Math.sin(TAU * u) * 0.015);
    ctx.restore();
    ctx.save();
    ctx.translate(-10, H + 10);
    ctx.scale(1, -1);
    cluster(ctx, Math.sin(TAU * u + 2) * 0.015);
    ctx.restore();
  },

  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    for (const p of particlesFor(rc, petals)) {
      const q = particleAt(p, u, W, H, 70, 1);
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(q.rot);
      ctx.scale(0.4 + 0.6 * Math.abs(q.flip), 1);
      ctx.globalAlpha *= 0.85;
      const s = p.size;
      const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2);
      g.addColorStop(0, p.pick > 0.5 ? "#f6c6cd" : "#f3b2a8");
      g.addColorStop(1, p.pick > 0.5 ? "#d9677a" : "#cf5254");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.5);
      ctx.bezierCurveTo(-s * 0.7, s * 0.2, -s * 0.55, -s * 0.5, 0, -s * 0.42);
      ctx.bezierCurveTo(s * 0.55, -s * 0.5, s * 0.7, s * 0.2, 0, s * 0.5);
      ctx.fill();
      ctx.restore();
    }
  },

  ornament(rc, cx, cy) {
    drawSprite(rc.ctx, peony("blush", BLUSH), cx, cy - 6, 0.22);
  },

  photoFrame(ctx, photo, x, y, w, h, rc) {
    const r = Math.min(w, h) / 2 - 20;
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.save();
    ctx.shadowColor = "rgba(120,50,50,0.25)";
    ctx.shadowBlur = 40;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx, cy, r + 12, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.clip();
    drawPhoto(ctx, photo, cx - r, cy - r, r * 2, r * 2, rc);
    ctx.restore();
    ctx.strokeStyle = "rgba(158,27,50,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 28, 0, TAU);
    ctx.stroke();
    leaf(ctx, cx + r * 0.55, cy + r * 0.75, 150, -0.3, "#5d7a45");
    drawSprite(ctx, peony("blush", BLUSH), cx + r * 0.72, cy + r * 0.72, 0.42, (TAU * rc.t) / rc.D / 20);
  },
};
