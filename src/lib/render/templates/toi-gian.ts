import { TAU, drawPhoto, makeLoopParticles, particleAt, particlesFor, radialGlow } from "../helpers";
import type { VideoTemplate } from "../types";

const SILVER = "#dfe6f2";
const MUTED = "#9fb0cc";

const stars = makeLoopParticles(40, 63, { minSize: 2, maxSize: 5, maxLoops: 1, drift: 0 });

function thinFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number) {
  ctx.strokeStyle = `rgba(223,230,242,${alpha})`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}

export const toiGian: VideoTemplate = {
  id: "toi-gian",
  name: "Tối Giản Đêm Xanh",
  description: "Xanh navy, đường nét mảnh, hiện đại và sang trọng",
  tier: "premium",
  swatch: ["#142346", "#dfe6f2", "#6f86b8"],
  colors: ["xanh-duong", "trang"],
  theme: { heading: "#ffffff", names: "#ffffff", body: SILVER, accent: MUTED, line: "rgba(223,230,242,0.45)" },
  bodyFont: "serif",
  capsFont: "serif",
  intro: { title: "caps", namesLine: "script", photoMode: "faded" },

  background(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
    g.addColorStop(0, "#1b2f5c");
    g.addColorStop(1, "#0c1630");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    radialGlow(ctx, W * (0.5 + 0.05 * Math.sin(TAU * u)), H * 0.4, Math.max(W, H) * 0.55, "rgba(111,134,184,0.28)");
    thinFrame(ctx, 56, 56, W - 112, H - 112, 0.5);
    thinFrame(ctx, 72, 72, W - 144, H - 144, 0.2);
    // Ô vuông nhỏ ở bốn góc khung
    ctx.fillStyle = SILVER;
    for (const [x, y] of [
      [56, 56],
      [W - 56, 56],
      [56, H - 56],
      [W - 56, H - 56],
    ]) {
      ctx.fillRect(x - 5, y - 5, 10, 10);
    }
  },

  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    ctx.fillStyle = "#ffffff";
    for (const p of particlesFor(rc, stars)) {
      const q = particleAt(p, u, W, H, 10, -1);
      ctx.save();
      ctx.globalAlpha *= 0.25 + 0.55 * Math.abs(q.flip);
      ctx.beginPath();
      ctx.arc(q.x, q.y, p.size * 0.5, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  },

  ornament(rc, cx, cy) {
    const { ctx } = rc;
    ctx.save();
    ctx.strokeStyle = SILVER;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 120, cy);
    ctx.lineTo(cx - 20, cy);
    ctx.moveTo(cx + 20, cy);
    ctx.lineTo(cx + 120, cy);
    ctx.stroke();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-9, -9, 18, 18);
    ctx.restore();
  },

  photoFrame(ctx, photo, x, y, w, h, rc) {
    thinFrame(ctx, x - 22, y - 22, w + 44, h + 44, 0.55);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = "#0c1630";
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    drawPhoto(ctx, photo, x, y, w, h, rc);
    ctx.restore();
  },
};
