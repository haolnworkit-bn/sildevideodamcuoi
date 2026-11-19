import { dateInfo, eventTitle, fullNamePair } from "../../project";
import {
  TAU,
  drawEntering,
  drawImageCover,
  drawSprite,
  enter,
  fitFont,
  goldPaint,
  makeLoopParticles,
  particleAt,
  runScenes,
  setSpacing,
  sprite,
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
const CREAM = "#f3ead2";
const GOLD_SOFT = "#e9cf8a";
const GOLD_LINE = "rgba(233,207,138,0.7)";

const dust = makeLoopParticles(40, 31, { minSize: 2, maxSize: 6, maxLoops: 1 });

// ---------- Hoạ tiết: lá trầu & chùm cau ----------

function betelLeaf() {
  return sprite("trau-leaf", 260, 300, (ctx) => {
    const s = 120;
    ctx.translate(130, 150);
    ctx.strokeStyle = "#2d6b34";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.75);
    ctx.lineTo(0, -s * 1.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.75);
    ctx.bezierCurveTo(-s * 0.35, -s * 1.05, -s * 1.0, -s * 0.8, -s * 0.95, -s * 0.15);
    ctx.bezierCurveTo(-s * 0.9, s * 0.45, -s * 0.35, s * 0.8, 0, s * 1.1);
    ctx.bezierCurveTo(s * 0.35, s * 0.8, s * 0.9, s * 0.45, s * 0.95, -s * 0.15);
    ctx.bezierCurveTo(s * 1.0, -s * 0.8, s * 0.35, -s * 1.05, 0, -s * 0.75);
    const g = ctx.createRadialGradient(-s * 0.2, -s * 0.2, 10, 0, 0, s * 1.2);
    g.addColorStop(0, "#5fb46a");
    g.addColorStop(1, "#1c5428");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(225,245,205,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.75);
    ctx.lineTo(0, s * 1.0);
    for (let i = 0; i < 4; i++) {
      const y0 = -s * 0.5 + i * s * 0.35;
      for (const side of [-1, 1]) {
        ctx.moveTo(0, y0);
        ctx.quadraticCurveTo(side * s * 0.35, y0, side * s * 0.7 * (1 - i * 0.15), y0 + s * 0.35);
      }
    }
    ctx.stroke();
  });
}

function arecaCluster() {
  return sprite("trau-areca", 280, 240, (ctx) => {
    const nuts: Array<[number, number, boolean]> = [
      [140, 120, true],
      [92, 140, true],
      [188, 140, false],
      [116, 186, true],
      [166, 190, true],
      [62, 190, false],
      [214, 196, true],
    ];
    ctx.strokeStyle = "#7a6a2c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (const [x, y] of nuts) {
      ctx.moveTo(140, 20);
      ctx.quadraticCurveTo((140 + x) / 2, 50, x, y - 30);
    }
    ctx.stroke();
    for (const [x, y, ripe] of nuts) {
      const g = ctx.createRadialGradient(x - 8, y - 12, 4, x, y, 40);
      g.addColorStop(0, ripe ? "#f6c454" : "#b7d86a");
      g.addColorStop(1, ripe ? "#c0631b" : "#557f2a");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, 26, 34, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.ellipse(x - 9, y - 12, 6, 10, -0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#6b5a22";
      ctx.beginPath();
      ctx.arc(x, y - 32, 5, 0, TAU);
      ctx.fill();
    }
  });
}

/** Cụm trầu cau ở góc (0,0), toả vào trong */
function corner(ctx: CanvasRenderingContext2D, sway: number) {
  ctx.save();
  ctx.rotate(sway);
  const leaf = betelLeaf();
  const leaves: Array<[number, number, number]> = [
    [-1.45, 230, 0.95],
    [-0.95, 215, 1.05],
    [-0.45, 225, 0.95],
    [0.05, 200, 0.8],
  ];
  leaves.forEach(([th, d, sc], i) => {
    const x = -Math.sin(th) * d;
    const y = Math.cos(th) * d;
    drawSprite(ctx, leaf, x * 0.75, y * 0.75, sc, th + Math.sin(sway * 40 + i) * 0.04);
  });
  const th = -0.7;
  drawSprite(ctx, arecaCluster(), -Math.sin(th) * 270, Math.cos(th) * 270, 0.85, th);
  ctx.restore();
}

function background(rc: RenderContext) {
  const { ctx, W, H, t } = rc;
  const u = t / D;
  const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1100);
  g.addColorStop(0, "#1f5e43");
  g.addColorStop(1, "#0a2a1d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // hoạ tiết mắt cáo chìm
  ctx.strokeStyle = "rgba(233,207,138,0.05)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = -H; x < W + H; x += 90) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H, H);
    ctx.moveTo(x, H);
    ctx.lineTo(x + H, 0);
  }
  ctx.stroke();

  ctx.strokeStyle = GOLD_LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(50, 50, W - 100, H - 100, 34);
  ctx.stroke();
  ctx.setLineDash([2, 12]);
  ctx.lineCap = "round";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(68, 68, W - 136, H - 136, 24);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.save();
  ctx.translate(30, 30);
  corner(ctx, Math.sin(TAU * u) * 0.02);
  ctx.restore();
  ctx.save();
  ctx.translate(W - 30, H - 30);
  ctx.rotate(Math.PI);
  corner(ctx, Math.sin(TAU * u + 2) * 0.02);
  ctx.restore();
}

