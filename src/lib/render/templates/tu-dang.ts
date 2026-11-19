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

const PLUM = "#5b3a7a";
const INK = "#4a3a58";
const LILAC = "#9473b3";

const petals = makeLoopParticles(30, 61, { minSize: 8, maxSize: 16, drift: 120 });

/** Chùm hoa tử đằng rủ xuống (sprite: gốc ở trên) */
function raceme(variant: number, L: number) {
  return sprite(`wis-${variant}-${L}`, 170, L + 50, (ctx) => {
    const r = mulberry32(100 + variant * 17 + L);
    const top = ["#6b3f99", "#7d55b0", "#5f3a8c"][variant % 3];
    const tip = ["#e2d2f3", "#d9c6f0", "#efe4fa"][variant % 3];
    ctx.translate(85, 18);
    ctx.strokeStyle = "#7a8f5a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, L * 0.92);
    ctx.stroke();
    const N = Math.floor(L / 8);
    for (let i = 0; i < N; i++) {
      const tt = i / N;
      const y = tt * L;
      const spread = (1 - tt * 0.85) * 52;
      for (let k = 0; k < 3; k++) {
        const x = (r() * 2 - 1) * spread;
        const s = 9 * (1 - tt * 0.5) + r() * 4;
        ctx.fillStyle = mixColor(top, tip, tt + r() * 0.18);
        ctx.beginPath();
        ctx.ellipse(x, y + r() * 6, s, s * 0.72, r() * Math.PI, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.ellipse(x - s * 0.25, y - s * 0.15, s * 0.35, s * 0.22, 0, 0, TAU);
        ctx.fill();
      }
    }
  });
}

const HANGS: Array<[number, number, number]> = [
  [0.03, 330, 0],
  [0.1, 260, 1],
  [0.17, 300, 2],
  [0.25, 190, 0],
  [0.33, 110, 1],
  [0.67, 110, 2],
  [0.75, 190, 1],
  [0.83, 300, 0],
  [0.9, 260, 2],
  [0.97, 330, 1],
];

export const tuDang: VideoTemplate = {
  id: "tu-dang",
  name: "Tử Đằng",
  description: "Tím lãng mạn, chùm hoa tử đằng rủ đung đưa",
  tier: "free",
  swatch: ["#efe6f6", "#5b3a7a", "#b799d6"],
  colors: ["tim"],
  theme: { heading: PLUM, names: PLUM, body: INK, accent: LILAC, line: "rgba(148,115,179,0.55)" },
  bodyFont: "serif",
  intro: { title: "script", namesLine: "italic", photoMode: "frame" },

  background(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#f8f3fb");
    g.addColorStop(1, "#e4d6ef");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    radialGlow(ctx, W / 2, H * 0.5, Math.max(W, H) * 0.42, "rgba(255,255,255,0.7)");

    // dây leo ngang trên cùng
    ctx.strokeStyle = "#6d5a4a";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-20, 26);
    for (let x = 0; x <= W + 120; x += 160) ctx.quadraticCurveTo(x + 40, 60, x + 80, 28 + 10 * Math.sin(x));
    ctx.stroke();
    ctx.fillStyle = "#7f9a5e";
    for (let x = 40; x < W; x += 95) {
      ctx.save();
      ctx.translate(x, 40);
      ctx.rotate(0.6 + Math.sin(x) * 0.5 + Math.sin(TAU * u + x) * 0.05);
      ctx.beginPath();
      ctx.ellipse(18, 0, 20, 7, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    HANGS.forEach(([fx, L, v], i) => {
      const img = raceme(v, L);
      ctx.save();
      ctx.translate(fx * W, 30);
      ctx.rotate(Math.sin(TAU * u + i * 1.3) * 0.045);
      ctx.drawImage(img, -img.width / 2, -18);
      ctx.restore();
    });
  },

  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    for (const p of particlesFor(rc, petals)) {
      const q = particleAt(p, u, W, H, 30, 1);
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(q.rot);
      ctx.scale(0.4 + 0.6 * Math.abs(q.flip), 1);
      ctx.fillStyle = mixColor("#8a62b8", "#e5d6f5", p.pick);
      ctx.globalAlpha *= 0.85;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.7, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  },

  ornament(rc, cx, cy) {
    const { ctx } = rc;
    ctx.save();
    ctx.translate(cx, cy);
    for (const [r, s] of [
      [-1.75, 0.4],
      [1.75, 0.4],
    ]) {
      ctx.save();
      ctx.rotate(r);
      ctx.scale(s, s);
      const img = raceme(1, 150);
      ctx.drawImage(img, -img.width / 2, 0);
      ctx.restore();
    }
    ctx.restore();
  },

  photoFrame(ctx, photo, x, y, w, h, rc) {
    ctx.save();
    ctx.shadowColor = "rgba(90,60,120,0.25)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.roundRect(x - 12, y - 12, w + 24, h + 24, [w / 2 + 12, w / 2 + 12, 24, 24]);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, [w / 2, w / 2, 16, 16]);
    ctx.clip();
    drawPhoto(ctx, photo, x, y, w, h, rc);
    ctx.restore();
    ctx.strokeStyle = "rgba(148,115,179,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 30, y - 30, w + 60, h + 60, [w / 2 + 30, w / 2 + 30, 34, 34]);
    ctx.stroke();
    const sw = Math.sin((TAU * rc.t) / rc.D) * 0.05;
    for (const [dx, L, v] of [
      [0.22, 220, 0],
      [0.4, 150, 2],
    ]) {
      ctx.save();
      ctx.translate(x + w * dx, y + 20);
      ctx.rotate(sw);
      drawSprite(ctx, raceme(v, L), 0, (L + 50) / 2 - 18, 0.8);
      ctx.restore();
    }
  },
};
