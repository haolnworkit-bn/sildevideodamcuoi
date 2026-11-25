import type { FxSettings } from "../project";
import { shinePhase } from "./motion";
import type { Photo, PhotoSource, RenderContext, TimelineScene } from "./types";

export const TAU = Math.PI * 2;
export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/** PRNG tất định để hạt (cánh hoa, lấp lánh) luôn giống nhau giữa preview và xuất video. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hexToRgba(hex: string, a: number): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
}

/** Trộn 2 màu hex, t = 0..1 */
export function mixColor(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const k = clamp(t);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(",")})`;
}

// ---------------- Dòng thời gian ----------------

export interface Scene {
  start: number;
  end: number;
}

/**
 * Độ hiện của một cảnh, có cross-fade với cảnh kề và vòng qua điểm nối (cuối → đầu)
 * để video lặp liền mạch.
 */
export function sceneVisibility(t: number, D: number, s: Scene, fade = 1): number {
  const f = (tt: number) =>
    Math.min(clamp((tt - (s.start - fade / 2)) / fade), clamp((s.end + fade / 2 - tt) / fade));
  return Math.max(f(t), f(t - D), f(t + D));
}

/** Thời gian cục bộ trong cảnh; âm khi đang fade-in qua điểm nối. */
export function sceneLocalTime(t: number, D: number, s: Scene, fade = 1): number {
  const lt = t - s.start;
  if (lt > s.end - s.start + fade) return lt - D; // cảnh đầu đang fade-in từ cuối video
  if (lt < -fade) return lt + D; // cảnh cuối đang fade-out sang đầu video
  return lt;
}

/** Tiến độ xuất hiện (0..1) của một phần tử trong cảnh */
export function enter(lt: number, delay: number, dur = 1.1): number {
  return easeOutCubic(clamp((lt - delay) / dur));
}

export function drawEntering(ctx: CanvasRenderingContext2D, p: number, dy: number, fn: () => void) {
  if (p <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= p;
  ctx.translate(0, (1 - p) * dy);
  fn();
  ctx.restore();
}

/** Thời điểm mọi phần tử của cảnh đã hiện xong (trễ tối đa 1.7s + 1.1s) */
export const SETTLED = 3.5;

/** Chạy các cảnh theo timeline với kiểu chuyển cảnh đã chọn */
export function runScenes(
  rc: RenderContext,
  draws: Partial<Record<TimelineScene["type"], (lt: number, s: TimelineScene) => void>>,
  fade = 1,
) {
  const { ctx, t, D, W, H, fx } = rc;
  // Chỉ 1 cảnh: chữ đứng yên suốt vòng lặp (không mờ/hiện lại ở điểm nối, không chạy lại hiệu ứng vào cảnh)
  const single = rc.timeline.scenes.length === 1;
  // "Mờ ảo" cần thời gian giao nhau dài hơn một chút cho mềm
  const f = fx.transition === "soft" ? Math.max(fade, 1.3) : fade;
  for (const s of rc.timeline.scenes) {
    const draw = draws[s.type];
    if (!draw) continue;
    const v = single ? 1 : sceneVisibility(t, D, s, f);
    if (v <= 0.001) continue;
    const lt = single ? SETTLED : sceneLocalTime(t, D, s, f);
    const dur = s.end - s.start;
    ctx.save();
    ctx.globalAlpha *= v;
    applyTransition(ctx, fx.transition, v, lt < dur / 2, W, H);
    // "Hơi thở" của cảnh: máy quay tiến rất chậm suốt cảnh (không áp khi kiểm tra bố cục / 1 cảnh đứng yên)
    if (!single && !rc.probe) {
      const k = 1 + 0.018 * clamp((lt + f / 2) / (dur + f));
      ctx.translate(W / 2, H / 2);
      ctx.scale(k, k);
      ctx.translate(-W / 2, -H / 2);
    }
    rc.shine = shinePhase(lt, single, t, D);
    draw(lt, s);
    rc.shine = undefined;
    ctx.restore();
  }
}

function applyTransition(
  ctx: CanvasRenderingContext2D,
  kind: FxSettings["transition"],
  v: number,
  entering: boolean,
  W: number,
  H: number,
) {
  if (kind === "zoom") {
    const s = entering ? 1.06 - 0.06 * v : 1 + 0.04 * (1 - v);
    ctx.translate(W / 2, H / 2);
    ctx.scale(s, s);
    ctx.translate(-W / 2, -H / 2);
  } else if (kind === "slide") {
    ctx.translate(0, (entering ? 1 : -1) * (1 - v) * 70);
  } else if (kind === "soft") {
    // Mờ ảo: cảnh mới hiện từ nhoè sang nét và thu nhẹ vào; cảnh cũ nhoè đi, trôi lên
    const q = 1 - v;
    if (q > 0.01) ctx.filter = `blur(${(q * 10).toFixed(2)}px)`;
    const s = entering ? 1 + 0.035 * q : 1 - 0.012 * q;
    ctx.translate(W / 2, H / 2 + (entering ? 0 : -28 * q));
    ctx.scale(s, s);
    ctx.translate(-W / 2, -H / 2);
  }
}

// ---------------- Hạt chuyển động lặp tuần hoàn ----------------

export interface LoopParticle {
  x0: number;
  y0: number;
  /** Số vòng đi hết màn hình trong một chu kỳ video (số nguyên → lặp khớp) */
  loops: number;
  size: number;
  sway: number;
  swayFreq: number;
  flipFreq: number;
  spin: number;
  phase: number;
  drift: number;
  pick: number;
}

/**
 * Tạo n hạt "mặc định". Thực tế sinh 1.5n để người dùng chỉnh mật độ lên "Nhiều";
 * dùng particlesFor(rc, arr) để lấy đúng số hạt cần vẽ.
 */
export function makeLoopParticles(
  n: number,
  seed: number,
  o: { minSize: number; maxSize: number; maxLoops?: number; drift?: number },
): LoopParticle[] {
  const r = mulberry32(seed);
  const maxLoops = o.maxLoops ?? 2;
  return Array.from({ length: Math.ceil(n * 1.5) }, () => ({
    x0: r(),
    y0: r(),
    loops: 1 + Math.floor(r() * maxLoops),
    size: o.minSize + r() * (o.maxSize - o.minSize),
    sway: 20 + r() * 60,
    swayFreq: 1 + Math.floor(r() * 3),
    flipFreq: 2 + Math.floor(r() * 4),
    spin: Math.floor(r() * 3) - 1 || 1,
    phase: r() * TAU,
    drift: (o.drift ?? 0) * (0.5 + r()),
    pick: r(),
  }));
}

export function particlesFor<T>(rc: RenderContext, arr: T[]): T[] {
  const n = Math.round((arr.length / 1.5) * rc.fx.particles);
  return arr.slice(0, Math.min(arr.length, n));
}

/** dir = 1: rơi xuống, -1: bay lên. u = t / D (0..1). */
export function particleAt(p: LoopParticle, u: number, W: number, H: number, margin: number, dir: 1 | -1) {
  const yy = (((p.y0 + dir * p.loops * u) % 1) + 1) % 1;
  const y = (dir === 1 ? yy : 1 - yy) * (H + 2 * margin) - margin;
  const x = p.x0 * W + p.sway * Math.sin(TAU * p.swayFreq * u + p.phase) + p.drift * yy;
  const rot = p.phase + TAU * p.spin * u;
  const flip = Math.cos(TAU * p.flipFreq * u + p.phase);
  return { x, y, rot, flip, yy };
}

// ---------------- Chữ ----------------

export function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`;
}