function foreground(rc: RenderContext) {
  const { ctx, W, H, t } = rc;
  const u = t / D;
  ctx.fillStyle = "#f3d98c";
  for (const p of dust) {
    const q = particleAt(p, u, W, H, 20, -1);
    ctx.save();
    ctx.globalAlpha *= 0.3 + 0.5 * (0.5 + 0.5 * q.flip);
    ctx.beginPath();
    ctx.arc(q.x, q.y, p.size, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

/** Dải lụa đỏ có đuôi gấp */
function ribbon(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  const L = cx - w / 2;
  const R = cx + w / 2;
  const T = cy - h / 2;
  const B = cy + h / 2;
  const tail = 130;
  const drop = 36;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = "#7d0d14";
  for (const dir of [-1, 1]) {
    const e = dir < 0 ? L : R;
    ctx.beginPath();
    ctx.moveTo(e - dir * 40, T + drop);
    ctx.lineTo(e + dir * tail, T + drop);
    ctx.lineTo(e + dir * (tail - 55), cy + drop);
    ctx.lineTo(e + dir * tail, B + drop);
    ctx.lineTo(e - dir * 40, B + drop);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = "#4f070b";
  for (const dir of [-1, 1]) {
    const e = dir < 0 ? L : R;
    ctx.beginPath();
    ctx.moveTo(e, B);
    ctx.lineTo(e - dir * 40, B + drop);
    ctx.lineTo(e - dir * 40, B);
    ctx.closePath();
    ctx.fill();
  }
  const g = ctx.createLinearGradient(0, T, 0, B);
  g.addColorStop(0, "#d23039");
  g.addColorStop(1, "#99121b");
  ctx.fillStyle = g;
  ctx.fillRect(L, T, w, h);
  ctx.strokeStyle = GOLD_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(L, T + 14);
  ctx.lineTo(R, T + 14);
  ctx.moveTo(L, B - 14);
  ctx.lineTo(R, B - 14);
  ctx.stroke();
}

function goldFramedPhoto(ctx: CanvasRenderingContext2D, photo: PhotoSource, x: number, y: number, w: number, h: number, rc: RenderContext) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 40;
  ctx.fillStyle = "#0d3324";
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 40);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 10, w - 20, h - 20, 32);
  ctx.clip();
  drawImageCover(ctx, photo, x + 10, y + 10, w - 20, h - 20, 1.06 + 0.04 * Math.sin((TAU * rc.t) / D), rc.data.photoFocusY);
  ctx.restore();
  ctx.lineWidth = 6;
  ctx.strokeStyle = goldPaint(ctx, y + h / 2, h);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 40);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = GOLD_LINE;
  ctx.beginPath();
  ctx.roundRect(x - 16, y - 16, w + 32, h + 32, 52);
  ctx.stroke();
  drawSprite(ctx, arecaCluster(), x + w - 30, y + h - 40, 0.7, -0.3);
}

const style = (rc: RenderContext): SceneStyle => ({
  scriptFont: rc.fonts.script,
  bodyFont: rc.fonts.serif,
  bodyItalic: true,
  labelFont: rc.fonts.sans,
  numberFont: rc.fonts.display,
  heading: goldPaint,
  names: goldPaint,
  body: CREAM,
  label: GOLD_SOFT,
  line: GOLD_LINE,
  ornament: (ctx, cx, cy) => drawSprite(ctx, arecaCluster(), cx, cy, 0.45),
  photoFrame: goldFramedPhoto,
});

function intro(rc: RenderContext, lt: number) {
  const { ctx, W, data, photo, fonts } = rc;
  const info = dateInfo(data);
  const [a, b] = fullNamePair(data);
  const cx = photo ? 1270 : W / 2;
  const rw = photo ? 860 : 1120;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (photo) {
    drawEntering(ctx, enter(lt, 0.1, 1.4), 40, () => goldFramedPhoto(ctx, photo, 230, 170, 560, 740, rc));
  }
  drawGreeting(rc, lt, 0.3, cx, 280, GOLD_SOFT);
  drawEntering(ctx, enter(lt, 0.6, 1.2), 0, () => {
    // dải lụa "mở" theo chiều ngang
    const p = enter(lt, 0.6, 1.2);
    ctx.save();
    ctx.translate(cx, 470);
    ctx.scale(0.6 + 0.4 * p, 1);
    ctx.translate(-cx, -470);
    ribbon(ctx, cx, 470, rw, 190);
    ctx.restore();
  });
  drawEntering(ctx, enter(lt, 1.0, 1.2), 20, () => {
    const title = eventTitle(data);
    fitFont(ctx, title, (s) => `400 ${s}px ${fonts.script}`, rw - 100, 150);
    ctx.fillStyle = goldPaint(ctx, 470, 150);
    ctx.fillText(title, cx, 478);
  });
  drawEntering(ctx, enter(lt, 1.4), 20, () => {
    const s = `${a}  &  ${b}`;
    fitFont(ctx, s, (z) => `italic 500 ${z}px ${fonts.serif}`, rw, 60);
    ctx.fillStyle = CREAM;
    ctx.fillText(s, cx, 660);
  });
  if (info.valid) {
    drawEntering(ctx, enter(lt, 1.7), 20, () => {
      ctx.font = `500 32px ${fonts.sans}`;
      setSpacing(ctx, 8);
      ctx.fillStyle = GOLD_SOFT;
      ctx.fillText(`${info.weekday.toUpperCase()}  ·  ${info.solar}`, cx, 750);
    });
  }
}

export const trauCau: VideoTemplate = {
  id: "trau-cau",
  name: "Trầu Cau",
  description: "Xanh lục truyền thống, lá trầu, chùm cau và dải lụa đỏ",
  tier: "free",
  duration: D,
  swatch: ["#0f3d2e", "#c7262f", "#e9cf8a"],
  suggestedFor: ["an-hoi", "dam-ngo"],
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
