import { getAsset } from "../assets";
import {
  TAU,
  archPath,
  drawPhoto,
  makeLoopParticles,
  particleAt,
  particlesFor,
  radialGlow,
  scratchCanvas,
} from "../helpers";
import type { VideoTemplate } from "../types";

/**
 * Hồng Phượng — mẫu lễ ăn hỏi.
 * Hình minh hoạ (nền hồng đào, phượng, sen, dải lụa) là ẢNH, khai báo ở src/config/template-assets.ts
 * (thư mục ảnh: public/assets/hong-phuong/). File này chỉ có màu chữ, nền dự phòng (gradient),
 * khung ảnh (hình học) và hạt lấp lánh.
 */
const ROSE = "#a8324c";
const INK = "#6b2d3c";
const SOFT = "#c46a82";
const GOLD = "#e4b25a";

const sparks = makeLoopParticles(26, 71, { minSize: 3, maxSize: 7, maxLoops: 1, drift: 40 });

export const hongPhuong: VideoTemplate = {
  id: "hong-phuong",
  name: "Hồng Phượng Ăn Hỏi",
  description: "Nền hồng đào màu nước, phượng đỏ, sen hồng và dải lụa — dành cho lễ ăn hỏi",
  tier: "free",
  swatch: ["#fbd3d8", "#a8324c", "#8f0f1b"],
  colors: ["hong", "do"],
  theme: { heading: ROSE, names: ROSE, body: INK, accent: SOFT, line: "rgba(196,106,130,0.6)" },
  bodyFont: "serif",
  intro: { title: "script", namesLine: "italic", photoMode: "frame" },

  // Nền dự phòng khi chưa có ảnh nền (gradient + quầng sáng)
  background(rc) {
    const { ctx, W, H } = rc;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#fff3f0");
    g.addColorStop(1, "#f8cfd6");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    radialGlow(ctx, W * 0.5, H * 0.45, Math.max(W, H) * 0.55, "rgba(255,255,255,0.7)");
  },

  // Viền khung 2 nét mảnh cách mép một khoảng (hình học) + chữ 囍 (hỷ) chìm ở GIỮA — là CHỮ (font), không phải hình vẽ.
  // Vẽ dưới lồng đèn/sen nên các vật thể đè lên viền chứ viền không đè lên vật thể.
  backdrop(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;

    // Viền vẽ ra canvas phụ để "nhường chỗ" cho các cụm hoa đã nằm sẵn trong ảnh nền:
    // viền mờ dần đi ở chỗ có hoa, như thể hoa nằm TRÊN viền.
    const g = scratchCanvas("hp-frame", W, H).getContext("2d")!;
    g.clearRect(0, 0, W, H);
    const m = Math.min(W, H) * 0.035; // khoảng cách từ mép khung hình tới viền ngoài
    const rr = (inset: number, r: number) => {
      g.beginPath();
      g.roundRect(m + inset, m + inset, W - 2 * (m + inset), H - 2 * (m + inset), r);
    };
    g.lineJoin = "round";
    g.strokeStyle = "rgba(168,50,76,0.7)";
    g.lineWidth = 3;
    rr(0, 18);
    g.stroke();
    g.strokeStyle = "rgba(214,110,140,0.55)";
    g.lineWidth = 1.5;
    rr(12, 10);
    g.stroke();
    if (!rc.portrait && getAsset("/assets/hong-phuong/backgrounds/landscape.webp")) {
      // vị trí hai cụm hoa đào trong ảnh nền ngang (toạ độ theo tỉ lệ khung): dưới trái và trên phải
      const hide = (cx: number, cy: number, rx: number, ry: number) => {
        g.save();
        g.globalCompositeOperation = "destination-out";
        g.translate(cx * W, cy * H);
        g.scale(rx * W, ry * H);
        const k = g.createRadialGradient(0, 0, 0, 0, 0, 1);
        k.addColorStop(0, "rgba(0,0,0,1)");
        k.addColorStop(0.7, "rgba(0,0,0,1)");
        k.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = k;
        g.beginPath();
        g.arc(0, 0, 1, 0, TAU);
        g.fill();
        g.restore();
      };
      hide(0.05, 0.62, 0.09, 0.27);
      hide(0.13, 0.93, 0.22, 0.11);
      hide(0.88, 0.04, 0.17, 0.09);
      hide(0.975, 0.15, 0.06, 0.2);
    }
    ctx.drawImage(scratchCanvas("hp-frame", W, H), 0, 0, W, H);

    const size = rc.portrait ? W * 0.375 : H * 0.3;
    ctx.translate(W / 2, H / 2);
    const s = 1 + 0.025 * Math.sin(TAU * u * 2);
    ctx.scale(s, s);
    ctx.font = `500 ${size}px "Noto Serif SC","Noto Serif CJK SC","SimSun","Songti SC","PMingLiU",serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(179,38,30,0.11)";
    ctx.fillText("囍", 0, size * 0.04);
  },

  // Hạt lấp lánh nhẹ (chấm tròn đơn giản, không phải hình minh hoạ)
  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    for (const p of particlesFor(rc, sparks)) {
      const q = particleAt(p, u, W, H, 20, -1);
      const a = 0.25 + 0.6 * Math.abs(q.flip);
      ctx.fillStyle = `rgba(228,178,90,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(q.x, q.y, p.size * 0.5, 0, TAU);
      ctx.fill();
    }
  },

  // Phân cách phía trên "Lời cảm ơn": dải lụa hồng (ảnh)
  ornament(rc, cx, cy) {
    const img = getAsset("/assets/hong-phuong/decorations/dai-lua-hong.webp");
    const { ctx } = rc;
    if (img) {
      const w = 300;
      const h = (w * img.height) / img.width;
      ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    } else {
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 90, cy);
      ctx.lineTo(cx + 90, cy);
      ctx.stroke();
    }
  },

  // Khung ảnh vòm trắng, viền mảnh (hình học)
  photoFrame(ctx, photo, x, y, w, h, rc) {
    ctx.save();
    ctx.shadowColor = "rgba(150,60,85,0.28)";
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
    ctx.strokeStyle = "rgba(228,178,90,0.9)";
    ctx.lineWidth = 2.5;
    archPath(ctx, x + 14, y + 14, w - 28, h - 28);
    ctx.stroke();
  },
};
