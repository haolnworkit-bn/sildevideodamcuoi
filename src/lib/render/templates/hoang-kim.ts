import { initials } from "../../project";
import { TAU, drawPhoto, goldPaint, mulberry32, particlesFor } from "../helpers";
import type { Photo, RenderContext, VideoTemplate } from "../types";

const GOLD_SOFT = "#d9b866";
const GOLD_LINE = "rgba(217,184,102,0.7)";

/** Bokeh: chấm sáng lớn trôi theo quỹ đạo tròn (số vòng nguyên → lặp khớp). Toạ độ theo tỉ lệ W/H. */
const rnd = mulberry32(77);
const bokeh = Array.from({ length: 30 }, () => ({
  x: rnd(),
  y: rnd(),
  r: 40 + rnd() * 110,
  ax: 40 + rnd() * 120,
  ay: 30 + rnd() * 80,
  k: 1 + Math.floor(rnd() * 2),
  ph: rnd() * TAU,
  a: 0.08 + rnd() * 0.14,
}));
const twinkles = Array.from({ length: 51 }, () => ({
  x: 0.05 + rnd() * 0.9,
  y: 0.08 + rnd() * 0.84,
  s: 3 + rnd() * 7,
  k: 1 + Math.floor(rnd() * 4),
  ph: rnd() * TAU,
}));

function decoCorner(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = GOLD_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const d of [0, 16, 32]) {
    ctx.moveTo(d, 120 - d * 0.5);
    ctx.lineTo(d, d);
    ctx.lineTo(120 - d * 0.5, d);
  }
  ctx.stroke();
  ctx.fillStyle = GOLD_SOFT;
  ctx.save();
  ctx.translate(52, 52);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-6, -6, 12, 12);
  ctx.restore();
}

/** Quạt art-deco (nửa vòng tròn có tia) */
export function fan(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, up: boolean) {
  ctx.save();
  ctx.translate(cx, cy);
  if (!up) ctx.rotate(Math.PI);
  ctx.strokeStyle = GOLD_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI, 0);
  ctx.arc(0, 0, r * 0.6, 0, Math.PI, true);
  ctx.closePath();
  for (let i = 1; i < 8; i++) {
    const a = Math.PI + (i * Math.PI) / 8;
    ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.stroke();
  ctx.restore();
}

function framedPhoto(ctx: CanvasRenderingContext2D, photo: Photo, x: number, y: number, w: number, h: number, rc: RenderContext) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 50;
  ctx.fillStyle = "#0b1322";
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 12, y + 12, w - 24, h - 24);
  ctx.clip();
  drawPhoto(ctx, photo, x + 12, y + 12, w - 24, h - 24, rc);
  ctx.restore();
  ctx.strokeStyle = goldPaint(ctx, y + h / 2, h);
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = GOLD_LINE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 18, y - 18, w + 36, h + 36);
  for (const [cx, cy] of [
    [x - 18, y - 18],
    [x + w + 18, y - 18],
    [x + w + 18, y + h + 18],
    [x - 18, y + h + 18],
  ]) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = GOLD_SOFT;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  }
}

/** Biểu tượng giữa: monogram chữ cái đầu, hoặc ảnh trong khung vàng */
function emblem(rc: RenderContext, cx: number, cy: number, r: number, photo: Photo | null) {
  const { ctx, fonts, t, D } = rc;
  if (photo) {
    const w = r * 1.5;
    const h = r * 1.8;
    framedPhoto(ctx, photo, cx - w / 2, cy - h / 2 - r * 0.05, w, h, rc);
    return;
  }
  const [A, B] = initials(rc.data);
  ctx.lineWidth = 3;
  ctx.strokeStyle = goldPaint(ctx, cy, r * 2);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = GOLD_LINE;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 16, 0, TAU);
  ctx.stroke();
  const a = (TAU * t) / D - Math.PI / 2;
  ctx.fillStyle = "#ffe7a3";
  ctx.beginPath();
  ctx.arc(cx + Math.cos(a) * (r + 16), cy + Math.sin(a) * (r + 16), 5, 0, TAU);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = goldPaint(ctx, cy, r * 1.4);
  ctx.font = `italic 500 ${r * 0.95}px ${fonts.display}`;
  ctx.fillText(A, cx - r * 0.34, cy - r * 0.12);
  ctx.fillText(B, cx + r * 0.34, cy + r * 0.16);
  ctx.strokeStyle = GOLD_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.3, cy - r * 0.7);
  ctx.lineTo(cx - r * 0.3, cy + r * 0.7);
  ctx.stroke();
}

export const hoangKim: VideoTemplate = {
  id: "hoang-kim",
  name: "Hoàng Kim",
  description: "Xanh đêm sang trọng, vàng art-deco, monogram tên hai bạn",
  tier: "premium",
  swatch: ["#0d1626", "#d9b866", "#ece6d4"],
  colors: ["xanh-duong", "vang"],
  theme: { heading: goldPaint, names: goldPaint, body: "#ece6d4", accent: GOLD_SOFT, line: GOLD_LINE },
  bodyFont: "display",
  capsFont: "display",
  intro: { title: "caps", namesLine: "script", photoMode: "emblem", emblem },

  background(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    const g = ctx.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H / 2, Math.max(W, H) * 0.6);
    g.addColorStop(0, "#1d2c48");
    g.addColorStop(1, "#070d19");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (const b of particlesFor(rc, bokeh)) {
      const x = b.x * W + Math.cos(TAU * b.k * u + b.ph) * b.ax;
      const y = b.y * H + Math.sin(TAU * b.k * u + b.ph) * b.ay;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, b.r);
      rg.addColorStop(0, `rgba(232,189,90,${b.a})`);
      rg.addColorStop(0.7, `rgba(232,189,90,${b.a * 0.5})`);
      rg.addColorStop(1, "rgba(232,189,90,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, b.r, 0, TAU);
      ctx.fill();
    }

    ctx.strokeStyle = GOLD_LINE;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(50, 50, W - 100, H - 100);
    ctx.lineWidth = 1;
    ctx.strokeRect(64, 64, W - 128, H - 128);
    const cs: Array<[number, number, number]> = [
      [76, 76, 0],
      [W - 76, 76, Math.PI / 2],
      [W - 76, H - 76, Math.PI],
      [76, H - 76, -Math.PI / 2],
    ];
    for (const [x, y, r] of cs) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r);
      decoCorner(ctx);
      ctx.restore();
    }
    fan(ctx, W / 2, 64, 60, false);
    fan(ctx, W / 2, H - 64, 60, true);
  },

  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    ctx.fillStyle = "#ffe7a3";
    for (const s of particlesFor(rc, twinkles)) {
      const tw = Math.max(0, Math.sin(TAU * s.k * u + s.ph));
      if (tw < 0.05) continue;
      ctx.save();
      ctx.globalAlpha *= tw;
      ctx.translate(s.x * W, s.y * H);
      const r = s.s * (0.6 + 0.4 * tw);
      ctx.beginPath();
      ctx.moveTo(0, -r * 2);
      ctx.quadraticCurveTo(0, 0, r * 2, 0);
      ctx.quadraticCurveTo(0, 0, 0, r * 2);
      ctx.quadraticCurveTo(0, 0, -r * 2, 0);
      ctx.quadraticCurveTo(0, 0, 0, -r * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  ornament(rc, cx, cy) {
    fan(rc.ctx, cx, cy + 20, 44, true);
  },

  photoFrame: framedPhoto,
};
