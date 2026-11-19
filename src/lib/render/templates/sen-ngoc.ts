import { dateInfo, eventTitle, fullNamePair } from "../../project";
import {
  TAU,
  drawEntering,
  drawImageCover,
  drawSprite,
  enter,
  fitFont,
  makeLoopParticles,
  particleAt,
  runScenes,
  scratchCanvas,
  setSpacing,
  sprite,
  type Scene,
} from "../helpers";
import { drawDivider, drawGreeting, messageScene, namesScene, type SceneStyle } from "../scenes";
import type { PhotoSource, RenderContext, VideoTemplate } from "../types";

const D = 20;
const SCENES: Scene[] = [
  { start: 0, end: 6.6 },
  { start: 6.6, end: 13.3 },
  { start: 13.3, end: 20 },
];
const TEAL = "#1f5f5b";
const INK = "#24423f";
const GOLD = "#b08a3e";
const WATER_Y = 800;

const motes = makeLoopParticles(24, 41, { minSize: 3, maxSize: 7, maxLoops: 1 });

// ---------- Hoạ tiết: hoa sen, lá sen ----------

function lotus() {
  return sprite("sen-lotus", 400, 320, (ctx) => {
    ctx.translate(200, 280);
    const petal = (rot: number, L: number, w: number, light: string, dark: string) => {
      ctx.save();
      ctx.rotate(rot);
      const g = ctx.createLinearGradient(0, 0, 0, -L);
      g.addColorStop(0, light);
      g.addColorStop(1, dark);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-w, -L * 0.45, 0, -L);
      ctx.quadraticCurveTo(w, -L * 0.45, 0, 0);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    };
    for (const r of [-1.45, 1.45]) petal(r, 150, 52, "#f9d9df", "#ea8ea4");
    for (const r of [-1.05, -0.52, 0, 0.52, 1.05]) petal(r, 205, 60, "#fbe3e8", "#e57c96");
    for (const r of [-0.75, -0.25, 0.25, 0.75]) petal(r, 175, 55, "#fde9ed", "#ec93a8");
    for (const r of [-0.42, 0, 0.42]) petal(r, 135, 48, "#fff0f3", "#f0a2b4");
  });
}

function lotusPad(key: string, rx: number) {
  return sprite(`sen-pad-${key}`, rx * 2 + 20, rx * 0.7 + 20, (ctx) => {
    const ry = rx * 0.32;
    ctx.translate(rx + 10, ry + 10);
    const g = ctx.createRadialGradient(0, 0, 10, 0, 0, rx);
    g.addColorStop(0, "#7fb685");
    g.addColorStop(1, "#3b7350");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let a = 0.18; a <= TAU - 0.18; a += 0.05) ctx.lineTo(Math.cos(a) * rx, Math.sin(a) * ry);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(220,240,210,0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 1; i < 12; i++) {
      const a = 0.18 + (i * (TAU - 0.36)) / 12;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * rx * 0.9, Math.sin(a) * ry * 0.9);
    }
    ctx.stroke();
  });
}