export function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: (size: number) => string,
  maxW: number,
  size: number,
  min = size * 0.35,
): number {
  let s = size;
  ctx.font = font(s);
  while (s > min && ctx.measureText(text).width > maxW) {
    s -= 2;
    ctx.font = font(s);
  }
  return s;
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n/)) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        out.push(line);
        line = w;
      } else line = test;
    }
    if (line) out.push(line);
  }
  return out;
}

export type Paint = string | ((ctx: CanvasRenderingContext2D, y: number, h: number) => CanvasGradient);

export function paint(ctx: CanvasRenderingContext2D, p: Paint, y: number, h: number): string | CanvasGradient {
  return typeof p === "string" ? p : p(ctx, y, h);
}

/** Vàng ánh kim, dùng làm Paint cho chữ/viền */
export function goldPaint(ctx: CanvasRenderingContext2D, y: number, h: number) {
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, "#fff1b8");
  g.addColorStop(0.45, "#e8bd5a");
  g.addColorStop(0.55, "#d29a32");
  g.addColorStop(1, "#f6dc8c");
  return g;
}

/** Vàng đậm hơn cho nền sáng */
export function deepGoldPaint(ctx: CanvasRenderingContext2D, y: number, h: number) {
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, "#c9a24e");
  g.addColorStop(0.5, "#9c7425");
  g.addColorStop(1, "#c39a45");
  return g;
}

