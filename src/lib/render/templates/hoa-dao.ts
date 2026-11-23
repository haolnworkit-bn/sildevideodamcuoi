import { TAU, archPath, drawPhoto, radialGlow } from "../helpers";
import type { RenderContext, VideoTemplate } from "../types";

const ROSE = "#b0385a";
const INK = "#6b2d3c";
const SOFT = "#c46a82";


function petalPath(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.5);
  ctx.bezierCurveTo(-s * 0.62, s * 0.12, -s * 0.48, -s * 0.56, -s * 0.1, -s * 0.5);
  ctx.lineTo(0, -s * 0.36);
  ctx.lineTo(s * 0.1, -s * 0.5);
  ctx.bezierCurveTo(s * 0.48, -s * 0.56, s * 0.62, s * 0.12, 0, s * 0.5);
  ctx.closePath();
}

export function drawBlossom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i * TAU) / 5);
    ctx.translate(0, -r * 0.5);
    const g = ctx.createLinearGradient(0, r * 0.5, 0, -r * 0.5);
    g.addColorStop(0, "#e46a86");
    g.addColorStop(1, "#fbd3dc");
    ctx.fillStyle = g;
    petalPath(ctx, r);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "#c9415f";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "#a8324c";
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.fillStyle = "#f4c95d";
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8;
    const ex = Math.cos(a) * r * 0.38;
    const ey = Math.sin(a) * r * 0.38;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.06, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function bez(t: number, p0: number, p1: number, p2: number, p3: number) {
  const m = 1 - t;
  return m * m * m * p0 + 3 * m * m * t * p1 + 3 * m * t * t * p2 + t * t * t * p3;
}

/** Cành đào ở góc, đung đưa nhẹ */
function drawBranch(ctx: CanvasRenderingContext2D, sway: number) {
  ctx.save();
  ctx.rotate(sway);
  ctx.strokeStyle = "#6d4636";
  ctx.lineCap = "round";
  const P = [-80, 40, 160, 30, 330, 170, 680, 250];
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(P[0], P[1]);
  ctx.bezierCurveTo(P[2], P[3], P[4], P[5], P[6], P[7]);
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(210, 72);
  ctx.quadraticCurveTo(290, 10, 390, -6);
  ctx.moveTo(430, 205);
  ctx.quadraticCurveTo(480, 290, 520, 360);
  ctx.moveTo(110, 48);
  ctx.quadraticCurveTo(160, 130, 230, 170);
  ctx.stroke();

  [0.3, 0.48, 0.64, 0.8, 0.97].forEach((tt, i) => {
    const x = bez(tt, P[0], P[2], P[4], P[6]);
    const y = bez(tt, P[1], P[3], P[5], P[7]);
    drawBlossom(ctx, x, y + (i % 2 ? 14 : -16), 40 - i * 3, i * 0.7);
  });
  drawBlossom(ctx, 392, -4, 32, 0.4);
  drawBlossom(ctx, 522, 362, 30, 1.1);
  drawBlossom(ctx, 232, 172, 28, 2.1);
  ctx.fillStyle = "#e7718c";
  for (const [x, y, r] of [
    [300, 30, 9],
    [470, 270, 8],
    [180, 120, 8],
    [600, 222, 9],
  ]) {
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 1.3, 0.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export const hoaDao: VideoTemplate = {
  id: "hoa-dao-xuan",
  name: "Hoa Đào Xuân",
  description: "Hồng phấn dịu dàng, cành đào và cánh hoa rơi",
  tier: "free",
  swatch: ["#fbd3dc", "#b0385a", "#6d4636"],
  colors: ["hong"],
  theme: { heading: ROSE, names: ROSE, body: INK, accent: SOFT, line: "rgba(196,106,130,0.6)" },
  bodyFont: "serif",
  intro: { title: "script", namesLine: "italic", photoMode: "frame" },

  background(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#fff8f5");
    g.addColorStop(1, "#f8d3dc");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    radialGlow(ctx, W * 0.5, H * 0.45, 760, "rgba(255,255,255,0.75)");
    radialGlow(ctx, W * 0.9, H * 0.9, 600, "rgba(240,150,175,0.25)");
    ctx.save();
    ctx.translate(-20, -20);
    drawBranch(ctx, Math.sin(TAU * u) * 0.018);
    ctx.restore();
    ctx.save();
    ctx.translate(W + 20, H + 20);
    ctx.rotate(Math.PI);
    ctx.scale(0.8, 0.8);
    drawBranch(ctx, Math.sin(TAU * u + 1.4) * 0.02);
    ctx.restore();
  },

  /** Nền ngang màu nước có cành đào vươn tới gần giữa khung → quầng giấy ngà mờ sau khối chữ (khổ dọc vẫn nền code) */
  backdrop(rc) {
    if (rc.portrait) return;
    const { ctx, W, H } = rc;
    ctx.save();
    ctx.translate(W * 0.54, H * 0.42);
    ctx.scale(1, 0.6);
    // cùng tông giấy của nền (≈ 244,224,197) để không thành vệt nhạt; chỉ sáng hơn chút cho chữ nổi
    radialGlow(ctx, 0, 0, W * 0.4, "rgba(248,233,210,0.55)");
    ctx.restore();
  },

  // Cánh đào/bông đào rơi là ảnh (template-assets `falling`), không vẽ hạt bằng code nữa.

  ornament(rc, cx, cy) {
    drawBlossom(rc.ctx, cx, cy, 44, 0.3);
    drawBlossom(rc.ctx, cx - 80, cy + 16, 24, 1.2);
    drawBlossom(rc.ctx, cx + 80, cy + 16, 24, 2.2);
  },

  photoFrame(ctx, photo, x, y, w, h, rc) {
    ctx.save();
    ctx.shadowColor = "rgba(150,60,85,0.25)";
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 18;
    ctx.fillStyle = "#fff";
    archPath(ctx, x - 16, y - 16, w + 32, h + 32);
    ctx.fill();
    ctx.restore();
    ctx.save();
    archPath(ctx, x, y, w, h);
    ctx.clip();
    drawPhoto(ctx, photo, x, y, w, h, rc);
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    archPath(ctx, x + 18, y + 18, w - 36, h - 36);
    ctx.stroke();
    drawBlossom(ctx, x + 40, y + h - 20, 46, 0.4);
    drawBlossom(ctx, x + 110, y + h + 10, 28, 1.7);
  },
};
