import { dateInfo, eventTitle, fullNamePair } from "../../project";
import {
  TAU,
  drawEntering,
  drawImageCover,
  enter,
  fitFont,
  makeLoopParticles,
  particleAt,
  runScenes,
  setSpacing,
  type Scene,
} from "../helpers";
import { messageScene, namesScene, type SceneStyle } from "../scenes";
import type { RenderContext, VideoTemplate } from "../types";

const D = 20;
const SCENES: Scene[] = [
  { start: 0, end: 6.6 },
  { start: 6.6, end: 13.3 },
  { start: 13.3, end: 20 },
];
const CREAM = "#f8e7c0";
const GOLD_LINE = "rgba(232,190,100,0.75)";

const sparkles = makeLoopParticles(56, 23, { minSize: 4, maxSize: 14, maxLoops: 1 });

function gold(ctx: CanvasRenderingContext2D, y: number, h: number) {
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, "#fff1b8");
  g.addColorStop(0.45, "#e8bd5a");
  g.addColorStop(0.55, "#d29a32");
  g.addColorStop(1, "#f6dc8c");
  return g;
}

function star(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8;
    const rr = i % 2 ? r * 0.28 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
}

/** Hoạ tiết góc: các cung tròn lồng nhau kiểu mây */
function corner(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = GOLD_LINE;
  ctx.lineWidth = 3;
  for (const r of [70, 50, 30]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI / 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#e8bd5a";
  ctx.save();
  ctx.translate(96, 96);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-9, -9, 18, 18);
  ctx.restore();
}

function background(rc: RenderContext) {
  const { ctx, W, H } = rc;
  const g = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 1150);
  g.addColorStop(0, "#c21a2c");
  g.addColorStop(0.6, "#8a0b17");
  g.addColorStop(1, "#4e050c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(240,200,110,0.06)";
  ctx.lineWidth = 2;
  for (let y = 0; y <= H + 80; y += 120) {
    for (let x = (y / 120) % 2 ? 60 : 0; x <= W + 80; x += 120) {
      ctx.beginPath();
      ctx.arc(x, y, 46, 0, TAU);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = GOLD_LINE;
  ctx.lineWidth = 3;
  ctx.strokeRect(44, 44, W - 88, H - 88);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(60, 60, W - 120, H - 120);
  const corners: Array<[number, number, number]> = [
    [60, 60, 0],
    [W - 60, 60, Math.PI / 2],
    [W - 60, H - 60, Math.PI],
    [60, H - 60, -Math.PI / 2],
  ];
  for (const [x, y, r] of corners) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r);
    corner(ctx);
    ctx.restore();
  }
}

function foreground(rc: RenderContext) {
  const { ctx, W, H, t } = rc;
  const u = t / D;
  ctx.fillStyle = "#ffe39a";
  for (const p of sparkles) {
    const q = particleAt(p, u, W, H, 30, -1);
    const tw = 0.5 + 0.5 * Math.sin(TAU * p.flipFreq * u + p.phase);
    ctx.save();
    ctx.globalAlpha *= 0.25 + 0.65 * tw;
    ctx.translate(q.x, q.y);
    ctx.rotate(q.rot * 0.3);
    star(ctx, p.size * (0.7 + 0.3 * tw));
    ctx.fill();
    ctx.restore();
  }
}

/** Huy chương tròn ở giữa: ảnh cặp đôi hoặc chữ Song Hỷ */
function medallion(rc: RenderContext, cx: number, cy: number, r: number) {
  const { ctx, photo, data, t } = rc;
  const u = t / D;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 40;
  ctx.fillStyle = "#7c0913";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  ctx.restore();

  if (photo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 6, 0, TAU);
    ctx.clip();
    drawImageCover(ctx, photo, cx - r, cy - r, r * 2, r * 2, 1.06 + 0.04 * Math.sin(TAU * u), data.photoFocusY);
    ctx.restore();
  } else {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${r * 1.15}px "Noto Serif SC","Noto Serif CJK SC","SimSun","Songti SC","PMingLiU",serif`;
    ctx.fillStyle = gold(ctx, cy, r * 1.2);
    ctx.fillText("囍", cx, cy + r * 0.04);
  }

  ctx.lineWidth = 10;
  ctx.strokeStyle = gold(ctx, cy, r * 2);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = GOLD_LINE;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 26, 0, TAU);
  ctx.stroke();
  // chuỗi hạt vàng xoay chậm (1 vòng / chu kỳ → lặp khớp)
  ctx.fillStyle = "#f1cf78";
  for (let i = 0; i < 36; i++) {
    const a = (i * TAU) / 36 + TAU * u;
    const rr = i % 3 === 0 ? 6 : 3.5;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * (r + 26), cy + Math.sin(a) * (r + 26), rr, 0, TAU);
    ctx.fill();
  }
}

const style = (rc: RenderContext): SceneStyle => ({
  scriptFont: rc.fonts.script,
  bodyFont: rc.fonts.display,
  bodyItalic: true,
  labelFont: rc.fonts.sans,
  numberFont: rc.fonts.display,
  heading: gold,
  names: gold,
  body: CREAM,
  label: "#f1cf78",
  line: GOLD_LINE,
  ornament: (ctx, cx, cy) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = gold(ctx, 0, 60);
    star(ctx, 30);
    ctx.fill();
    ctx.restore();
  },
  photoFrame: (_ctx, _photo, x, y, w, h, r) => medallion(r, x + w / 2, y + h / 2, Math.min(w, h) / 2 - 40),
});

function intro(rc: RenderContext, lt: number) {
  const { ctx, W, data, fonts } = rc;
  const info = dateInfo(data);
  const [a, b] = fullNamePair(data);
  const cx = W / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  drawEntering(ctx, enter(lt, 0.1, 1.4), 40, () => medallion(rc, cx, 360, 200));
  drawEntering(ctx, enter(lt, 0.7, 1.3), 30, () => {
    const title = eventTitle(data);
    fitFont(ctx, title, (s) => `400 ${s}px ${fonts.script}`, 1500, 160);
    ctx.fillStyle = gold(ctx, 720, 160);
    ctx.fillText(title, cx, 720);
  });
  drawEntering(ctx, enter(lt, 1.1), 20, () => {
    const s = `${a}  ♥  ${b}`;
    fitFont(ctx, s, (z) => `italic 500 ${z}px ${fonts.display}`, 1500, 52);
    ctx.fillStyle = CREAM;
    ctx.fillText(s, cx, 840);
  });
  if (info.valid) {
    drawEntering(ctx, enter(lt, 1.4), 20, () => {
      ctx.font = `500 32px ${fonts.sans}`;
      setSpacing(ctx, 8);
      ctx.fillStyle = "#f1cf78";
      ctx.fillText(`${info.weekday.toUpperCase()}  ·  ${info.solar}`, cx, 920);
    });
  }
}

export const hySu: VideoTemplate = {
  id: "hy-su-do-vang",
  name: "Hỷ Sự Đỏ Vàng",
  description: "Đỏ son truyền thống, viền vàng và chữ Song Hỷ",
  tier: "free",
  duration: D,
  swatch: ["#8a0b17", "#e8bd5a", "#f8e7c0"],
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
