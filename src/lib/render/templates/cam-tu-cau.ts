import {
  TAU,
  drawPhoto,
  drawSprite,
  makeLoopParticles,
  mixColor,
  mulberry32,
  particleAt,
  particlesFor,
  radialGlow,
  sprite,
} from "../helpers";
import type { VideoTemplate } from "../types";

const NAVY = "#2c4a73";
const INK = "#33465e";
const SKY = "#6f8fbf";

const florets = makeLoopParticles(22, 71, { minSize: 10, maxSize: 18, drift: 90 });

function floret(ctx: CanvasRenderingContext2D, s: number, color: string) {
  ctx.fillStyle = color;
  for (let k = 0; k < 4; k++) {
    ctx.save();
    ctx.rotate((k * TAU) / 4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-s * 0.55, -s * 0.5, 0, -s);
    ctx.quadraticCurveTo(s * 0.55, -s * 0.5, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.14, 0, TAU);
  ctx.fill();
}

/** Cụm cẩm tú cầu: quả cầu nhiều hoa nhỏ 4 cánh */
function hydrangea(variant: "blue" | "lilac") {
  return sprite(`hyd-${variant}`, 440, 440, (ctx) => {
    const r = mulberry32(variant === "blue" ? 7 : 13);
    const cols = variant === "blue" ? ["#5f82c4", "#8fb0e6", "#b9cdf1", "#e6eefb"] : ["#7f74c2", "#a99ae0", "#cbbcee", "#efe8fb"];
    ctx.translate(220, 220);
    const pts = Array.from({ length: 170 }, () => {
      const a = r() * TAU;
      const d = Math.sqrt(r()) * 175;
      return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.92, z: r() };
    }).sort((a, b) => a.z - b.z);
    for (const p of pts) {
      // sáng phía trên-trái, tối phía dưới-phải
      const light = 0.5 + 0.5 * (p.z - (p.x + p.y) / 500);
      const c = light < 0.33 ? mixColor(cols[0], cols[1], light * 3) : light < 0.66 ? mixColor(cols[1], cols[2], (light - 0.33) * 3) : mixColor(cols[2], cols[3], (light - 0.66) * 3);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(r() * TAU);
      floret(ctx, 20 + p.z * 10, c);
      ctx.restore();
    }
  });
}

function bigLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, "#3f6b4c");
  g.addColorStop(1, "#6f9a72");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.3, -len * 0.42, len * 0.8, -len * 0.3, len, 0);
  ctx.bezierCurveTo(len * 0.8, len * 0.3, len * 0.3, len * 0.42, 0, 0);
  ctx.fill();
  ctx.strokeStyle = "rgba(230,245,225,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(len * 0.95, 0);
  for (let i = 1; i < 5; i++) {
    const xx = (len * i) / 5;
    ctx.moveTo(xx, 0);
    ctx.lineTo(xx + len * 0.12, -len * 0.16);
    ctx.moveTo(xx, 0);
    ctx.lineTo(xx + len * 0.12, len * 0.16);
  }
  ctx.stroke();
  ctx.restore();
}

/** Cụm hoa + lá ở góc (0,0) toả vào trong */
function cornerCluster(ctx: CanvasRenderingContext2D, sway: number) {
  ctx.save();
  ctx.rotate(sway);
  bigLeaf(ctx, 60, 200, 260, 0.75);
  bigLeaf(ctx, 200, 50, 240, 0.15);
  bigLeaf(ctx, 300, 230, 200, 0.55);
  drawSprite(ctx, hydrangea("lilac"), 330, 110, 0.55, sway * 3);
  drawSprite(ctx, hydrangea("blue"), 150, 150, 0.85, -sway * 2);
  ctx.restore();
}

export const camTuCau: VideoTemplate = {
  id: "cam-tu-cau",
  name: "Cẩm Tú Cầu",
  description: "Xanh dương pastel, cụm cẩm tú cầu và hoa nhỏ bay",
  tier: "free",
  swatch: ["#e3edf8", "#2c4a73", "#8fb0e6"],
  colors: ["xanh-duong", "tim"],
  theme: { heading: NAVY, names: NAVY, body: INK, accent: SKY, line: "rgba(111,143,191,0.55)" },
  bodyFont: "serif",
  intro: { title: "script", namesLine: "italic", photoMode: "frame" },

  background(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#f3f7fc");
    g.addColorStop(1, "#d7e4f3");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    radialGlow(ctx, W / 2, H / 2, Math.max(W, H) * 0.4, "rgba(255,255,255,0.75)");
    ctx.strokeStyle = "rgba(111,143,191,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(48, 48, W - 96, H - 96, 20);
    ctx.stroke();

    ctx.save();
    ctx.translate(-30, H + 30);
    ctx.scale(1, -1);
    cornerCluster(ctx, Math.sin(TAU * u) * 0.015);
    ctx.restore();
    ctx.save();
    ctx.translate(W + 30, -30);
    ctx.scale(-0.75, 0.75);
    cornerCluster(ctx, Math.sin(TAU * u + 2) * 0.015);
    ctx.restore();
  },

  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    for (const p of particlesFor(rc, florets)) {
      const q = particleAt(p, u, W, H, 30, 1);
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(q.rot);
      ctx.scale(0.5 + 0.5 * Math.abs(q.flip), 1);
      ctx.globalAlpha *= 0.85;
      floret(ctx, p.size, mixColor("#7f9fd6", "#d6c8f0", p.pick));
      ctx.restore();
    }
  },

  ornament(rc, cx, cy) {
    drawSprite(rc.ctx, hydrangea("blue"), cx, cy, 0.22);
  },

  photoFrame(ctx, photo, x, y, w, h, rc) {
    ctx.save();
    ctx.shadowColor = "rgba(40,70,110,0.25)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.roundRect(x - 14, y - 14, w + 28, h + 28, 30);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 20);
    ctx.clip();
    drawPhoto(ctx, photo, x, y, w, h, rc);
    ctx.restore();
    const sw = Math.sin((TAU * rc.t) / rc.D) * 0.04;
    bigLeaf(ctx, x + w - 10, y + h - 40, 150, -0.4 + sw);
    drawSprite(ctx, hydrangea("blue"), x + w - 20, y + h - 20, 0.4, sw);
  },
};
