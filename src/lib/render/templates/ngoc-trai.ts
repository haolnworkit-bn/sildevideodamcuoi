import { initials } from "../../project";
import { TAU, deepGoldPaint, drawPhoto, fitFont, makeLoopParticles, particleAt, particlesFor, radialGlow } from "../helpers";
import type { Photo, RenderContext, VideoTemplate } from "../types";

const GOLD = "#a88a4e";
const INK = "#4a4438";
const GOLD_LINE = "rgba(168,138,78,0.55)";

const glitter = makeLoopParticles(36, 97, { minSize: 2, maxSize: 5, maxLoops: 1 });

export function pearl(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.6, "#f1ede6");
  g.addColorStop(1, "#c9c1b3");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/** Dây ngọc trai võng giữa 2 điểm (đường parabol), lắc nhẹ */
function garland(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, sag: number, r: number) {
  const n = Math.max(4, Math.round(Math.abs(x1 - x0) / (r * 2.3)));
  for (let i = 0; i <= n; i++) {
    const tt = i / n;
    pearl(ctx, x0 + (x1 - x0) * tt, y + sag * 4 * tt * (1 - tt), r);
  }
}

function pearlRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, r: number) {
  const n = Math.round((TAU * R) / (r * 2.25));
  for (let i = 0; i < n; i++) {
    const a = (i * TAU) / n;
    pearl(ctx, cx + Math.cos(a) * R, cy + Math.sin(a) * R, r);
  }
}

function emblem(rc: RenderContext, cx: number, cy: number, r: number, photo: Photo | null) {
  const { ctx, fonts } = rc;
  ctx.save();
  ctx.shadowColor = "rgba(120,100,60,0.2)";
  ctx.shadowBlur = 40;
  ctx.fillStyle = "#fffdf8";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  ctx.restore();
  if (photo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 8, 0, TAU);
    ctx.clip();
    drawPhoto(ctx, photo, cx - r, cy - r, r * 2, r * 2, rc);
    ctx.restore();
  } else {
    const [A, B] = initials(rc.data);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = deepGoldPaint(ctx, cy, r);
    fitFont(ctx, `${A}&${B}`, (s) => `400 ${s}px ${fonts.script}`, r * 1.45, r * 0.85);
    ctx.fillText(`${A}&${B}`, cx, cy + r * 0.06);
  }
  ctx.strokeStyle = deepGoldPaint(ctx, cy, r * 2);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 8, 0, TAU);
  ctx.stroke();
  pearlRing(ctx, cx, cy, r + 28, 9);
}

export const ngocTrai: VideoTemplate = {
  id: "ngoc-trai",
  name: "Ngọc Trai",
  description: "Trắng ngà tinh khôi, dây ngọc trai và viền vàng mảnh",
  tier: "free",
  swatch: ["#fbfaf7", "#a88a4e", "#e9e3d8"],
  colors: ["trang", "vang"],
  theme: { heading: deepGoldPaint, names: deepGoldPaint, body: INK, accent: GOLD, line: GOLD_LINE },
  bodyFont: "serif",
  capsFont: "serif",
  intro: { title: "caps", namesLine: "script", photoMode: "emblem", emblem },

  background(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, Math.max(W, H) * 0.65);
    g.addColorStop(0, "#fdfcf9");
    g.addColorStop(1, "#ece5d8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    radialGlow(ctx, W * 0.5, H * 0.3, Math.max(W, H) * 0.35, "rgba(255,255,255,0.8)");

    ctx.strokeStyle = GOLD_LINE;
    ctx.lineWidth = 2;
    ctx.strokeRect(46, 46, W - 92, H - 92);
    ctx.lineWidth = 1;
    ctx.strokeRect(60, 60, W - 120, H - 120);

    // dây ngọc trai ở 2 góc trên + chuỗi rủ
    const sw = Math.sin(TAU * u) * 6;
    const span = Math.min(W * 0.3, 520);
    for (const side of [1, -1]) {
      const x0 = side > 0 ? 60 : W - 60;
      garland(ctx, x0, x0 + side * span, 60, 120 + sw, 9);
      garland(ctx, x0, x0 + side * span * 0.6, 60, 60 - sw * 0.5, 7);
      for (let i = 0; i < 9; i++) pearl(ctx, x0 + side * (2 + Math.sin(TAU * u + i * 0.3) * i * 0.8), 80 + i * 22, 8);
      pearl(ctx, x0 + side * Math.sin(TAU * u + 2.7) * 7, 290, 14);
    }
  },

  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    ctx.fillStyle = "#c8a85c";
    for (const p of particlesFor(rc, glitter)) {
      const q = particleAt(p, u, W, H, 20, 1);
      ctx.save();
      ctx.globalAlpha *= 0.35 + 0.45 * Math.abs(q.flip);
      ctx.translate(q.x, q.y);
      ctx.rotate(q.rot);
      ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
      ctx.restore();
    }
  },

  ornament(rc, cx, cy) {
    const { ctx } = rc;
    for (let i = -3; i <= 3; i++) pearl(ctx, cx + i * 22, cy + 10, i === 0 ? 11 : 7);
  },

  photoFrame(ctx, photo, x, y, w, h, rc) {
    ctx.save();
    ctx.shadowColor = "rgba(120,100,60,0.2)";
    ctx.shadowBlur = 40;
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    drawPhoto(ctx, photo, x, y, w, h, rc);
    ctx.restore();
    ctx.strokeStyle = deepGoldPaint(ctx, y + h / 2, h);
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 10, y - 10, w + 20, h + 20);
    // viền ngọc trai
    const r = 7;
    const step = r * 2.3;
    for (let xx = x - 26; xx <= x + w + 26; xx += step) {
      pearl(ctx, xx, y - 26, r);
      pearl(ctx, xx, y + h + 26, r);
    }
    for (let yy = y - 26 + step; yy < y + h + 26; yy += step) {
      pearl(ctx, x - 26, yy, r);
      pearl(ctx, x + w + 26, yy, r);
    }
  },
};
