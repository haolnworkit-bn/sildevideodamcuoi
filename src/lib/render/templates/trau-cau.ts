import { TAU, drawPhoto, drawSprite, goldPaint, makeLoopParticles, particleAt, particlesFor, sprite } from "../helpers";
import type { RenderContext, VideoTemplate } from "../types";

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
    drawSprite(ctx, leaf, -Math.sin(th) * d * 0.75, Math.cos(th) * d * 0.75, sc, th + Math.sin(sway * 40 + i) * 0.04);
  });
  const th = -0.7;
  drawSprite(ctx, arecaCluster(), -Math.sin(th) * 270, Math.cos(th) * 270, 0.85, th);
  ctx.restore();
}

/** Dải lụa đỏ có đuôi gấp, "mở" theo chiều ngang khi xuất hiện */
function ribbon(rc: RenderContext, cx: number, cy: number, w: number, h: number, p: number) {
  const { ctx } = rc;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.6 + 0.4 * p, 1);
  ctx.translate(-cx, -cy);
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
  ctx.restore();
}

export const trauCau: VideoTemplate = {
  id: "trau-cau",
  name: "Trầu Cau",
  description: "Xanh lục truyền thống, lá trầu, chùm cau và dải lụa đỏ",
  tier: "free",
  swatch: ["#0f3d2e", "#c7262f", "#e9cf8a"],
  colors: ["xanh-la", "do"],
  theme: { heading: goldPaint, names: goldPaint, body: "#f3ead2", accent: "#e9cf8a", line: GOLD_LINE },
  bodyFont: "serif",
  intro: { title: "script", namesLine: "italic", photoMode: "frame", titleBacking: ribbon },

  background(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, Math.max(W, H) * 0.6);
    g.addColorStop(0, "#1f5e43");
    g.addColorStop(1, "#0a2a1d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(233,207,138,0.05)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const R = Math.max(W, H);
    for (let x = -R; x < W + R; x += 90) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + R, R);
      ctx.moveTo(x, R);
      ctx.lineTo(x + R, 0);
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
  },

  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    ctx.fillStyle = "#f3d98c";
    for (const p of particlesFor(rc, dust)) {
      const q = particleAt(p, u, W, H, 20, -1);
      ctx.save();
      ctx.globalAlpha *= 0.3 + 0.5 * (0.5 + 0.5 * q.flip);
      ctx.beginPath();
      ctx.arc(q.x, q.y, p.size, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  },

  ornament(rc, cx, cy) {
    drawSprite(rc.ctx, arecaCluster(), cx, cy, 0.45);
  },

  photoFrame(ctx, photo, x, y, w, h, rc) {
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
    drawPhoto(ctx, photo, x + 10, y + 10, w - 20, h - 20, rc);
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
  },
};
