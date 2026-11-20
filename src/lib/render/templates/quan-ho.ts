import { TAU, drawPhoto, drawSprite, makeLoopParticles, mulberry32, particleAt, particlesFor, radialGlow, sprite } from "../helpers";
import type { VideoTemplate } from "../types";

/** Bảng màu tranh Đông Hồ: đỏ son, chàm, vàng nghệ, đen than, giấy điệp */
const SON = "#b3261e";
const CHAM = "#1f3a5f";
const NGHE = "#e0a526";
const THAN = "#2a2320";
const DIEP = "#f7efd9";

/** Bảng màu bản màu nước (nền ảnh khổ ngang, thử 2026-11-20): hồng sen, mực ô-liu, xanh lá sen */
const SEN = "#a8344e";
const MUC = "#4b4636";
const LA = "#5f7d4f";

const leaves = makeLoopParticles(30, 88, { minSize: 14, maxSize: 26, drift: 120 });

/** Giấy điệp: nền kem + lấp lánh vỏ sò li ti, vẽ 1 lần */
function diepPaper(W: number, H: number) {
  return sprite(`kb-diep-${W}x${H}`, W, H, (c) => {
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#fbf5e3");
    g.addColorStop(0.5, DIEP);
    g.addColorStop(1, "#efe3c2");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    const r = mulberry32(2024);
    for (let i = 0; i < 900; i++) {
      const x = r() * W;
      const y = r() * H;
      const s = 1 + r() * 2.6;
      c.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.75)" : "rgba(214,196,150,0.35)";
      c.beginPath();
      c.ellipse(x, y, s * 1.6, s, r() * Math.PI, 0, TAU);
      c.fill();
    }
  });
}

