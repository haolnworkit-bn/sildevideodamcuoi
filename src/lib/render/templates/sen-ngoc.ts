import { TAU, drawPhoto, makeLoopParticles, particleAt, particlesFor, radialGlow } from "../helpers";
import type { VideoTemplate } from "../types";

/**
 * Sen Ngọc — bản màu nước (2026-11-25): sen trắng, lá xanh xám trên giấy kem, khung mảnh.
 * Mọi hình minh hoạ là ảnh ChatGPT khai báo trong template-assets.ts (nền ngang + 4 cụm trang trí).
 * Code chỉ còn: màu, nền dự phòng/khổ dọc (giấy + khung hình học), hạt bụi sáng, khung ảnh, đường kẻ trang trí.
 */
const LEAF = "#4f6b45"; // xanh lá đậm — tiêu đề, tên
const INK = "#545646"; // mực xám ô-liu — chữ thường
const GOLD = "#a68a4a"; // vàng nhị sen — điểm nhấn
const LINE = "rgba(96,122,82,0.55)";

const motes = makeLoopParticles(22, 53, { minSize: 2, maxSize: 5, maxLoops: 1 });

/** Khung 2 nét mảnh kiểu nền ngang (dùng cho khổ dọc / khi ảnh nền chưa tải) */
function thinFrame(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const m = Math.min(W, H) * 0.035;
  ctx.save();
  ctx.strokeStyle = "rgba(96,122,82,0.75)";
  ctx.lineWidth = 2;
  ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
  ctx.strokeStyle = "rgba(96,122,82,0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(m + 8, m + 8, W - 2 * m - 16, H - 2 * m - 16);
  ctx.restore();
}

export const senNgoc: VideoTemplate = {
  id: "sen-ngoc",
  name: "Sen Ngọc",
  description: "Sen trắng, lá xanh màu nước trên giấy kem, khung mảnh thanh lịch",
  tier: "free",
  swatch: ["#f4f0e4", LEAF, "#e9e2c9"],
  colors: ["xanh-la", "trang"],
  theme: { heading: LEAF, names: LEAF, body: INK, accent: GOLD, line: LINE },
  bodyFont: "serif",
  capsFont: "display",
  intro: { title: "script", namesLine: "italic", photoMode: "frame" },

  /** Giấy kem + mảng màu nước xanh nhạt ở góc (gradient) + khung mảnh. Khổ ngang bị ảnh nền phủ kín. */
  background(rc) {
    const { ctx, W, H } = rc;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#f6f3ea");
    g.addColorStop(0.5, "#f3efe3");
    g.addColorStop(1, "#eee9da");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    radialGlow(ctx, W * 0.92, H * 0.08, Math.max(W, H) * 0.35, "rgba(170,190,150,0.28)");
    radialGlow(ctx, W * 0.08, H * 0.9, Math.max(W, H) * 0.35, "rgba(170,190,150,0.3)");
    if (rc.portrait) thinFrame(ctx, W, H);
  },

  /** Bụi sáng li ti bay lên chậm (vàng nhị sen) */
  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    ctx.fillStyle = "#d9c27e";
    for (const p of particlesFor(rc, motes)) {
      const q = particleAt(p, u, W, H, 20, -1);
      ctx.save();
      ctx.globalAlpha *= 0.25 + 0.35 * Math.abs(q.flip);
      ctx.beginPath();
      ctx.arc(q.x, q.y, p.size, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  },

  /** Đường kẻ mảnh hai bên + 3 chấm nhị sen */
  ornament(rc, cx, cy) {
    const { ctx } = rc;
    ctx.save();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5;
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + d * 30, cy);
      ctx.lineTo(cx + d * 140, cy);
      ctx.stroke();
    }
    ctx.fillStyle = GOLD;
    for (const [dx, r] of [
      [-16, 3],
      [0, 5],
      [16, 3],
    ]) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  },

  /** Khung passe-partout giấy trắng ngà + viền lá mảnh */
  photoFrame(ctx, photo, x, y, w, h, rc) {
    ctx.save();
    ctx.shadowColor = "rgba(60,72,50,0.28)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "#fbf9f2";
    ctx.fillRect(x - 24, y - 24, w + 48, h + 48);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    drawPhoto(ctx, photo, x, y, w, h, rc);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 11, y - 11, w + 22, h + 22);
    ctx.restore();
  },
};
