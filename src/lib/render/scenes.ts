/**
 * Bố cục các cảnh — dùng chung cho mọi mẫu, tự xếp theo khung ngang (16:9) hoặc dọc (9:16).
 * Mẫu chỉ cung cấp phong cách: màu (theme), font, khung ảnh, biểu tượng, hoạ tiết.
 */
import { MAX_PHOTOS, dateInfo, detailLine, eventTitle, fullNamePair, namePair } from "../project";
import {
  clamp,
  drawPhoto,
  easeOutCubic,
  enter,
  fitFont,
  paint,
  scratchCanvas,
  setSpacing,
  wrapText,
  type Paint,
} from "./helpers";
import { MIN_PX, drawText, fitInk, fitLines, fitParagraph, probeRect, safeBox, stackLines } from "./layout";
import { drawReveal, enterRaw, revealDur, type RevealMode } from "./motion";
import type { Photo, RenderContext, Theme, TimelineScene, VideoTemplate } from "./types";

type Rect = [number, number, number, number];

const bodyFontOf = (rc: RenderContext, tpl: VideoTemplate) =>
  tpl.bodyFont === "display" ? rc.fonts.display : rc.fonts.serif;

const LIGHT_ON_PHOTO: Theme = {
  heading: "#fdfaf2",
  names: "#fdfaf2",
  body: "#f4efe4",
  accent: "#e9dfc6",
  line: "rgba(255,255,255,0.6)",
};

export function drawDivider(ctx: CanvasRenderingContext2D, cx: number, y: number, half: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - half, y);
  ctx.lineTo(cx - 18, y);
  ctx.moveTo(cx + 18, y);
  ctx.lineTo(cx + half, y);
  ctx.stroke();
  ctx.translate(cx, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-7, -7, 14, 14);
  ctx.restore();
}

function center(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
}

interface RevealExtra {
  dur?: number;
  dy?: number;
  dx?: number;
  cx?: number;
  cy?: number;
  half?: number;
}

/** Hiện một phần tử theo kiểu `mode` (xem motion.ts), bắt đầu ở `delay` giây của cảnh */
function reveal(rc: RenderContext, lt: number, delay: number, mode: RevealMode, fn: () => void, o: RevealExtra = {}) {
  drawReveal(rc, enterRaw(lt, delay, revealDur(mode, o.dur)), { mode, ...o }, fn);
}

// =====================================================================
// Cảnh 1: Giới thiệu
// =====================================================================

interface BlockItem {
  h: number;
  delay: number;
  dur?: number;
  dy: number;
  /** Kiểu hiện (motion.ts). Mặc định plain */
  mode?: RevealMode;
  /** Nửa bề rộng (mode grow) */
  half?: number;
  /** Chạy vào theo chiều ngang (px, âm = từ trái) */
  dx?: number;
  draw: (y: number, p: number) => void;
}

interface BlockOpts {
  greeting: boolean;
  divider: boolean;
  date: boolean;
  pal: Theme;
  cx: number;
  maxW: number;
}

/** Khối chữ giới thiệu: lời chào · tiêu đề · gạch · họ tên · ngày.
 *  Chiều cao từng dòng tính theo chữ ĐÃ ĐO (font script có nét uốn cao, tên dài xuống 2 dòng). */
