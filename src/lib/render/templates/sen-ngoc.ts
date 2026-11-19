import { TAU, drawPhoto, drawSprite, makeLoopParticles, particleAt, particlesFor, sprite } from "../helpers";
import type { Photo, RenderContext, VideoTemplate } from "../types";

const TEAL = "#1f5f5b";
const INK = "#24423f";
const GOLD = "#b08a3e";

const motes = makeLoopParticles(24, 41, { minSize: 3, maxSize: 7, maxLoops: 1 });

// ---------- Hoạ tiết: hoa sen, lá sen ----------

export function lotus() {
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

function emblem(rc: RenderContext, cx: number, cy: number, r: number, _photo: Photo | null) {
  drawSprite(rc.ctx, lotus(), cx, cy + r * 0.15, (r * 2.2) / 400);
}

export const senNgoc: VideoTemplate = {
  id: "sen-ngoc",
  name: "Sen Ngọc",
  description: "Xanh ngọc thanh mát, hoa sen nở trên mặt nước gợn sóng",
  tier: "free",
  swatch: ["#d6ebe2", "#1f5f5b", "#ea8ea4"],
  colors: ["xanh-la", "hong"],
  theme: { heading: TEAL, names: TEAL, body: INK, accent: GOLD, line: "rgba(176,138,62,0.6)" },
  bodyFont: "serif",
  intro: { title: "script", namesLine: "italic", photoMode: "faded", emblem },

  background(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    const waterY = H * 0.74;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#f3f8f4");
    g.addColorStop(0.7, "#d6ebe2");
    g.addColorStop(1, "#b9dccf");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const wg = ctx.createLinearGradient(0, waterY - 40, 0, H);
    wg.addColorStop(0, "rgba(120,180,165,0)");
    wg.addColorStop(1, "rgba(80,150,135,0.35)");
    ctx.fillStyle = wg;
    ctx.fillRect(0, waterY - 40, W, H - waterY + 40);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const y = waterY + i * 42;
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

    // gợn sóng lan toả (số vòng nguyên / chu kỳ)
    const sources: Array<[number, number, number, number]> = [
      [0.17, 0.86, 2, 0],
      [0.82, 0.89, 3, 0.4],
      [0.5, 0.94, 2, 0.7],
    ];
    for (const [fx, fy, k, off] of sources) {
      for (let j = 0; j < 2; j++) {
        const f = (u * k + off + j * 0.5) % 1;
        ctx.strokeStyle = `rgba(255,255,255,${(1 - f) * 0.5})`;
        ctx.beginPath();
        ctx.ellipse(fx * W, fy * H, 40 + f * 260, (40 + f * 260) * 0.22, 0, 0, TAU);
        ctx.stroke();
      }
    }

    const bob = (ph: number) => Math.sin(TAU * u + ph) * 6;
    const by = H - 120;
    drawSprite(ctx, lotusPad("a", 230), 260, by + bob(0), 1);
    drawSprite(ctx, lotusPad("b", 160), 520, by + 70 + bob(1), 1);
    drawSprite(ctx, lotusPad("a", 230), W - 200, by + 60 + bob(2), 0.9);
    drawSprite(ctx, lotusPad("b", 160), W - 490, by + 90 + bob(3), 0.9);
    drawSprite(ctx, lotus(), 250, by - 120 + bob(0), 0.8, Math.sin(TAU * u) * 0.03);
    drawSprite(ctx, lotus(), W - 150, by - 15 + bob(2), 0.6, Math.sin(TAU * u + 2) * 0.03);
    // nụ sen sát mép trái, không chạm vùng chữ
    ctx.save();
    ctx.translate(105, by + 30 + bob(1));
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
  },

  foreground(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    ctx.fillStyle = "#e8cf86";
    for (const p of particlesFor(rc, motes)) {
      const q = particleAt(p, u, W, H * 0.85, 20, -1);
      ctx.save();
      ctx.globalAlpha *= 0.35 + 0.35 * q.flip;
      ctx.beginPath();
      ctx.arc(q.x, q.y, p.size, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  },

  ornament(rc, cx, cy) {
    drawSprite(rc.ctx, lotus(), cx, cy - 10, 0.32);
  },

  photoFrame(ctx, photo, x, y, w, h, rc) {
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
    drawPhoto(ctx, photo, cx - rx, cy - ry, rx * 2, ry * 2, rc);
    ctx.restore();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + 26, ry + 26, 0, 0, TAU);
    ctx.stroke();
    drawSprite(ctx, lotus(), cx, cy + ry - 10, 0.6);
  },
};