/** Cụm tre: thân đốt + lá, đung đưa nhẹ (chu kỳ nguyên → lặp khớp) */
function bamboo(ctx: CanvasRenderingContext2D, x: number, baseY: number, h: number, lean: number, u: number, k: number) {
  const sway = Math.sin(TAU * u + k) * 0.02;
  ctx.save();
  ctx.translate(x, baseY);
  ctx.rotate(lean + sway);
  ctx.strokeStyle = "rgba(31,58,95,0.55)";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -h);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(247,239,217,0.8)";
  for (let y = 60; y < h; y += 78) {
    ctx.beginPath();
    ctx.moveTo(-8, -y);
    ctx.lineTo(8, -y);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(31,58,95,0.5)";
  // lá tre thưa, rủ nhẹ sang hai bên (không đan chéo)
  // cụm lá chỉ ở ngọn, rủ xuống như lá tre thật
  for (const [fy, k2] of [
    [0.97, 0],
    [0.86, 1],
    [0.75, 2],
  ]) {
    for (let i = 0; i < 4; i++) {
      const side = (i + k2) % 2 ? 1 : -1;
      const ang = 0.75 + i * 0.22 + Math.sin(TAU * u + i + k2) * 0.04;
      ctx.save();
      ctx.translate(0, -h * fy);
      ctx.rotate(side > 0 ? ang : Math.PI - ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(50, -9, 110, 4);
      ctx.quadraticCurveTo(50, 7, 0, 0);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

/** Mặt trời đỏ kiểu tranh Đông Hồ (đĩa đỏ + vòng tia) */
function sun(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, u: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(TAU * u);
  ctx.strokeStyle = "rgba(179,38,30,0.25)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 24; i++) {
    const a = (i * TAU) / 24;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15);
    ctx.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = "rgba(179,38,30,0.16)";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/** Nón quai thao: vành rộng phẳng, chóp nhỏ, hai dải quai thao rủ xuống */
export function nonQuaiThao(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  // quai thao
  ctx.strokeStyle = SON;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(d * 34, 6);
    ctx.bezierCurveTo(d * 46, 38, d * 38, 62, d * 52, 86);
    ctx.stroke();
    ctx.fillStyle = SON;
    ctx.beginPath();
    ctx.ellipse(d * 52, 94, 6, 12, 0, 0, TAU);
    ctx.fill();
  }
  // vành nón
  const g = ctx.createLinearGradient(0, -20, 0, 24);
  g.addColorStop(0, "#3a302b");
  g.addColorStop(1, "#171210");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 120, 26, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "rgba(224,165,38,0.8)";
  ctx.lineWidth = 2;
  for (const k of [0.92, 0.68, 0.44]) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 120 * k, 26 * k, 0, 0, TAU);
    ctx.stroke();
  }
  // chóp
  ctx.fillStyle = "#2a2320";
  ctx.beginPath();
  ctx.ellipse(0, -8, 26, 14, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = NGHE;
  ctx.beginPath();
  ctx.arc(0, -10, 5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Đồng tiền ở góc khung */
function dongTien(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = NGHE;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = DIEP;
  ctx.fillRect(x - r * 0.38, y - r * 0.38, r * 0.76, r * 0.76);
  ctx.strokeStyle = THAN;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - r * 0.38, y - r * 0.38, r * 0.76, r * 0.76);
}

/** Viền tranh: dải chàm ngoài, vạch đỏ trong, đồng tiền ở bốn góc */
function frame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.strokeStyle = CHAM;
  ctx.lineWidth = 10;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = SON;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 16, y + 16, w - 32, h - 32);
  for (const [px, py] of [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ]) {
    dongTien(ctx, px, py, 18);
  }
}

const SKIN = "#f0cfa8";

/** Liền chị: nón quai thao, áo mớ ba mớ bảy, yếm đỏ, váy đen. Gốc toạ độ = chân, chiều cao = 1 (hướng lên là âm). */
function lienChi(ctx: CanvasRenderingContext2D, x: number, baseY: number, h: number, sway: number, nod: number) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(h, h);
  ctx.rotate(sway);
  // váy đen
  ctx.fillStyle = THAN;
  ctx.beginPath();
  ctx.moveTo(-0.19, 0);
  ctx.lineTo(0.19, 0);
  ctx.lineTo(0.12, -0.48);
  ctx.lineTo(-0.12, -0.48);
  ctx.fill();
  // ba lớp áo (từ trong ra ngoài): đỏ - vàng - nâu
  const layer = (col: string, hemW: number, hemY: number) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-0.075, -0.8);
    ctx.lineTo(0.075, -0.8);
    ctx.lineTo(hemW, hemY);
    ctx.lineTo(-hemW, hemY);
    ctx.closePath();
    ctx.fill();
  };
  layer("#b3261e", 0.17, -0.26);
  layer("#e0a526", 0.145, -0.3);
  layer("#8a5a2b", 0.12, -0.34);
  // yếm đỏ lộ ở ngực
  ctx.fillStyle = "#c23a2c";
  ctx.beginPath();
  ctx.moveTo(-0.035, -0.8);
  ctx.lineTo(0.035, -0.8);
  ctx.lineTo(0, -0.6);
  ctx.fill();
  // thắt lưng lụa + đuôi
  ctx.fillStyle = "#e8719a";
  ctx.fillRect(-0.1, -0.52, 0.2, 0.026);
  ctx.beginPath();
  ctx.moveTo(0.02, -0.5);
  ctx.quadraticCurveTo(0.07, -0.38, 0.03, -0.3);
  ctx.lineTo(0.0, -0.32);
  ctx.quadraticCurveTo(0.04, -0.4, -0.005, -0.5);
  ctx.fill();
  // tay chắp trước bụng
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(0, -0.56, 0.02, 0, TAU);
  ctx.fill();
  // đầu
  ctx.save();
  ctx.translate(0, -0.87);
  ctx.rotate(nod);
  ctx.fillStyle = "#1a1412";
  ctx.beginPath();
  ctx.ellipse(0, 0.005, 0.052, 0.058, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.ellipse(0, 0.012, 0.04, 0.047, 0, 0, TAU);
  ctx.fill();
  // quai thao rủ hai bên
  ctx.strokeStyle = SON;
  ctx.lineWidth = 0.011;
  ctx.lineCap = "round";
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(d * 0.04, -0.02);
    ctx.bezierCurveTo(d * 0.07, 0.04, d * 0.06, 0.12, d * 0.075, 0.2);
    ctx.stroke();
    ctx.fillStyle = SON;
    ctx.beginPath();
    ctx.ellipse(d * 0.075, 0.215, 0.009, 0.025, 0, 0, TAU);
    ctx.fill();
  }
  // nón quai thao
  ctx.fillStyle = "#2a2320";
  ctx.beginPath();
  ctx.ellipse(0, -0.045, 0.27, 0.042, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "rgba(224,165,38,0.85)";
  ctx.lineWidth = 0.003;
  for (const k of [0.9, 0.65, 0.4]) {
    ctx.beginPath();
    ctx.ellipse(0, -0.045, 0.27 * k, 0.042 * k, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = "#171210";
  ctx.beginPath();
  ctx.ellipse(0, -0.06, 0.06, 0.03, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

/** Liền anh: khăn xếp, áo the chàm, quần trắng, cầm ô đen */
function lienAnh(ctx: CanvasRenderingContext2D, x: number, baseY: number, h: number, sway: number, nod: number) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(h, h);
  ctx.rotate(sway);
  // ô đen cầm tay
  ctx.strokeStyle = THAN;
  ctx.lineWidth = 0.012;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0.19, 0);
  ctx.lineTo(0.19, -0.62);
  ctx.moveTo(0.19, -0.62);
  ctx.bezierCurveTo(0.19, -0.7, 0.25, -0.7, 0.25, -0.64);
  ctx.stroke();
  // quần trắng + giày
  ctx.fillStyle = "#f4efe2";
  ctx.fillRect(-0.075, -0.22, 0.065, 0.2);
  ctx.fillRect(0.01, -0.22, 0.065, 0.2);
  ctx.fillStyle = THAN;
  ctx.fillRect(-0.085, -0.025, 0.08, 0.025);
  ctx.fillRect(0.005, -0.025, 0.08, 0.025);
  // áo the dài
  ctx.fillStyle = CHAM;
  ctx.beginPath();
  ctx.moveTo(-0.095, -0.8);
  ctx.lineTo(0.095, -0.8);
  ctx.lineTo(0.14, -0.14);
  ctx.lineTo(-0.14, -0.14);
  ctx.fill();
  ctx.strokeStyle = "rgba(247,239,217,0.85)";
  ctx.lineWidth = 0.006;
  ctx.beginPath();
  ctx.moveTo(-0.03, -0.8);
  ctx.lineTo(0.07, -0.16);
  ctx.stroke();
  // cổ áo trắng + cúc vàng
  ctx.fillStyle = "#f4efe2";
  ctx.fillRect(-0.03, -0.805, 0.06, 0.014);
  ctx.fillStyle = NGHE;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(0.02 + i * 0.012, -0.75 + i * 0.13, 0.006, 0, TAU);
    ctx.fill();
  }
  // tay
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(0.01, -0.56, 0.019, 0, TAU);
  ctx.fill();
  // đầu + khăn xếp
  ctx.save();
  ctx.translate(0, -0.87);
  ctx.rotate(nod);
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.ellipse(0, 0.012, 0.04, 0.047, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#15110f";
  ctx.beginPath();
  ctx.ellipse(0, -0.04, 0.07, 0.045, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "rgba(224,165,38,0.45)";
  ctx.lineWidth = 0.003;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 0.022 - 0.01, -0.078);
    ctx.quadraticCurveTo(i * 0.026, -0.04, i * 0.02 + 0.01, -0.005);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

/** Bông sen: cánh hồng xếp lớp, nhuỵ vàng; `breath` ∈ [0,1] làm sen nở/khép nhẹ */
export function senBong(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, breath: number) {
  ctx.save();
  ctx.translate(x, y);
  const open = 0.85 + 0.15 * breath;
  const rows: Array<[number[], string]> = [
    [[-1.0, 1.0], "#f2a2bb"],
    [[-0.62, 0.62], "#f7b9cc"],
    [[-0.3, 0.3, 0], "#fbd3df"],
  ];
  for (const [angs, col] of rows) {
    for (const a of angs) {
      ctx.save();
      ctx.rotate(a * open);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-r * 0.42, -r * 0.25, -r * 0.34, -r * 0.92, 0, -r);
      ctx.bezierCurveTo(r * 0.34, -r * 0.92, r * 0.42, -r * 0.25, 0, 0);
      ctx.fill();
      ctx.strokeStyle = "rgba(190,70,110,0.35)";
      ctx.lineWidth = Math.max(1, r * 0.02);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.1);
      ctx.lineTo(0, -r * 0.85);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.fillStyle = NGHE;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.12, r * 0.14, r * 0.1, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function senLa(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number) {
  ctx.fillStyle = "rgba(60,110,80,0.82)";
  ctx.beginPath();
  ctx.ellipse(x, y, rx, rx * 0.28, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "rgba(220,240,200,0.45)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * rx * 0.92, y + Math.sin(a) * rx * 0.26);
    ctx.stroke();
  }
}

/** Ao sen ở chân khung: nước, sóng lan, lá và bông sen bồng bềnh */
function aoSen(ctx: CanvasRenderingContext2D, W: number, H: number, u: number) {
  const top = H - 44 - Math.max(150, H * 0.15);
  ctx.save();
  ctx.beginPath();
  ctx.rect(44, top, W - 88, H - 88 - (top - 44));
  ctx.clip();
  const g = ctx.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, "rgba(31,58,95,0)");
  g.addColorStop(0.35, "rgba(31,90,110,0.5)");
  g.addColorStop(1, "rgba(24,64,90,0.78)");
  ctx.fillStyle = g;
  ctx.fillRect(44, top, W - 88, H - top);
  // sóng nước: vòng elip nở dần, tần số nguyên → lặp khớp
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const p = (u * 2 + i / 6) % 1;
    const cx = W * (0.12 + 0.76 * ((i * 0.37) % 1));
    const cy = H - 44 - (H - 88 - (top - 44)) * (0.2 + 0.5 * ((i * 0.61) % 1));
    ctx.strokeStyle = `rgba(240,248,250,${(0.5 * (1 - p)).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 20 + 90 * p, 6 + 24 * p, 0, 0, TAU);
    ctx.stroke();
  }
  const s = Math.min(W, H) / 1080;
  const bob = (k: number) => Math.sin(TAU * u * 2 + k) * 3 * s;
  const items: Array<[number, number]> = [
    [0.1, 0.78],
    [0.22, 0.55],
    [0.36, 0.82],
    [0.5, 0.6],
    [0.64, 0.84],
    [0.78, 0.56],
    [0.9, 0.78],
  ];
  items.forEach(([fx, fy], i) => {
    const x = W * fx;
    const y = top + (H - 44 - top) * fy + bob(i);
    senLa(ctx, x, y, (70 + (i % 3) * 22) * s);
  });
  [1, 3, 5].forEach((i, n) => {
    const [fx, fy] = items[i];
    const breath = 0.5 + 0.5 * Math.sin(TAU * u * 2 + n * 2);
    senBong(ctx, W * fx + 14 * s, top + (H - 44 - top) * fy - 10 * s + bob(i), (46 + n * 6) * s, breath);
  });
  ctx.restore();
}

/** Vệt sáng quét chéo qua giấy điệp (1 lần mỗi vòng lặp) */
function sheen(ctx: CanvasRenderingContext2D, W: number, H: number, u: number) {
  const span = W + H;
  const x = -H * 0.5 + u * (span + H * 0.5);
  ctx.save();
  ctx.translate(x, 0);
  ctx.rotate(0.35);
  const g = ctx.createLinearGradient(-160, 0, 160, 0);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.5, "rgba(255,255,255,0.28)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-160, -H, 320, H * 3);
  ctx.restore();
}

export const quanHo: VideoTemplate = {
  id: "quan-ho-kinh-bac",
  name: "Quan Họ Kinh Bắc",
  description: "Giấy điệp, đỏ son – chàm – vàng nghệ kiểu tranh Đông Hồ, nón quai thao, lũy tre làng",
  tier: "free",
  swatch: ["#f7efd9", "#b3261e", "#1f3a5f"],
  colors: ["do", "vang"],
  theme: { heading: SEN, names: SEN, body: MUC, accent: LA, line: "rgba(95,125,79,0.5)" },
  bodyFont: "serif",
  capsFont: "display",
  intro: { title: "script", namesLine: "italic", photoMode: "frame" },

  background(rc) {
    const { ctx, W, H, t, D } = rc;
    const u = t / D;
    drawSprite(ctx, diepPaper(W, H), W / 2, H / 2);
    sun(ctx, W * 0.5, H * 0.34, Math.min(W, H) * 0.3, u);
    radialGlow(ctx, W * 0.5, H * 0.5, Math.max(W, H) * 0.5, "rgba(255,252,240,0.55)");
    frame(ctx, 44, 44, W - 88, H - 88);
    // lũy tre làng phía sau
    const s = Math.min(W, H) / 1080;
    bamboo(ctx, 70, H - 120, 560 * s, 0.05, u, 0);
    bamboo(ctx, W - 70, H - 120, 560 * s, -0.05, u, 2.1);
    // liền anh – liền chị đứng hai bên, đung đưa nhẹ như đang hát đối
    const landscape = W > H;
    // nón rộng 0.54×cao → chị phải cách mép ≥ 0.27×cao để không bị khung cắt
    const figH = landscape ? H * 0.46 : H * 0.19;
    const feet = H - 44 - (landscape ? H * 0.06 : H * 0.03);
    const edge = 70 + 0.3 * figH;
    lienAnh(ctx, edge, feet, figH, Math.sin(TAU * u * 2) * 0.012, Math.sin(TAU * u * 2 + 1) * 0.04);
    lienChi(ctx, W - edge, feet, figH, Math.sin(TAU * u * 2 + 2) * 0.012, Math.sin(TAU * u * 2 + 3) * 0.04);
    aoSen(ctx, W, H, u);
    sheen(ctx, W, H, u);
    // dải mái đình cách điệu phía trên: ba vạch đỏ + chàm
    ctx.fillStyle = CHAM;
    ctx.fillRect(W / 2 - 150, 44, 300, 10);
    ctx.fillStyle = SON;
    ctx.fillRect(W / 2 - 100, 54, 200, 6);
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