function introBlock(rc: RenderContext, tpl: VideoTemplate, o: BlockOpts): BlockItem[] {
  const { ctx, data, fonts, portrait } = rc;
  const spec = tpl.intro;
  const info = dateInfo(data);
  const items: BlockItem[] = [];
  const cx = o.cx;

  const greet = data.greeting.trim().toUpperCase();
  if (o.greeting && greet) {
    const font = (s: number) => `500 ${s}px ${fonts.sans}`;
    ctx.save();
    setSpacing(ctx, 12);
    const fit = fitLines(ctx, greet, font, o.maxW, portrait ? 28 : 30, MIN_PX.greeting + 2);
    ctx.restore();
    const lh = fit.size * 1.5;
    items.push({
      h: 66 + (fit.lines.length - 1) * lh,
      delay: 0.3,
      dy: 20,
      mode: "chars",
      draw: (y) => {
        setSpacing(ctx, 12);
        ctx.font = font(fit.size);
        ctx.fillStyle = o.pal.accent;
        const y0 = y - ((fit.lines.length - 1) * lh) / 2;
        fit.lines.forEach((l, i) => drawText(rc, "greeting", l, cx, y0 + i * lh));
      },
    });
  }

  const caps = spec.title === "caps";
  const title = caps ? eventTitle(data).toUpperCase() : eventTitle(data);
  const backed = !!spec.titleBacking;
  const titleFont = caps ? (s: number) => `500 ${s}px ${fonts.caps}` : (s: number) => `400 ${s}px ${fonts.script}`;
  ctx.save();
  // chữ in hoa giãn cách 20px; chật thì giảm giãn cách trước khi thu nhỏ chữ
  let spacing = caps ? 20 : 0;
  setSpacing(ctx, spacing);
  const capsTarget = portrait ? 104 : 124;
  let titleSize = caps
    ? fitInk(ctx, title, titleFont, o.maxW, capsTarget)
    : fitInk(ctx, title, titleFont, backed ? Math.min(o.maxW, portrait ? 600 : 920) : o.maxW, backed ? 150 : 190);
  if (caps && titleSize < capsTarget * 0.8) {
    spacing = 8;
    setSpacing(ctx, spacing);
    titleSize = fitInk(ctx, title, titleFont, o.maxW, capsTarget);
  }
  const tm = ctx.measureText(title);
  ctx.restore();
  // khung glyph thật so với đường giữa (textBaseline = middle)
  const asc = tm.actualBoundingBoxAscent;
  const desc = tm.actualBoundingBoxDescent;
  const nominal = caps ? 160 : 220;
  const titleH = Math.max(nominal, asc + desc + 36);
  items.push({
    h: titleH,
    delay: 0.6,
    dur: 1.3,
    dy: 30,
    dx: -90,
    mode: caps ? "chars" : "wipe",
    draw: (y, p) => {
      if (spec.titleBacking) spec.titleBacking(rc, cx, y, Math.min(o.maxW + 60, portrait ? 760 : 1120), 190, p);
      // đặt sao cho khung glyph nằm giữa ô của nó (không chồm lên dòng chào phía trên)
      const ty = y + (asc - desc) / 2;
      ctx.save();
      setSpacing(ctx, spacing);
      ctx.font = titleFont(titleSize);
      ctx.fillStyle = paint(ctx, o.pal.heading, ty, caps ? 120 : 170);
      drawText(rc, "title", title, cx, ty);
      ctx.restore();
    },
  });

  if (o.divider) {
    items.push({ h: 56, delay: 1.0, dy: 0, mode: "grow", half: 240, draw: (y) => drawDivider(ctx, cx, y, 220, o.pal.line) });
  }

  if (spec.namesLine === "script") {
    const [a, b] = namePair(data);
    const font = (z: number) => `400 ${z}px ${fonts.script}`;
    const fit = fitLines(ctx, `${a} & ${b}`, font, o.maxW, 100, MIN_PX.names + 4, " & ");
    const st = stackLines(ctx, fit.lines, fit.size * 0.12);
    items.push({
      h: Math.max(116, st.height + 34),
      delay: 1.3,
      dy: 20,
      dx: 90,
      mode: "wipe",
      draw: (y) => {
        ctx.font = font(fit.size);
        ctx.fillStyle = paint(ctx, o.pal.names, y, 100);
        fit.lines.forEach((l, i) => drawText(rc, "names", l, cx, y + st.offsets[i]));
      },
    });
  } else {
    const [a, b] = fullNamePair(data);
    const font = (z: number) => `italic 500 ${z}px ${bodyFontOf(rc, tpl)}`;
    const fit = fitLines(ctx, `${a}  &  ${b}`, font, o.maxW, 58, MIN_PX.namesLine + 6, "  &  ");
    const st = stackLines(ctx, fit.lines, fit.size * 0.2);
    items.push({
      h: Math.max(88, st.height + 40),
      delay: 1.3,
      dy: 20,
      dx: 60,
      mode: "words",
      draw: (y) => {
        ctx.font = font(fit.size);
        ctx.fillStyle = o.pal.body;
        fit.lines.forEach((l, i) => drawText(rc, "namesLine", l, cx, y + st.offsets[i]));
      },
    });
  }

  if (o.date && info.valid) {
    items.push({
      h: 62,
      delay: 1.6,
      dy: 20,
      mode: "chars",
      draw: (y) => {
        setSpacing(ctx, 8);
        fitFont(ctx, `${info.weekday.toUpperCase()}  ·  ${info.solar}`, (s) => `500 ${s}px ${fonts.sans}`, o.maxW, 32);
        ctx.fillStyle = o.pal.accent;
        drawText(rc, "date", `${info.weekday.toUpperCase()}  ·  ${info.solar}`, cx, y);
      },
    });
  }
  return items;
}

