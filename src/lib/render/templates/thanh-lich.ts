import { TAU, drawPhoto, makeLoopParticles, particleAt, particlesFor } from "../helpers";
import type { VideoTemplate } from "../types";

const SAGE = "#5f7155";
const INK = "#3b4535";
const MUTED = "#8b8a72";
const LEAVES = ["#9aab8a", "#7d8f6e", "#b7c4a6", "#6f8262"];

const motes = makeLoopParticles(26, 5, { minSize: 3, maxSize: 8, maxLoops: 1 });

/** Nhánh lá thon, cong nhẹ */
export function sprig(ctx: CanvasRenderingContext2D, len: number, sway: number, seed: number) {
  ctx.save();
  ctx.rotate(sway);
  ctx.strokeStyle = "#7a8a68";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.08, len, len * 0.3);
  ctx.stroke();
  const n = 9;
  for (let i = 1; i <= n; i++) {
    const tt = i / (n + 1);
    const x = len * tt;
    const y = len * (0.08 * 2 * tt * (1 - tt) + 0.3 * tt * tt);
    const side = i % 2 ? 1 : -1;
    const size = 48 * (1 - tt * 0.45);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.25 + side * 0.9 + Math.sin(sway * 30 + i) * 0.06);
    ctx.fillStyle = LEAVES[(i + seed) % LEAVES.length];
    ctx.beginPath();
    ctx.ellipse(size * 0.55, 0, size * 0.6, size * 0.2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export const thanhLich: VideoTemplate = {
  id: "thanh-lich",
  name: "Thanh Lịch",
  description: "Nền kem, lá xanh xô thơm, tối giản hiện đại",
  tier: "premium",
  swatch: ["#f6f1e7", "#5f7155", "#9aab8a"],
  colors: ["trang", "xanh-la"],
  theme: { heading: SAGE, names: SAGE, body: INK, accent: MUTED, line: "rgba(95,113,85,0.5)" },
  bodyFont: "serif",
  capsFont: "serif",
  intro: { title: "caps", namesLine: "script", photoMode: "fullbleed" },

  background(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    ctx.fillStyle = "#f6f1e7";
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, Math.max(W, H) * 0.6);
    g.addColorStop(0, "rgba(255,255,255,0.6)");
    g.addColorStop(1, "rgba(210,200,175,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(110,125,95,0.35)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(54, 54, W - 108, H - 108);

    const sw = (k: number) => Math.sin(TAU * u + k) * 0.03;
    const place = (x: number, y: number, r: number, len: number, k: number, seed: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r);
      sprig(ctx, len, sw(k), seed);
      ctx.restore();
    };
    place(20, 30, 0.35, 430, 0, 0);
    place(10, 120, 0.95, 300, 1, 2);
    place(W - 20, H - 30, Math.PI + 0.35, 430, 2, 1);
    place(W - 10, H - 120, Math.PI + 0.95, 300, 3, 3);
  },

  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    ctx.fillStyle = "#c9b98f";
    for (const p of particlesFor(rc, motes)) {
      const q = particleAt(p, u, W, H, 20, -1);
      ctx.save();
      ctx.globalAlpha *= 0.35 + 0.25 * q.flip;
      ctx.beginPath();
      ctx.arc(q.x, q.y, p.size, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  },

  ornament(rc, cx, cy) {
    const { ctx } = rc;
    ctx.save();
    ctx.translate(cx - 70, cy);
    ctx.scale(0.35, 0.35);
    sprig(ctx, 400, 0, 0);
    ctx.restore();
  },

  photoFrame(ctx, photo, x, y, w, h, rc) {
    // Ảnh kiểu khung tranh: viền lệch phía sau + nhánh lá đè góc
    ctx.strokeStyle = "rgba(95,113,85,0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 28, y + 28, w, h);
    ctx.save();
    ctx.shadowColor = "rgba(60,70,50,0.22)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 14, y + 14, w - 28, h - 28);
    ctx.clip();
    drawPhoto(ctx, photo, x + 14, y + 14, w - 28, h - 28, rc, 0.03);
    ctx.restore();
    ctx.save();
    ctx.translate(x + w - 60, y + h - 30);
    ctx.rotate(-2.4);
    ctx.scale(0.6, 0.6);
    sprig(ctx, 360, Math.sin((TAU * rc.t) / rc.D) * 0.03, 1);
    ctx.restore();
  },
};
