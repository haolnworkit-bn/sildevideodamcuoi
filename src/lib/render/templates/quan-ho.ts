import { TAU, drawPhoto, makeLoopParticles, particleAt, particlesFor, radialGlow } from "../helpers";
import type { VideoTemplate } from "../types";

/**
 * Quan Họ Kinh Bắc — bản màu nước (2026-11-20). Mọi hình minh hoạ (ao sen, đình, cánh sen rơi)
 * là ảnh khai báo trong template-assets.ts; code chỉ còn màu, nền dự phòng, quầng giấy, hạt lá mảnh.
 * Bảng màu: hồng sen, mực ô-liu, xanh lá sen.
 */
const SEN = "#a8344e";
const MUC = "#4b4636";
const LA = "#5f7d4f";

const leaves = makeLoopParticles(30, 88, { minSize: 14, maxSize: 26, drift: 120 });

export const quanHo: VideoTemplate = {
  id: "quan-ho-kinh-bac",
  name: "Quan Họ Kinh Bắc",
  description: "Màu nước ao sen làng Kinh Bắc: hồng sen, xanh lá sen trên giấy kem, cánh sen rơi",
  tier: "free",
  swatch: ["#f7efd9", SEN, LA],
  colors: ["hong", "xanh-la", "trang"],
  theme: { heading: SEN, names: SEN, body: MUC, accent: LA, line: "rgba(95,125,79,0.5)" },
  bodyFont: "serif",
  capsFont: "display",
  intro: { title: "script", namesLine: "italic", photoMode: "frame" },

  /** Nền dự phòng (khi ảnh nền chưa tải / thiếu): giấy kem + quầng hồng sen nhạt. Ảnh nền vẽ đè lên. */
  background(rc) {
    const { ctx, W, H } = rc;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#fbf5e3");
    g.addColorStop(0.5, "#f7efd9");
    g.addColorStop(1, "#efe3c2");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    radialGlow(ctx, W * 0.5, H * 0.82, Math.max(W, H) * 0.45, "rgba(232,170,180,0.25)");
  },

  /** Nền màu nước có cảnh ao/đình ở nửa dưới → phủ quầng giấy kem mờ sau khối chữ cho dễ đọc */
  backdrop(rc) {
    const { ctx, W, H } = rc;
    ctx.save();
    if (rc.portrait) {
      ctx.translate(W * 0.5, H * 0.6);
      ctx.scale(1, 1.15);
      radialGlow(ctx, 0, 0, W * 0.55, "rgba(250,243,226,0.7)");
    } else {
      ctx.translate(W * 0.5, H * 0.58);
      ctx.scale(1, 0.62);
      radialGlow(ctx, 0, 0, W * 0.4, "rgba(250,243,226,0.72)");
    }
    ctx.restore();
  },

  /** Cánh sen rơi là ảnh (template-assets `falling`); code chỉ thêm vài lá tre mảnh màu lá sen */
  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    for (const p of particlesFor(rc, leaves)) {
      if (p.pick > 0.4) continue;
      const q = particleAt(p, u, W, H, 40, 1);
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(q.rot);
      ctx.scale(0.4 + 0.6 * Math.abs(q.flip), 1);
      ctx.globalAlpha *= 0.6;
      ctx.fillStyle = p.pick > 0.2 ? "#9fb27a" : "#c2b56e";
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.55, p.size * 0.12, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  },

  ornament(rc, cx, cy) {
    const { ctx } = rc;
    ctx.save();
    ctx.strokeStyle = "rgba(95,125,79,0.65)";
    ctx.lineWidth = 1.5;
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + d * 18, cy);
      ctx.lineTo(cx + d * 130, cy);
      ctx.stroke();
    }
    ctx.fillStyle = SEN;
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  },

  photoFrame(ctx, photo, x, y, w, h, rc) {
    ctx.save();
    ctx.shadowColor = "rgba(42,35,32,0.35)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = "#fbf6ea";
    ctx.fillRect(x - 26, y - 26, w + 52, h + 52);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    drawPhoto(ctx, photo, x, y, w, h, rc);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "rgba(95,125,79,0.55)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 12, y - 12, w + 24, h + 24);
    ctx.restore();
  },
};