const blockHeight = (items: BlockItem[]) => items.reduce((s, i) => s + i.h, 0);

function drawBlock(rc: RenderContext, lt: number, items: BlockItem[], top: number, cx: number) {
  let y = top;
  for (const it of items) {
    const mode = it.mode ?? "plain";
    const r = enterRaw(lt, it.delay, revealDur(mode, it.dur));
    const cy = y + it.h / 2;
    drawReveal(rc, r, { mode, dy: it.dy, dx: it.dx, cx, half: it.half }, () => {
      center(rc.ctx);
      it.draw(cy, easeOutCubic(r));
    });
    y += it.h;
  }
}

/** Ảnh tràn một phần màn hình, mờ dần về phía chữ */
function fadedPhoto(rc: RenderContext, photo: Photo) {
  const { ctx, W, H, portrait, data } = rc;
  const left = data.photoSide === "left";
  const [x0, y0, w, h] = portrait ? [0, 0, W, 1120] : left ? [0, 0, 1060, H] : [860, 0, 1060, H];
  const c = scratchCanvas("faded", w, h);
  const s = c.getContext("2d");
  if (!s) return;
  s.globalCompositeOperation = "source-over";
  s.clearRect(0, 0, w, h);
  drawPhoto(s, photo, 0, 0, w, h, rc, 0.03);
  s.globalCompositeOperation = "destination-in";
  const fadeTo = (g: CanvasGradient, reverse: boolean) => {
    g.addColorStop(reverse ? 1 : 0, "rgba(0,0,0,0)");
    g.addColorStop(reverse ? 0 : 1, "rgba(0,0,0,1)");
    s.fillStyle = g;
    s.fillRect(0, 0, w, h);
  };
  if (portrait) {
    fadeTo(s.createLinearGradient(0, h, 0, h - 420), false);
  } else {
    // mờ về phía chữ + mờ đáy
    fadeTo(left ? s.createLinearGradient(w, 0, w - 420, 0) : s.createLinearGradient(0, 0, 420, 0), false);
    fadeTo(s.createLinearGradient(0, h, 0, h - 260), false);
  }
  s.globalCompositeOperation = "source-over";
  ctx.drawImage(c, x0, y0);
}

