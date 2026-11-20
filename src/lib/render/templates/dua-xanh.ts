import { TAU, archPath, drawPhoto, makeLoopParticles, particleAt, particlesFor, radialGlow } from "../helpers";
import type { VideoTemplate } from "../types";

const GREEN = "#2f6b44";
const INK = "#27472f";
const SOFT = "#6a9a6e";

/** Đom đóm: bay lên chậm, nhấp nháy */
const flies = makeLoopParticles(34, 52, { minSize: 3, maxSize: 7, maxLoops: 1, drift: 60 });

/** Tàu lá dừa: sống lá cong + các lá chét hai bên */
export function frond(ctx: CanvasRenderingContext2D, len: number, sway: number) {
  ctx.save();
  ctx.rotate(sway);
  const pt = (t: number) => ({
    x: len * t,
    y: len * (0.22 * t * t + 0.1 * Math.sin(t * Math.PI) * -1),
  });
  ctx.strokeStyle = "#4d7a3e";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) {
    const p = pt(i / 30);
    i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
  }
  ctx.stroke();
  const n = 22;
  for (let i = 1; i <= n; i++) {
    const tt = i / (n + 1);
    const p = pt(tt);
    const size = 120 * Math.sin(Math.PI * Math.min(1, tt * 1.15)) + 20;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(side * (1.05 - tt * 0.35) + 0.3);
      ctx.fillStyle = (i + (side > 0 ? 1 : 0)) % 2 ? "#5f9448" : "#3f7a3a";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(size * 0.5, side * -size * 0.1, size, side * size * 0.04);
      ctx.quadraticCurveTo(size * 0.5, side * size * 0.06, 0, 0);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function lotus(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.translate(x, y);
  for (const [ang, col] of [
    [-0.9, "#f4a9c0"],
    [0.9, "#f4a9c0"],
    [-0.45, "#f8c0d2"],
    [0.45, "#f8c0d2"],
    [0, "#fbd6e2"],
  ] as Array<[number, string]>) {
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-r * 0.4, -r * 0.3, -r * 0.35, -r * 0.9, 0, -r);
    ctx.bezierCurveTo(r * 0.35, -r * 0.9, r * 0.4, -r * 0.3, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "#f2c94c";
  ctx.beginPath();
  ctx.arc(0, -r * 0.08, r * 0.1, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export const duaXanh: VideoTemplate = {
  id: "dua-xanh",
  name: "Dừa Xanh Miền Tây",
  description: "Lá dừa nước, sen hồng và đom đóm — mộc mạc miệt vườn",
  tier: "free",
  swatch: ["#eef3dc", "#2f6b44", "#f4a9c0"],
  colors: ["xanh-la", "hong"],
  theme: { heading: GREEN, names: GREEN, body: INK, accent: SOFT, line: "rgba(47,107,68,0.5)" },
  bodyFont: "serif",
  intro: { title: "script", namesLine: "italic", photoMode: "frame" },

  background(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#f7f6e4");
    g.addColorStop(1, "#d9e8c8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    radialGlow(ctx, W * 0.5, H * 0.42, 780, "rgba(255,255,240,0.8)");
    const place = (x: number, y: number, r: number, len: number, k: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r);
      frond(ctx, len, Math.sin(TAU * u + k) * 0.025);
      ctx.restore();
    };
    place(-30, -10, 0.55, 640, 0);
    place(-20, 90, 1.15, 460, 1);
    place(W + 30, H + 10, Math.PI + 0.55, 640, 2);
    place(W + 20, H - 90, Math.PI + 1.15, 460, 3);
    lotus(ctx, W - 130, 120, 70);
    lotus(ctx, W - 220, 150, 44);
    lotus(ctx, 130, H - 110, 62);
  },

  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    for (const p of particlesFor(rc, flies)) {
      const q = particleAt(p, u, W, H, 20, 1);
      const a = 0.3 + 0.7 * Math.abs(q.flip);
      radialGlow(ctx, q.x, q.y, p.size * 5, `rgba(250,225,90,${(0.55 * a).toFixed(3)})`);
      ctx.fillStyle = `rgba(255,245,170,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(q.x, q.y, p.size * 0.6, 0, TAU);
      ctx.fill();
    }
  },

  ornament(rc, cx, cy) {
    lotus(rc.ctx, cx, cy + 20, 46);
    lotus(rc.ctx, cx - 70, cy + 28, 28);
    lotus(rc.ctx, cx + 70, cy + 28, 28);
  },

  photoFrame(ctx, photo, x, y, w, h, rc) {
    ctx.save();
    ctx.shadowColor = "rgba(40,80,50,0.3)";
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle = "#fffdf2";
    archPath(ctx, x - 14, y - 14, w + 28, h + 28);
    ctx.fill();
    ctx.restore();
    ctx.save();
    archPath(ctx, x, y, w, h);
    ctx.clip();
    drawPhoto(ctx, photo, x, y, w, h, rc);
    ctx.restore();
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 3;
    archPath(ctx, x - 14, y - 14, w + 28, h + 28);
    ctx.stroke();
    lotus(ctx, x + 54, y + h + 6, 50);
    lotus(ctx, x + w - 54, y + h + 10, 38);
  },
};