// ---------------- Sprite (vẽ sẵn 1 lần) ----------------

const spriteCache = new Map<string, HTMLCanvasElement>();

/**
 * Sprite vẽ sẵn 1 lần (hoa mẫu đơn, lá trầu…) rồi dùng lại mỗi khung hình → preview mượt trên máy yếu.
 * Vẽ ở độ phân giải đủ lớn cho bản 1920×1080.
 */
export function sprite(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  let c = spriteCache.get(key);
  if (!c) {
    c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = c.getContext("2d");
    if (x) draw(x);
    spriteCache.set(key, c);
  }
  return c;
}

/** Canvas nháp tái sử dụng (để tạo mặt nạ alpha…) — không vẽ sẵn gì */
const scratchCache = new Map<string, HTMLCanvasElement>();
export function scratchCanvas(key: string, w: number, h: number) {
  const k = `${key}:${w}x${h}`;
  let c = scratchCache.get(k);
  if (!c) {
    c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    scratchCache.set(k, c);
  }
  return c;
}

/** Vẽ sprite với tâm tại (x,y), xoay và scale */
export function drawSprite(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, x: number, y: number, scale = 1, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
}

// ---------------- Ảnh ----------------

export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: PhotoSource,
  x: number,
  y: number,
  w: number,
  h: number,
  zoom = 1,
  fy = 0.5,
) {
  const iw = img.width;
  const ih = img.height;
  if (!iw || !ih) return;
  const s = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * s;
  const dh = ih * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) * fy, dw, dh);
}

/** Ảnh phủ kín khung, zoom nhẹ theo chu kỳ video (Ken Burns lặp khớp) */
export function drawPhoto(ctx: CanvasRenderingContext2D, p: Photo, x: number, y: number, w: number, h: number, rc: RenderContext, amp = 0.04) {
  drawImageCover(ctx, p.img, x, y, w, h, 1 + amp * 1.5 + amp * Math.sin((TAU * rc.t) / rc.D), p.focusY);
}

export function archPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

export function radialGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  // Mờ dần về CÙNG màu với alpha 0 (nếu về rgba(0,0,0,0) sẽ bị quầng xám)
  g.addColorStop(1, color.replace(/rgba?\(([^,]+),([^,]+),([^,)]+)(?:,[^)]+)?\)/, "rgba($1,$2,$3,0)"));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// ---------------- Watermark ----------------

export function drawWatermark(ctx: CanvasRenderingContext2D, W: number, H: number, text: string, font: string) {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-0.35);
  ctx.font = `600 44px ${font}`;
  setSpacing(ctx, 8);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const stepX = ctx.measureText(text).width + 220;
  const R = Math.max(W, H);
  for (let y = -R; y <= R; y += 220) {
    const off = (Math.round(y / 220) % 2) * (stepX / 2);
    for (let x = -R * 1.2; x <= R * 1.2; x += stepX) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.strokeText(text, x + off, y);
      ctx.fillStyle = "rgba(255,255,255,0.34)";
      ctx.fillText(text, x + off, y);
    }
  }
  ctx.restore();
}