export function introScene(rc: RenderContext, lt: number, tpl: VideoTemplate) {
  const { ctx, W, H, portrait, photo, data } = rc;
  const spec = tpl.intro;
  const pal = rc.theme;
  center(ctx);

  let mode: "frame" | "emblem" | "fullbleed" | "faded" | "none" = photo ? spec.photoMode : spec.emblem ? "emblem" : "none";
  if (mode === "emblem" && !spec.emblem) mode = "frame";

  if (mode === "frame" && photo) {
    const left = data.photoSide === "left";
    const frame: Rect = portrait ? [190, 150, 700, 860] : left ? [190, 150, 620, 780] : [1110, 150, 620, 780];
    const cx = portrait ? W / 2 : left ? 1330 : 600;
    const maxW = portrait ? 920 : 840;
    reveal(rc, lt, 0.1, "photo", () => tpl.photoFrame(ctx, photo, ...frame, rc), { dur: 1.5, dy: 30, dx: portrait ? 0 : left ? -120 : 120, cx: frame[0] + frame[2] / 2, cy: frame[1] + frame[3] / 2 });
    probeRect(rc, "photo", ...frame);
    const items = introBlock(rc, tpl, { greeting: true, divider: true, date: true, pal, cx, maxW });
    const h = blockHeight(items);
    drawBlock(rc, lt, items, portrait ? 1070 + (560 - h) / 2 : (H - h) / 2, cx);
    return;
  }

  if (mode === "emblem" && spec.emblem) {
    const emblem = spec.emblem;
    let cy = portrait ? 650 : 400;
    let r = portrait ? 240 : 175;
    const gapBelow = portrait ? 80 : 40;
    const greetGap = portrait ? 100 : 62;
    const items = introBlock(rc, tpl, { greeting: false, divider: false, date: true, pal, cx: W / 2, maxW: portrait ? 920 : 1400 });
    // khối chữ cao (tên dài 2 dòng): đẩy biểu tượng lên, hết chỗ thì thu nhỏ biểu tượng
    const safe = safeBox(W, H);
    const over = cy + r + gapBelow + blockHeight(items) - safe.y1;
    if (over > 0) {
      const up = Math.min(over, cy - r - greetGap - 40 - safe.y0);
      cy -= Math.max(0, up);
      const rest = over - Math.max(0, up);
      if (rest > 0) {
        r = Math.max(r * 0.6, r - rest / 2);
        cy -= rest / 2;
      }
    }
    const greet = data.greeting.trim().toUpperCase();
    if (greet) {
      reveal(rc, lt, 0.2, "chars", () => {
        center(ctx);
        setSpacing(ctx, 14);
        const fit = fitLines(ctx, greet, (s) => `500 ${s}px ${rc.fonts.sans}`, portrait ? 900 : 1200, portrait ? 28 : 30, MIN_PX.greeting + 2);
        ctx.fillStyle = pal.accent;
        const lh = fit.size * 1.5;
        fit.lines.forEach((l, i) => drawText(rc, "greeting", l, W / 2, cy - r - greetGap - (fit.lines.length - 1 - i) * lh));
      });
    }
    reveal(rc, lt, 0.3, "photo", () => emblem(rc, W / 2, cy, r, photo), { dur: 1.4, dy: 20, cx: W / 2, cy });
    probeRect(rc, "emblem", W / 2 - r * 0.8, cy - r * 0.8, r * 1.6, r * 1.6);
    drawBlock(rc, lt, items, cy + r + gapBelow, W / 2);
    return;
  }

  if (mode === "fullbleed" && photo) {
    reveal(rc, lt, 0, "plain", () => {
      drawPhoto(ctx, photo, 0, 0, W, H, rc, 0.03);
      const g = ctx.createLinearGradient(0, H * (portrait ? 0.45 : 0.35), 0, H);
      g.addColorStop(0, "rgba(18,20,16,0)");
      g.addColorStop(1, "rgba(18,20,16,0.8)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }, { dur: 1.2, dy: 0 });
    const light: Theme = { ...LIGHT_ON_PHOTO, ...tpl.onPhoto };
    const items = introBlock(rc, tpl, { greeting: true, divider: true, date: true, pal: light, cx: W / 2, maxW: portrait ? 920 : 1500 });
    drawBlock(rc, lt, items, H - blockHeight(items) - (portrait ? 170 : 60), W / 2);
    return;
  }

  if (mode === "faded" && photo) {
    reveal(rc, lt, 0, "plain", () => fadedPhoto(rc, photo), { dur: 1.6, dy: 0 });
    const left = data.photoSide === "left";
    const cx = portrait ? W / 2 : left ? 1400 : 520;
    const items = introBlock(rc, tpl, { greeting: true, divider: true, date: true, pal, cx, maxW: portrait ? 920 : 820 });
    const h = blockHeight(items);
    // dọc: chữ nằm ngay dưới ảnh, chừa ~350px đáy cho hoạ tiết của mẫu
    drawBlock(rc, lt, items, portrait ? 1020 + (540 - h) / 2 : (H - h) / 2, cx);
    return;
  }

  const items = introBlock(rc, tpl, { greeting: true, divider: true, date: true, pal, cx: W / 2, maxW: portrait ? 920 : 1400 });
  drawBlock(rc, lt, items, (H - blockHeight(items)) / 2, W / 2);
}

// =====================================================================
// Cảnh 2: Lời cảm ơn
// =====================================================================

export interface MessageFit {
  lines: string[];
  size: number;
  /** true = ở cỡ chữ nhỏ nhất vẫn không vừa → đã rút gọn, dòng cuối có "…" (editor phải cảnh báo) */
  overflow: boolean;
}

/**
 * Xếp lời cảm ơn: giảm cỡ chữ từng bước tới ngưỡng tối thiểu (vẫn đọc được trên TV) cho tới khi vừa khung.
 * Không bao giờ cắt bớt dòng một cách im lặng: nếu vẫn tràn thì dòng cuối có "…" và overflow = true.
 */
export function fitMessage(ctx: CanvasRenderingContext2D, text: string, font: (size: number) => string, portrait: boolean): MessageFit {
  const maxSpan = portrait ? 680 : 400; // khoảng cách tối đa từ dòng đầu tới dòng cuối (px)
  const baseW = portrait ? 880 : 1320;
  const start = portrait ? 56 : 58;
  const min = portrait ? 38 : 36;
  const widthFor = (size: number) => (size <= 50 ? baseW + 60 : baseW);
  for (let size = start; size >= min; size -= 2) {
    ctx.font = font(size);
    const lines = wrapText(ctx, text, widthFor(size));
    if ((lines.length - 1) * size * 1.45 <= maxSpan) return { lines, size, overflow: false };
  }
  ctx.font = font(min);
  const w = widthFor(min);
  const all = wrapText(ctx, text, w);
  const maxLines = Math.floor(maxSpan / (min * 1.45)) + 1;
  const lines = all.slice(0, maxLines);
  let last = lines[lines.length - 1] ?? "";
  while (last && ctx.measureText(`${last}…`).width > w) last = last.replace(/\s*\S+$/, "");
  lines[lines.length - 1] = `${last}…`;
  return { lines, size: min, overflow: true };
}

export const messageFont = (rc: Pick<RenderContext, "fonts">, tpl: VideoTemplate) => {
  const bf = tpl.bodyFont === "display" ? rc.fonts.display : rc.fonts.serif;
  return (size: number) => `italic 500 ${size}px ${bf}`;
};

export function messageScene(rc: RenderContext, lt: number, tpl: VideoTemplate) {
  const { ctx, W, H, data, portrait, fonts } = rc;
  const pal = rc.theme;
  const cx = W / 2;
  const mid = H / 2 + (portrait ? 40 : 100);
  center(ctx);

  const font = messageFont(rc, tpl);
  const { lines, size } = fitMessage(ctx, data.message, font, portrait);
  const lh = size * 1.45;
  const top = mid - ((lines.length - 1) * lh) / 2;
  const headY = top - (portrait ? 170 : 150);

  reveal(rc, lt, 0.1, "grow", () => tpl.ornament?.(rc, cx, headY - 110), { cx, half: W * 0.3 });
  reveal(rc, lt, 0.3, "wipe", () => {
    center(ctx);
    ctx.font = `400 ${portrait ? 110 : 120}px ${fonts.script}`;
    ctx.fillStyle = paint(ctx, pal.heading, headY, 120);
    drawText(rc, "heading", "Lời cảm ơn", cx, headY);
  }, { dx: -80 });
  lines.forEach((line, i) => {
    reveal(rc, lt, 0.8 + i * 0.3, "words", () => {
      center(ctx);
      ctx.font = font(size);
      ctx.fillStyle = pal.body;
      drawText(rc, "message", line, cx, top + i * lh);
    }, { dur: 1.2, dx: i % 2 ? -50 : 50 });
  });
  reveal(rc, lt, 1.4 + lines.length * 0.25, "grow", () =>
    drawDivider(ctx, cx, Math.min(H - 110, top + lines.length * lh + 30), 220, pal.line),
  { cx, half: 240 });
}

// =====================================================================
// Cảnh Khoảnh khắc: trình chiếu ảnh
// =====================================================================

export function albumScene(rc: RenderContext, lt: number, s: TimelineScene, tpl: VideoTemplate) {
  const { ctx, W, portrait, fonts } = rc;
  const pal = rc.theme;
  const photos = rc.photos.slice(0, MAX_PHOTOS);
  const n = photos.length;
  if (n === 0) return;
  const len = s.end - s.start;
  const slot = len / n;
  const fade = 0.8;
  const frame: Rect = portrait ? [140, 330, 800, 1060] : [250, 110, 700, 860];
  const textCx = portrait ? W / 2 : 1400;
  center(ctx);

  // tiêu đề
  reveal(rc, lt, 0.2, "wipe", () => {
    center(ctx);
    ctx.font = `400 ${portrait ? 120 : 130}px ${fonts.script}`;
    ctx.fillStyle = paint(ctx, pal.heading, 0, 130);
    drawText(rc, "heading", "Khoảnh khắc", textCx, portrait ? 190 : 420);
  }, { dx: 90 });
  if (!portrait) {
    reveal(rc, lt, 0.5, "grow", () => drawDivider(ctx, textCx, 530, 200, pal.line), { cx: textCx, half: 220 });
    const [a, b] = fullNamePair(rc.data);
    reveal(rc, lt, 0.7, "words", () => {
      center(ctx);
      const fit = fitLines(ctx, `${a}  &  ${b}`, (z) => `italic 500 ${z}px ${bodyFontOf(rc, tpl)}`, 760, 54, MIN_PX.namesLine + 4, "  &  ");
      ctx.fillStyle = pal.body;
      const lh = fit.size * 1.3;
      fit.lines.forEach((l, i) => drawText(rc, "namesLine", l, textCx, 620 - ((fit.lines.length - 1) * lh) / 2 + i * lh));
    });
  }

  probeRect(rc, "photo", ...frame);
  // ảnh chuyển lần lượt (cross-fade)
  const p0 = enter(lt, 0, 1.2);
  const fcx = frame[0] + frame[2] / 2;
  const fcy = frame[1] + frame[3] / 2;
  photos.forEach((ph, i) => {
    const a0 = i === 0 ? 1 : clamp((lt - (i * slot - fade / 2)) / fade);
    const a1 = i === n - 1 ? 1 : clamp(((i + 1) * slot + fade / 2 - lt) / fade);
    const v = Math.min(a0, a1);
    if (v <= 0.001) return;
    ctx.save();
    ctx.globalAlpha *= v;
    // vào cảnh: phóng nhẹ vào chỗ; mỗi ảnh mới cũng thu nhẹ vào chỗ cho có nhịp
    const sc = (0.95 + 0.05 * p0) * (i === 0 ? 1 : 1.03 - 0.03 * easeOutCubic(a0));
    ctx.translate(fcx, fcy + (1 - p0) * 30);
    ctx.scale(sc, sc);
    ctx.translate(-fcx, -fcy);
    tpl.photoFrame(ctx, ph, ...frame, rc);
    ctx.restore();
  });

  // chấm chỉ số ảnh
  const cur = clamp(Math.floor(lt / slot), 0, n - 1);
  const dotsY = portrait ? 1490 : 720;
  reveal(rc, lt, 0.8, "plain", () => {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i === cur ? pal.accent : pal.line;
      ctx.beginPath();
      ctx.arc(textCx + (i - (n - 1) / 2) * 30, dotsY, i === cur ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, { dy: 0 });
}

// =====================================================================
// Cảnh 3: Tên + ngày lễ
// =====================================================================

function drawNames(
  rc: RenderContext,
  a: string,
  b: string,
  cx: number,
  cy: number,
  maxW: number,
  big: number,
  fill: Paint,
  forceStack: boolean,
  /** Hai tên đang "chạy vào" từ hai bên: độ lệch còn lại (px) */
  spread = 0,
) {
  const { ctx, fonts } = rc;
  const f = (sz: number) => `400 ${sz}px ${fonts.script}`;
  ctx.font = f(big);
  const one = `${a}  &  ${b}`;
  ctx.fillStyle = paint(ctx, fill, cy, 260);
  if (!forceStack && ctx.measureText(one).width <= maxW) {
    if (spread < 0.5) {
      drawText(rc, "names", one, cx, cy);
      return;
    }
    // tách 3 phần để tên trái chạy từ trái, tên phải chạy từ phải, "&" ở giữa đứng yên
    const x0 = cx - ctx.measureText(one).width / 2;
    const xAmp = x0 + ctx.measureText(`${a}  `).width;
    const xB = x0 + ctx.measureText(`${a}  &  `).width;
    ctx.save();
    ctx.textAlign = "left";
    drawText(rc, "names", a, x0 - spread, cy);
    drawText(rc, "names", "&", xAmp, cy);
    drawText(rc, "names", b, xB + spread, cy);
    ctx.restore();
    return;
  }
  const sz = Math.min(fitInk(ctx, a, f, maxW, Math.min(big, 124)), fitInk(ctx, b, f, maxW, Math.min(big, 124)));
  // xếp 3 dòng tên / & / tên theo khung glyph thật (nét script cao, có dấu tiếng Việt)
  ctx.font = f(sz);
  const ma = ctx.measureText(a);
  const mb = ctx.measureText(b);
  const amp = Math.round(sz * 0.65);
  ctx.font = f(amp);
  const mm = ctx.measureText("&");
  const pad = sz * 0.08;
  const yAmp = cy;
  const yA = yAmp - mm.actualBoundingBoxAscent - pad - ma.actualBoundingBoxDescent;
  const yB = yAmp + mm.actualBoundingBoxDescent + pad + mb.actualBoundingBoxAscent;
  // căn cả khối quanh cy
  const shift = (yA - ma.actualBoundingBoxAscent + yB + mb.actualBoundingBoxDescent) / 2 - cy;
  drawText(rc, "namesLine", "&", cx, yAmp - shift);
  ctx.font = f(sz);
  drawText(rc, "names", a, cx - spread, yA - shift);
  drawText(rc, "names", b, cx + spread, yB - shift);
}

export function drawDateBlock(
  rc: RenderContext,
  cx: number,
  cy: number,
  info: { weekday: string; day: string; month: string; year: string },
  k = 1,
) {
  const { ctx, fonts, theme } = rc;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(k, k);
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-120, -70);
  ctx.lineTo(-120, 70);
  ctx.moveTo(120, -70);
  ctx.lineTo(120, 70);
  ctx.stroke();

  ctx.textBaseline = "middle";
  ctx.fillStyle = paint(ctx, theme.names, 0, 150);
  ctx.font = `600 150px ${fonts.display}`;
  ctx.textAlign = "center";
  drawText(rc, "date", info.day, 0, 6);

  ctx.fillStyle = theme.accent;
  ctx.font = `500 36px ${fonts.sans}`;
  setSpacing(ctx, 6);
  ctx.textAlign = "right";
  drawText(rc, "date", info.weekday.toUpperCase(), -160, 0);

  ctx.textAlign = "left";
  drawText(rc, "date", `THÁNG ${info.month}`, 160, -24);
  ctx.font = `600 40px ${fonts.sans}`;
  drawText(rc, "date", info.year, 160, 28);
  ctx.restore();
}

export function namesScene(rc: RenderContext, lt: number, tpl: VideoTemplate) {
  const { ctx, W, portrait, data, photo, fonts } = rc;
  const pal = rc.theme;
  const [a, b] = namePair(data);
  const info = dateInfo(data);
  const lunar = info.lunar;
  const detail = detailLine(data);
  const bf = bodyFontOf(rc, tpl);
  center(ctx);

  let cx: number;
  let maxW: number;
  let k: number;
  let y: { label: number; names: number; date: number; lunar: number; detail: number };
  let frame: Rect | null = null;

  if (!portrait) {
    const left = data.photoSide === "left";
    cx = photo ? (left ? 1300 : 620) : W / 2;
    maxW = photo ? 940 : 1560;
    k = photo ? 0.86 : 1;
    if (photo) frame = left ? [180, 150, 620, 780] : [1120, 150, 620, 780];
    y = { label: 170, names: 400, date: 720, lunar: 860, detail: lunar ? 935 : 880 };
  } else {
    const base = photo ? 800 : 580;
    cx = W / 2;
    maxW = 920;
    k = 0.9;
    if (photo) frame = [280, 140, 520, 620];
    y = { label: base + 30, names: base + 240, date: base + 510, lunar: base + 650, detail: base + (lunar ? 725 : 650) };
  }

  if (frame && photo) {
    const f = frame;
    reveal(rc, lt, 0.15, "photo", () => tpl.photoFrame(ctx, photo, ...f, rc), { dur: 1.4, dy: 30, dx: portrait ? 0 : data.photoSide === "left" ? -120 : 120, cx: f[0] + f[2] / 2, cy: f[1] + f[3] / 2 });
    probeRect(rc, "photo", ...f);
  }

  reveal(rc, lt, 0.1, "chars", () => {
    center(ctx);
    setSpacing(ctx, 14);
    fitFont(ctx, eventTitle(data).toUpperCase(), (s) => `500 ${s}px ${fonts.sans}`, maxW, 32);
    ctx.fillStyle = pal.accent;
    drawText(rc, "label", eventTitle(data).toUpperCase(), cx, y.label);
  });

  // hai tên chạy từ hai bên vào gặp nhau ở giữa (đồng thời hiện như viết tay)
  const nr = enterRaw(lt, 0.4, revealDur("wipe", 1.6));
  const spread = (portrait ? 110 : 160) * Math.pow(1 - clamp(nr * 1.1), 4);
  reveal(rc, lt, 0.4, "wipe", () => {
    center(ctx);
    drawNames(rc, a, b, cx, y.names, maxW, photo && !portrait ? 130 : 150, pal.names, false, spread);
  }, { dur: 1.6 });

  if (info.valid) reveal(rc, lt, 1.1, "chars", () => drawDateBlock(rc, cx, y.date, info, k));

  if (lunar) {
    reveal(rc, lt, 1.5, "words", () => {
      center(ctx);
      fitFont(ctx, `(${lunar})`, (z) => `italic 500 ${z}px ${bf}`, maxW, 42);
      ctx.fillStyle = pal.body;
      drawText(rc, "lunar", `(${lunar})`, cx, y.lunar);
    });
  }
  if (detail) {
    reveal(rc, lt, 1.8, "words", () => {
      center(ctx);
      setSpacing(ctx, 2);
      // địa chỉ dài: xuống 2 dòng (ngắt ở "·" nếu có) thay vì thu chữ tới mức không đọc được
      const fit = fitParagraph(ctx, detail, (sz) => `400 ${sz}px ${fonts.sans}`, maxW, 32, MIN_PX.detail + 4, 3, "  ·  ");
      ctx.fillStyle = pal.accent;
      const lh = fit.size * 1.45;
      // nhiều dòng: chỉ đẩy lên vừa đủ để dòng cuối không lọt khỏi vùng an toàn
      const room = safeBox(W, rc.H).y1 - fit.size - y.detail;
      const y0 = y.detail - Math.max(0, (fit.lines.length - 1) * lh - room);
      fit.lines.forEach((l, i) => drawText(rc, "detail", l, cx, y0 + i * lh));
    });
  }
}
