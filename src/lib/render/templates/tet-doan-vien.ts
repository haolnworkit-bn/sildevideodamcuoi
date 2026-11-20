import { TAU, drawPhoto, goldPaint, makeLoopParticles, particleAt, particlesFor, radialGlow } from "../helpers";
import type { VideoTemplate } from "../types";

const GOLD = "#f6d27a";
const CREAM = "#fff3d6";
const SOFT = "#e9b95c";

const petals = makeLoopParticles(36, 31, { minSize: 12, maxSize: 26, drift: 140 });

/** Hoa mai 5 cánh tròn màu vàng */
export function drawMai(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i * TAU) / 5);
    const g = ctx.createRadialGradient(0, -r * 0.55, 0, 0, -r * 0.55, r * 0.6);
    g.addColorStop(0, "#fff0a0");
    g.addColorStop(1, "#f2b723");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, r * 0.46, r * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "#c26a12";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.16, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#fff3b0";
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.28, Math.sin(a) * r * 0.28, r * 0.04, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function bez(t: number, p0: number, p1: number, p2: number, p3: number) {
  const m = 1 - t;
  return m * m * m * p0 + 3 * m * m * t * p1 + 3 * m * t * t * p2 + t * t * t * p3;
}

function drawBranch(ctx: CanvasRenderingContext2D, sway: number) {
  ctx.save();
  ctx.rotate(sway);
  ctx.strokeStyle = "#4a2418";
  ctx.lineCap = "round";
  const P = [-80, 40, 160, 20, 330, 190, 660, 240];
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(P[0], P[1]);
  ctx.bezierCurveTo(P[2], P[3], P[4], P[5], P[6], P[7]);
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(220, 80);
  ctx.quadraticCurveTo(300, 10, 400, 0);
  ctx.moveTo(420, 210);
  ctx.quadraticCurveTo(470, 290, 520, 350);
  ctx.stroke();
  [0.28, 0.46, 0.62, 0.8, 0.97].forEach((tt, i) => {
    drawMai(ctx, bez(tt, P[0], P[2], P[4], P[6]), bez(tt, P[1], P[3], P[5], P[7]) + (i % 2 ? 14 : -16), 40 - i * 3, i * 0.8);
  });
  drawMai(ctx, 402, 0, 32, 0.4);
  drawMai(ctx, 522, 352, 30, 1.1);
  ctx.fillStyle = "#f2b723";
  for (const [x, y] of [
    [300, 40],
    [480, 280],
    [170, 120],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** Đèn lồng đỏ treo */
function lantern(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, swing: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(swing);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(0, -120 * s);
  ctx.lineTo(0, 0);
  ctx.stroke();
  const g = ctx.createRadialGradient(0, 50 * s, 5, 0, 50 * s, 70 * s);
  g.addColorStop(0, "#ff5a3c");
  g.addColorStop(1, "#a50f1c");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 50 * s, 52 * s, 46 * s, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "rgba(246,210,122,0.55)";
  ctx.lineWidth = 2 * s;
  for (const k of [0.45, 0.8]) {
    ctx.beginPath();
    ctx.ellipse(0, 50 * s, 52 * s * k, 46 * s, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = goldPaint(ctx, 0, 14 * s);
  ctx.fillRect(-20 * s, -2 * s, 40 * s, 12 * s);
  ctx.fillRect(-20 * s, 88 * s, 40 * s, 12 * s);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(0, 100 * s);
  ctx.lineTo(0, 150 * s);
  ctx.stroke();
  ctx.restore();
}

export const tetDoanVien: VideoTemplate = {
  id: "tet-doan-vien",
  name: "Tết Đoàn Viên",
  description: "Đỏ son, hoa mai vàng và đèn lồng — hợp lễ cưới dịp Tết",
  tier: "free",
  swatch: ["#a50f1c", "#f6d27a", "#f2b723"],
  colors: ["do", "vang"],
  theme: { heading: GOLD, names: GOLD, body: CREAM, accent: SOFT, line: "rgba(246,210,122,0.6)" },
  bodyFont: "serif",
  capsFont: "display",
  intro: { title: "script", namesLine: "italic", photoMode: "frame" },

  background(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#8f0f1b");
    g.addColorStop(1, "#5e0812");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    radialGlow(ctx, W * 0.5, H * 0.45, Math.max(W, H) * 0.6, "rgba(230,60,50,0.35)");
    ctx.strokeStyle = "rgba(246,210,122,0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(46, 46, W - 92, H - 92);
    ctx.save();
    ctx.translate(-20, -20);
    drawBranch(ctx, Math.sin(TAU * u) * 0.018);
    ctx.restore();
    ctx.save();
    ctx.translate(W + 20, H + 20);
    ctx.rotate(Math.PI);
    ctx.scale(0.8, 0.8);
    drawBranch(ctx, Math.sin(TAU * u + 1.4) * 0.02);
    ctx.restore();
    const s = Math.min(W, H) / 1080;
    lantern(ctx, W - 150 * s, 0, 0.9 * s, Math.sin(TAU * u) * 0.05);
    lantern(ctx, W - 290 * s, 0, 0.6 * s, Math.sin(TAU * u + 2) * 0.06);
  },

  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    for (const p of particlesFor(rc, petals)) {
      const q = particleAt(p, u, W, H, 40, 1);
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.globalAlpha *= 0.9;
      if (p.pick > 0.85) {
        drawMai(ctx, 0, 0, p.size * 0.9, q.rot);
      } else {
        ctx.rotate(q.rot);
        ctx.scale(0.4 + 0.6 * Math.abs(q.flip), 1);
        ctx.fillStyle = p.pick > 0.5 ? "#f6c84a" : "#ffe08a";
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.42, p.size * 0.55, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  },

  ornament(rc, cx, cy) {
    drawMai(rc.ctx, cx, cy, 40, 0.3);
    drawMai(rc.ctx, cx - 76, cy + 14, 22, 1.2);
    drawMai(rc.ctx, cx + 76, cy + 14, 22, 2.2);
  },

  photoFrame(ctx, photo, x, y, w, h, rc) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle = goldPaint(ctx, y + h / 2, h + 40);
    ctx.fillRect(x - 16, y - 16, w + 32, h + 32);
    ctx.restore();
    ctx.fillStyle = "#5e0812";
    ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    drawPhoto(ctx, photo, x, y, w, h, rc);
    ctx.restore();
    drawMai(ctx, x + 6, y + h - 4, 40, 0.4);
    drawMai(ctx, x + 70, y + h + 18, 24, 1.7);
  },
};
