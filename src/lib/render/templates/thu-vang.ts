import { TAU, drawPhoto, makeLoopParticles, particleAt, particlesFor, radialGlow } from "../helpers";
import type { VideoTemplate } from "../types";

const RUST = "#8a3b12";
const INK = "#5a3a24";
const AMBER = "#b8742a";
const LEAF_COLORS: Array<[string, string]> = [
  ["#f3b23c", "#d9762b"],
  ["#e8892f", "#c24a22"],
  ["#d9542b", "#9e2c18"],
  ["#f6cf5a", "#e3962f"],
];

const leaves = makeLoopParticles(18, 83, { minSize: 30, maxSize: 52, drift: -200 });

// nửa phải của lá phong (x ≥ 0), chuẩn hoá theo bán kính 1
const MAPLE_HALF: Array<[number, number]> = [
  [0, -1],
  [0.12, -0.62],
  [0.32, -0.74],
  [0.26, -0.42],
  [0.64, -0.56],
  [0.52, -0.28],
  [0.92, -0.22],
  [0.72, -0.04],
  [0.82, 0.14],
  [0.44, 0.12],
  [0.5, 0.34],
  [0.12, 0.22],
  [0.03, 0.36],
];

export function maple(ctx: CanvasRenderingContext2D, s: number, light: string, dark: string) {
  ctx.beginPath();
  MAPLE_HALF.forEach(([x, y], i) => (i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s)));
  for (let i = MAPLE_HALF.length - 1; i >= 0; i--) ctx.lineTo(-MAPLE_HALF[i][0] * s, MAPLE_HALF[i][1] * s);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -s, 0, s * 0.4);
  g.addColorStop(0, light);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,240,210,0.45)";
  ctx.lineWidth = Math.max(1, s * 0.03);
  ctx.beginPath();
  for (const [x, y] of [
    [0, -0.95],
    [0.88, -0.2],
    [-0.88, -0.2],
    [0.6, -0.52],
    [-0.6, -0.52],
  ]) {
    ctx.moveTo(0, s * 0.28);
    ctx.lineTo(x * s * 0.92, y * s * 0.92);
  }
  ctx.moveTo(0, s * 0.28);
  ctx.lineTo(0, s * 0.75);
  ctx.stroke();
}

/** Cành phong ở góc (0,0) */
function branch(ctx: CanvasRenderingContext2D, sway: number) {
  ctx.save();
  ctx.rotate(sway);
  ctx.strokeStyle = "#5e3b24";
  ctx.lineCap = "round";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(-40, 30);
  ctx.bezierCurveTo(140, 40, 300, 120, 560, 160);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(200, 60);
  ctx.quadraticCurveTo(260, 150, 300, 260);
  ctx.moveTo(380, 125);
  ctx.quadraticCurveTo(450, 60, 520, 40);
  ctx.stroke();
  const spots: Array<[number, number, number, number, number]> = [
    [120, 70, 46, 0.4, 0],
    [230, 95, 54, -0.3, 1],
    [300, 265, 44, 0.2, 2],
    [360, 130, 40, 0.9, 3],
    [470, 170, 50, 0.1, 1],
    [525, 40, 40, -0.6, 0],
    [570, 175, 34, 0.5, 2],
  ];
  spots.forEach(([x, y, s, r, c], i) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r + Math.sin(sway * 30 + i) * 0.05);
    maple(ctx, s, ...LEAF_COLORS[c]);
    ctx.restore();
  });
  ctx.restore();
}

export const thuVang: VideoTemplate = {
  id: "thu-vang",
  name: "Thu Vàng",
  description: "Sắc thu ấm áp cho mùa cưới, lá phong vàng cam rơi",
  tier: "free",
  swatch: ["#fbecd6", "#8a3b12", "#e8892f"],
  colors: ["vang", "do"],
  theme: { heading: RUST, names: RUST, body: INK, accent: AMBER, line: "rgba(184,116,42,0.55)" },
  bodyFont: "display",
  intro: { title: "script", namesLine: "italic", photoMode: "frame" },

  background(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#fdf6ea");
    g.addColorStop(1, "#f4dcbf");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    radialGlow(ctx, W * 0.15, H * 0.1, Math.max(W, H) * 0.5, "rgba(255,226,170,0.55)");
    radialGlow(ctx, W / 2, H / 2, Math.max(W, H) * 0.35, "rgba(255,255,255,0.45)");
    ctx.strokeStyle = "rgba(184,116,42,0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(46, 46, W - 92, H - 92);
    ctx.save();
    ctx.translate(W + 10, -10);
    ctx.scale(-1, 1);
    branch(ctx, Math.sin(TAU * u) * 0.015);
    ctx.restore();
    ctx.save();
    ctx.translate(-10, H + 10);
    ctx.scale(0.75, -0.75);
    branch(ctx, Math.sin(TAU * u + 2) * 0.015);
    ctx.restore();
  },

  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    for (const p of particlesFor(rc, leaves)) {
      const q = particleAt(p, u, W, H, 80, 1);
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(q.rot);
      ctx.scale(0.35 + 0.65 * Math.abs(q.flip), 1);
      ctx.globalAlpha *= 0.9;
      maple(ctx, p.size * 0.6, ...LEAF_COLORS[Math.floor(p.pick * LEAF_COLORS.length) % LEAF_COLORS.length]);
      ctx.restore();
    }
  },

  ornament(rc, cx, cy) {
    const { ctx } = rc;
    ctx.save();
    ctx.translate(cx, cy);
    maple(ctx, 34, ...LEAF_COLORS[1]);
    ctx.restore();
  },

  /** Ảnh kiểu polaroid nghiêng nhẹ, ghim lá phong */
  photoFrame(ctx, photo, x, y, w, h, rc) {
    const pad = Math.max(16, w * 0.04);
    const bottom = pad * 3.2;
    const ph = h - bottom + pad;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(-0.035);
    ctx.translate(-w / 2, -h / 2);
    ctx.save();
    ctx.shadowColor = "rgba(90,50,20,0.3)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad, pad, w - pad * 2, ph - pad * 2);
    ctx.clip();
    drawPhoto(ctx, photo, pad, pad, w - pad * 2, ph - pad * 2, rc);
    ctx.restore();
    ctx.translate(w - pad * 1.5, pad * 0.8);
    ctx.rotate(0.5 + Math.sin((TAU * rc.t) / rc.D) * 0.05);
    maple(ctx, pad * 2.6, ...LEAF_COLORS[2]);
    ctx.restore();
  },
};
