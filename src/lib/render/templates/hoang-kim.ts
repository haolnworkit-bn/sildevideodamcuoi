import { eventTitle, initials, namePair, dateInfo } from "../../project";
import {
  TAU,
  drawEntering,
  drawImageCover,
  enter,
  fitFont,
  goldPaint,
  mulberry32,
  runScenes,
  setSpacing,
  type Scene,
} from "../helpers";
import { drawGreeting, messageScene, namesScene, type SceneStyle } from "../scenes";
import type { PhotoSource, RenderContext, VideoTemplate } from "../types";

const D = 20;
const SCENES: Scene[] = [
  { start: 0, end: 6.6 },
  { start: 6.6, end: 13.3 },
  { start: 13.3, end: 20 },
];
const IVORY = "#ece6d4";
const GOLD_SOFT = "#d9b866";
const GOLD_LINE = "rgba(217,184,102,0.7)";

/** Bokeh: chấm sáng lớn trôi theo quỹ đạo tròn (số vòng nguyên → lặp khớp) */
const rnd = mulberry32(77);
const bokeh = Array.from({ length: 20 }, () => ({
  x: rnd() * 1920,
  y: rnd() * 1080,
  r: 40 + rnd() * 110,
  ax: 40 + rnd() * 120,
  ay: 30 + rnd() * 80,
  k: 1 + Math.floor(rnd() * 2),
  ph: rnd() * TAU,
  a: 0.08 + rnd() * 0.14,
}));
const twinkles = Array.from({ length: 34 }, () => ({
  x: 90 + rnd() * 1740,
  y: 90 + rnd() * 900,
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
function fan(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, up: boolean) {
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

function background(rc: RenderContext) {
  const { ctx, W, H, t } = rc;
  const u = t / D;
  const g = ctx.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H / 2, 1150);
  g.addColorStop(0, "#1d2c48");
  g.addColorStop(1, "#070d19");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  for (const b of bokeh) {
    const x = b.x + Math.cos(TAU * b.k * u + b.ph) * b.ax;
    const y = b.y + Math.sin(TAU * b.k * u + b.ph) * b.ay;
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
}

function foreground(rc: RenderContext) {
  const { ctx, t } = rc;
  const u = t / D;
  ctx.fillStyle = "#ffe7a3";
  for (const s of twinkles) {
    const tw = Math.max(0, Math.sin(TAU * s.k * u + s.ph));
    if (tw < 0.05) continue;
    ctx.save();
    ctx.globalAlpha *= tw;
    ctx.translate(s.x, s.y);
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
}

function framedPhoto(ctx: CanvasRenderingContext2D, photo: PhotoSource, x: number, y: number, w: number, h: number, rc: RenderContext) {
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
  drawImageCover(ctx, photo, x + 12, y + 12, w - 24, h - 24, 1.05 + 0.04 * Math.sin((TAU * rc.t) / D), rc.data.photoFocusY);
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

/** Monogram chữ cái đầu hai tên */
function monogram(rc: RenderContext, cx: number, cy: number, r: number) {
  const { ctx, fonts, t } = rc;
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
  // chấm sáng chạy quanh vòng
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

const style = (rc: RenderContext): SceneStyle => ({
  scriptFont: rc.fonts.script,
  bodyFont: rc.fonts.display,
  bodyItalic: true,
  labelFont: rc.fonts.sans,
  numberFont: rc.fonts.display,
  heading: goldPaint,
  names: goldPaint,
  body: IVORY,
  label: GOLD_SOFT,
  line: GOLD_LINE,
  ornament: (ctx, cx, cy) => fan(ctx, cx, cy + 20, 44, true),
  photoFrame: framedPhoto,
});

function intro(rc: RenderContext, lt: number) {
  const { ctx, W, data, photo, fonts } = rc;
  const info = dateInfo(data);
  const [a, b] = namePair(data);
  const cx = W / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (photo) {
    drawEntering(ctx, enter(lt, 0.1, 1.4), 40, () => framedPhoto(ctx, photo, cx - 250, 130, 500, 560, rc));
  } else {
    drawGreeting(rc, lt, 0.2, cx, 170, GOLD_SOFT, 14);
    drawEntering(ctx, enter(lt, 0.3, 1.4), 30, () => monogram(rc, cx, 400, 170));
  }

  const ty = photo ? 800 : 690;
  drawEntering(ctx, enter(lt, 0.8, 1.3), 30, () => {
    const title = eventTitle(data).toUpperCase();
    ctx.save();
    setSpacing(ctx, 18);
    fitFont(ctx, title, (s) => `500 ${s}px ${fonts.display}`, 1500, 92);
    ctx.fillStyle = goldPaint(ctx, ty, 92);
    ctx.fillText(title, cx, ty);
    ctx.restore();
  });
  drawEntering(ctx, enter(lt, 1.2), 20, () => {
    const s = `${a} & ${b}`;
    fitFont(ctx, s, (z) => `400 ${z}px ${fonts.script}`, 1400, photo ? 80 : 96);
    ctx.fillStyle = IVORY;
    ctx.fillText(s, cx, ty + (photo ? 100 : 120));
  });
  if (info.valid && !photo) {
    drawEntering(ctx, enter(lt, 1.5), 20, () => {
      ctx.font = `500 30px ${fonts.sans}`;
      setSpacing(ctx, 10);
      ctx.fillStyle = GOLD_SOFT;
      ctx.fillText(`${info.weekday.toUpperCase()}  ·  ${info.solar}`, cx, ty + 220);
    });
  }
}

export const hoangKim: VideoTemplate = {
  id: "hoang-kim",
  name: "Hoàng Kim",
  description: "Xanh đêm sang trọng, vàng art-deco, monogram tên hai bạn",
  tier: "premium",
  duration: D,
  swatch: ["#0d1626", "#d9b866", "#ece6d4"],
  render(rc) {
    background(rc);
    const s = style(rc);
    runScenes(rc.ctx, rc.t, D, SCENES, [
      (lt) => intro(rc, lt),
      (lt) => messageScene(rc, lt, s),
      (lt) => namesScene(rc, lt, s),
    ]);
    foreground(rc);
  },
};
