import { dateInfo, eventTitle, namePair } from "../../project";
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
import { drawDivider, drawGreeting, messageScene, namesScene, type SceneStyle } from "../scenes";
import type { RenderContext, VideoTemplate } from "../types";

const D = 20;
const SCENES: Scene[] = [
  { start: 0, end: 6.6 },
  { start: 6.6, end: 13.3 },
  { start: 13.3, end: 20 },
];
const SAGE = "#5f7155";
const INK = "#3b4535";
const MUTED = "#8b8a72";
const LEAVES = ["#9aab8a", "#7d8f6e", "#b7c4a6", "#6f8262"];

const motes = makeLoopParticles(26, 5, { minSize: 3, maxSize: 8, maxLoops: 1 });

/** Nhánh lá thon, cong nhẹ */
function sprig(ctx: CanvasRenderingContext2D, len: number, sway: number, seed: number) {
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

function background(rc: RenderContext) {
  const { ctx, W, H, t } = rc;
  const u = t / D;
  ctx.fillStyle = "#f6f1e7";
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 1100);
  g.addColorStop(0, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(210,200,175,0.35)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(110,125,95,0.35)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(54, 54, W - 108, H - 108);

  const sw = (k: number) => Math.sin(TAU * u + k) * 0.03;
  ctx.save();
  ctx.translate(20, 30);
  ctx.rotate(0.35);
  sprig(ctx, 430, sw(0), 0);
  ctx.restore();
  ctx.save();
  ctx.translate(10, 120);
  ctx.rotate(0.95);
  sprig(ctx, 300, sw(1), 2);
  ctx.restore();
  ctx.save();
  ctx.translate(W - 20, H - 30);
  ctx.rotate(Math.PI + 0.35);
  sprig(ctx, 430, sw(2), 1);
  ctx.restore();
  ctx.save();
  ctx.translate(W - 10, H - 120);
  ctx.rotate(Math.PI + 0.95);
  sprig(ctx, 300, sw(3), 3);
  ctx.restore();
}

function foreground(rc: RenderContext) {
  const { ctx, W, H, t } = rc;
  const u = t / D;
  ctx.fillStyle = "#c9b98f";
  for (const p of motes) {
    const q = particleAt(p, u, W, H, 20, -1);
    ctx.save();
    ctx.globalAlpha *= 0.35 + 0.25 * q.flip;
    ctx.beginPath();
    ctx.arc(q.x, q.y, p.size, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

const style = (rc: RenderContext): SceneStyle => ({
  scriptFont: rc.fonts.script,
  bodyFont: rc.fonts.serif,
  bodyItalic: true,
  labelFont: rc.fonts.sans,
  numberFont: rc.fonts.serif,
  heading: SAGE,
  names: SAGE,
  body: INK,
  label: MUTED,
  line: "rgba(95,113,85,0.5)",
  ornament: (ctx, cx, cy) => {
    ctx.save();
    ctx.translate(cx - 70, cy);
    ctx.scale(0.35, 0.35);
    sprig(ctx, 400, 0, 0);
    ctx.restore();
  },
  photoFrame: (ctx, photo, x, y, w, h, r) => {
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
    drawImageCover(ctx, photo, x + 14, y + 14, w - 28, h - 28, 1.05 + 0.03 * Math.sin((TAU * r.t) / D), r.data.photoFocusY);
    ctx.restore();
    ctx.save();
    ctx.translate(x + w - 60, y + h - 30);
    ctx.rotate(-2.4);
    ctx.scale(0.6, 0.6);
    sprig(ctx, 360, Math.sin((TAU * r.t) / D) * 0.03, 1);
    ctx.restore();
  },
});

function intro(rc: RenderContext, lt: number) {
  const { ctx, W, H, data, photo, fonts, t } = rc;
  const info = dateInfo(data);
  const [a, b] = namePair(data);
  const cx = W / 2;
  const onPhoto = !!photo;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (photo) {
    drawEntering(ctx, enter(lt, 0, 1.2), 0, () => {
      drawImageCover(ctx, photo, 0, 0, W, H, 1.04 + 0.05 * (0.5 - 0.5 * Math.cos((TAU * t) / D)), data.photoFocusY);
      const g = ctx.createLinearGradient(0, H * 0.35, 0, H);
      g.addColorStop(0, "rgba(20,24,18,0)");
      g.addColorStop(1, "rgba(20,24,18,0.78)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });
  }

  const base = onPhoto ? 700 : 400;
  const fg = onPhoto ? "#fdfaf2" : INK;
  const accent = onPhoto ? "#e6ddc6" : SAGE;

  drawGreeting(rc, lt, 0.5, cx, base - 110, accent, 14);
  drawEntering(ctx, enter(lt, 0.8, 1.3), 30, () => {
    const title = eventTitle(data).toUpperCase();
    ctx.save();
    setSpacing(ctx, 22);
    fitFont(ctx, title, (s) => `500 ${s}px ${fonts.serif}`, 1600, 130);
    ctx.fillStyle = fg;
    ctx.fillText(title, cx, base);
    ctx.restore();
  });
  drawEntering(ctx, enter(lt, 1.2), 0, () => drawDivider(ctx, cx, base + 95, 200, accent));
  drawEntering(ctx, enter(lt, 1.5), 20, () => {
    const s = `${a} & ${b}`;
    fitFont(ctx, s, (z) => `400 ${z}px ${fonts.script}`, 1500, 96);
    ctx.fillStyle = onPhoto ? "#fdfaf2" : SAGE;
    ctx.fillText(s, cx, base + 195);
  });
  if (info.valid && !onPhoto) {
    drawEntering(ctx, enter(lt, 1.8), 20, () => {
      ctx.font = `500 32px ${fonts.sans}`;
      setSpacing(ctx, 8);
      ctx.fillStyle = MUTED;
      ctx.fillText(`${info.weekday.toUpperCase()}  ·  ${info.solar}`, cx, base + 310);
    });
  }
}

export const thanhLich: VideoTemplate = {
  id: "thanh-lich",
  name: "Thanh Lịch",
  description: "Nền kem, lá xanh xô thơm, tối giản hiện đại",
  tier: "premium",
  duration: D,
  swatch: ["#f6f1e7", "#5f7155", "#9aab8a"],
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
