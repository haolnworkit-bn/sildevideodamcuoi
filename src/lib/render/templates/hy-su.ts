import { TAU, drawPhoto, goldPaint, makeLoopParticles, particleAt, particlesFor } from "../helpers";
import type { Photo, RenderContext, VideoTemplate } from "../types";

const GOLD_LINE = "rgba(232,190,100,0.75)";
const sparkles = makeLoopParticles(56, 23, { minSize: 4, maxSize: 14, maxLoops: 1 });

export function star(ctx: CanvasRenderingContext2D, r: number) {
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

/** Huy chương tròn: ảnh cặp đôi hoặc chữ Song Hỷ */
function medallion(rc: RenderContext, cx: number, cy: number, r: number, photo: Photo | null) {
  const { ctx, t, D } = rc;
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
    drawPhoto(ctx, photo, cx - r, cy - r, r * 2, r * 2, rc);
    ctx.restore();
  } else {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${r * 1.15}px "Noto Serif SC","Noto Serif CJK SC","SimSun","Songti SC","PMingLiU",serif`;
    ctx.fillStyle = goldPaint(ctx, cy, r * 1.2);
    ctx.fillText("囍", cx, cy + r * 0.04);
  }

  ctx.lineWidth = 10;
  ctx.strokeStyle = goldPaint(ctx, cy, r * 2);
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
    const a = (i * TAU) / 36 + (TAU * t) / D;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * (r + 26), cy + Math.sin(a) * (r + 26), i % 3 === 0 ? 6 : 3.5, 0, TAU);
    ctx.fill();
  }
}

export const hySu: VideoTemplate = {
  id: "hy-su-do-vang",
  name: "Hỷ Sự Đỏ Vàng",
  description: "Đỏ son truyền thống, viền vàng và chữ Song Hỷ",
  tier: "free",
  swatch: ["#8a0b17", "#e8bd5a", "#f8e7c0"],
  colors: ["do", "vang"],
  theme: { heading: goldPaint, names: goldPaint, body: "#f8e7c0", accent: "#f1cf78", line: GOLD_LINE },
  bodyFont: "display",
  intro: { title: "script", namesLine: "italic", photoMode: "emblem", emblem: medallion },

  background(rc) {
    const { ctx, W, H } = rc;
    const g = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, Math.max(W, H) * 0.6);
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
  },

  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    ctx.fillStyle = "#ffe39a";
    for (const p of particlesFor(rc, sparkles)) {
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
  },

  ornament(rc, cx, cy) {
    const { ctx } = rc;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = goldPaint(ctx, 0, 60);
    star(ctx, 30);
    ctx.fill();
    ctx.restore();
  },

  photoFrame(_ctx, photo, x, y, w, h, rc) {
    medallion(rc, x + w / 2, y + h / 2, Math.min(w, h) / 2 - 40, photo);
  },
};