function background(rc: RenderContext) {
  const { ctx, W, H, t } = rc;
  const u = t / D;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#f3f8f4");
  g.addColorStop(0.7, "#d6ebe2");
  g.addColorStop(1, "#b9dccf");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // mặt nước
  const wg = ctx.createLinearGradient(0, WATER_Y - 40, 0, H);
  wg.addColorStop(0, "rgba(120,180,165,0)");
  wg.addColorStop(1, "rgba(80,150,135,0.35)");
  ctx.fillStyle = wg;
  ctx.fillRect(0, WATER_Y - 40, W, H - WATER_Y + 40);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const y = WATER_Y + i * 42;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 24) {
      const yy = y + Math.sin(x / 90 + TAU * u * (1 + (i % 2)) + i) * 4;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.globalAlpha = 0.5 - i * 0.05;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // gợn sóng lan toả (mỗi vòng lặp số nguyên lần / chu kỳ)
  const sources: Array<[number, number, number, number]> = [
    [330, 930, 2, 0],
    [1580, 960, 3, 0.4],
    [960, 1010, 2, 0.7],
  ];
  for (const [x, y, k, off] of sources) {
    for (let j = 0; j < 2; j++) {
      const f = (u * k + off + j * 0.5) % 1;
      ctx.strokeStyle = `rgba(255,255,255,${(1 - f) * 0.5})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 40 + f * 260, (40 + f * 260) * 0.22, 0, 0, TAU);
      ctx.stroke();
    }
  }

  // lá & hoa sen trên mặt nước, nhấp nhô nhẹ
  const bob = (ph: number) => Math.sin(TAU * u + ph) * 6;
  drawSprite(ctx, lotusPad("a", 230), 260, 960 + bob(0), 1);
  drawSprite(ctx, lotusPad("b", 160), 520, 1030 + bob(1), 1);
  drawSprite(ctx, lotusPad("a", 230), 1720, 1020 + bob(2), 0.9);
  drawSprite(ctx, lotusPad("b", 160), 1430, 1060 + bob(3), 0.9);
  drawSprite(ctx, lotus(), 250, 840 + bob(0), 0.8, Math.sin(TAU * u) * 0.03);
  drawSprite(ctx, lotus(), 1770, 945 + bob(2), 0.6, Math.sin(TAU * u + 2) * 0.03);
  // nụ sen sát mép trái, không chạm vùng chữ
  ctx.save();
  ctx.translate(105, 990 + bob(1));
  ctx.strokeStyle = "#4f8a5e";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(18, -100, 0, -190);
  ctx.stroke();
  ctx.translate(0, -190);
  ctx.rotate(Math.sin(TAU * u + 1) * 0.06);
  const bg = ctx.createLinearGradient(0, 30, 0, -70);
  bg.addColorStop(0, "#f8d3dc");
  bg.addColorStop(1, "#e06f8c");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.quadraticCurveTo(-42, -20, 0, -80);
  ctx.quadraticCurveTo(42, -20, 0, 20);
  ctx.fill();
  ctx.restore();
}

function foreground(rc: RenderContext) {
  const { ctx, W, H, t } = rc;
  const u = t / D;
  ctx.fillStyle = "#e8cf86";
  for (const p of motes) {
    const q = particleAt(p, u, W, H * 0.85, 20, -1);
    ctx.save();
    ctx.globalAlpha *= 0.35 + 0.35 * q.flip;
    ctx.beginPath();
    ctx.arc(q.x, q.y, p.size, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

/** Ảnh tràn nửa phải, mờ dần sang trái hoà vào nền */
function fadedPhoto(rc: RenderContext, photo: PhotoSource) {
  const { ctx, H, t, data } = rc;
  const x0 = 860;
  const w = 1920 - x0;
  const c = scratchCanvas("sen-photo", w, H);
  const s = c.getContext("2d");
  if (!s) return;
  s.globalCompositeOperation = "source-over";
  s.clearRect(0, 0, w, H);
  drawImageCover(s, photo, 0, 0, w, H, 1.04 + 0.04 * (0.5 - 0.5 * Math.cos((TAU * t) / D)), data.photoFocusY);
  s.globalCompositeOperation = "destination-in";
  const g = s.createLinearGradient(0, 0, 420, 0);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,1)");
  s.fillStyle = g;
  s.fillRect(0, 0, w, H);
  const g2 = s.createLinearGradient(0, H - 260, 0, H);
  g2.addColorStop(0, "rgba(0,0,0,1)");
  g2.addColorStop(1, "rgba(0,0,0,0)");
  s.fillStyle = g2;
  s.fillRect(0, 0, w, H);
  s.globalCompositeOperation = "source-over";
  ctx.drawImage(c, x0, 0);
}

function ovalPhoto(ctx: CanvasRenderingContext2D, photo: PhotoSource, x: number, y: number, w: number, h: number, rc: RenderContext) {
  const cx = x + w / 2;
  const cy = y + h / 2 - 20;
  const rx = w / 2 - 20;
  const ry = h / 2 - 50;
  ctx.save();
  ctx.shadowColor = "rgba(30,80,70,0.25)";
  ctx.shadowBlur = 40;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + 12, ry + 12, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  ctx.clip();
  drawImageCover(ctx, photo, cx - rx, cy - ry, rx * 2, ry * 2, 1.06 + 0.04 * Math.sin((TAU * rc.t) / D), rc.data.photoFocusY);
  ctx.restore();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + 26, ry + 26, 0, 0, TAU);
  ctx.stroke();
  drawSprite(ctx, lotus(), cx, cy + ry - 10, 0.6);
}

const style = (rc: RenderContext): SceneStyle => ({
  scriptFont: rc.fonts.script,
  bodyFont: rc.fonts.serif,
  bodyItalic: true,
  labelFont: rc.fonts.sans,
  numberFont: rc.fonts.serif,
  heading: TEAL,
  names: TEAL,
  body: INK,
  label: GOLD,
  line: "rgba(176,138,62,0.6)",
  ornament: (ctx, cx, cy) => drawSprite(ctx, lotus(), cx, cy - 10, 0.32),
  photoFrame: ovalPhoto,
});

function intro(rc: RenderContext, lt: number) {
  const { ctx, W, data, photo, fonts } = rc;
  const info = dateInfo(data);
  const [a, b] = fullNamePair(data);
  const cx = photo ? 520 : W / 2;
  const maxW = photo ? 820 : 1400;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (photo) drawEntering(ctx, enter(lt, 0, 1.6), 0, () => fadedPhoto(rc, photo));
  else drawEntering(ctx, enter(lt, 0.2, 1.4), 30, () => drawSprite(ctx, lotus(), cx, 190, 0.5));

  drawGreeting(rc, lt, 0.4, cx, photo ? 260 : 330, GOLD);
  drawEntering(ctx, enter(lt, 0.7, 1.3), 30, () => {
    const title = eventTitle(data);
    fitFont(ctx, title, (s) => `400 ${s}px ${fonts.script}`, maxW, 180);
    ctx.fillStyle = TEAL;
    ctx.fillText(title, cx, photo ? 420 : 480);
  });
  drawEntering(ctx, enter(lt, 1.1), 0, () => drawDivider(ctx, cx, photo ? 540 : 600, 220, "rgba(176,138,62,0.7)"));
  drawEntering(ctx, enter(lt, 1.4), 20, () => {
    const s = `${a}  &  ${b}`;
    fitFont(ctx, s, (z) => `italic 500 ${z}px ${fonts.serif}`, maxW, 58);
    ctx.fillStyle = INK;
    ctx.fillText(s, cx, photo ? 630 : 690);
  });
  if (info.valid) {
    drawEntering(ctx, enter(lt, 1.7), 20, () => {
      ctx.font = `500 32px ${fonts.sans}`;
      setSpacing(ctx, 8);
      ctx.fillStyle = GOLD;
      ctx.fillText(`${info.weekday.toUpperCase()}  ·  ${info.solar}`, cx, photo ? 710 : 770);
    });
  }
}

export const senNgoc: VideoTemplate = {
  id: "sen-ngoc",
  name: "Sen Ngọc",
  description: "Xanh ngọc thanh mát, hoa sen nở trên mặt nước gợn sóng",
  tier: "free",
  duration: D,
  swatch: ["#d6ebe2", "#1f5f5b", "#ea8ea4"],
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
