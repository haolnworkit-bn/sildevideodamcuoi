/**
 * Bố cục các cảnh — dùng chung cho mọi mẫu, tự xếp theo khung ngang (16:9) hoặc dọc (9:16).
 * Mẫu chỉ cung cấp phong cách: màu (theme), font, khung ảnh, biểu tượng, hoạ tiết.
 */
import { MAX_PHOTOS, dateInfo, detailLine, eventTitle, fullNamePair, namePair } from "../project";
import {
  clamp,
  drawEntering,
  drawPhoto,
  enter,
  fitFont,
  paint,
  scratchCanvas,
  setSpacing,
  wrapText,
  type Paint,
} from "./helpers";
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

// =====================================================================
// Cảnh 1: Giới thiệu
// =====================================================================

interface BlockItem {
  h: number;
  delay: number;
  dur?: number;
  dy: number;
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

/** Khối chữ giới thiệu: lời chào · tiêu đề · gạch · họ tên · ngày */
function introBlock(rc: RenderContext, tpl: VideoTemplate, o: BlockOpts): BlockItem[] {
  const { ctx, data, fonts, portrait } = rc;
  const spec = tpl.intro;
  const info = dateInfo(data);
  const items: BlockItem[] = [];
  const cx = o.cx;

  const greet = data.greeting.trim().toUpperCase();
  if (o.greeting && greet) {
    items.push({
      h: 66,
      delay: 0.3,
      dy: 20,
      draw: (y) => {
        setSpacing(ctx, 12);
        fitFont(ctx, greet, (s) => `500 ${s}px ${fonts.sans}`, o.maxW, portrait ? 28 : 30);
        ctx.fillStyle = o.pal.accent;
        ctx.fillText(greet, cx, y);
      },
    });
  }

  const caps = spec.title === "caps";
  const title = caps ? eventTitle(data).toUpperCase() : eventTitle(data);
  items.push({
    h: caps ? 160 : 220,
    delay: 0.6,
    dur: 1.3,
    dy: 30,
    draw: (y, p) => {
      const backed = !!spec.titleBacking;
      if (spec.titleBacking) spec.titleBacking(rc, cx, y, Math.min(o.maxW + 60, portrait ? 760 : 1120), 190, p);
      if (caps) {
        ctx.save();
        setSpacing(ctx, 20);
        fitFont(ctx, title, (s) => `500 ${s}px ${fonts.caps}`, o.maxW, portrait ? 104 : 124);
        ctx.fillStyle = paint(ctx, o.pal.heading, y, 120);
        ctx.fillText(title, cx, y);
        ctx.restore();
      } else {
        fitFont(ctx, title, (s) => `400 ${s}px ${fonts.script}`, backed ? Math.min(o.maxW, portrait ? 600 : 920) : o.maxW, backed ? 150 : 190);
        ctx.fillStyle = paint(ctx, o.pal.heading, y, 170);
        ctx.fillText(title, cx, y + 8);
      }
    },
  });

  if (o.divider) {
    items.push({ h: 56, delay: 1.0, dy: 0, draw: (y) => drawDivider(ctx, cx, y, 220, o.pal.line) });
  }

  if (spec.namesLine === "script") {
    const [a, b] = namePair(data);
    items.push({
      h: 116,
      delay: 1.3,
      dy: 20,
      draw: (y) => {
        const s = `${a} & ${b}`;
        fitFont(ctx, s, (z) => `400 ${z}px ${fonts.script}`, o.maxW, 100);
        ctx.fillStyle = paint(ctx, o.pal.names, y, 100);
        ctx.fillText(s, cx, y);
      },
    });
  } else {
    const [a, b] = fullNamePair(data);
    items.push({
      h: 88,
      delay: 1.3,
      dy: 20,
      draw: (y) => {
        const s = `${a}  &  ${b}`;
        fitFont(ctx, s, (z) => `italic 500 ${z}px ${bodyFontOf(rc, tpl)}`, o.maxW, 58);
        ctx.fillStyle = o.pal.body;
        ctx.fillText(s, cx, y);
      },
    });
  }

  if (o.date && info.valid) {
    items.push({
      h: 62,
      delay: 1.6,
      dy: 20,
      draw: (y) => {
        setSpacing(ctx, 8);
        fitFont(ctx, `${info.weekday.toUpperCase()}  ·  ${info.solar}`, (s) => `500 ${s}px ${fonts.sans}`, o.maxW, 32);
        ctx.fillStyle = o.pal.accent;
        ctx.fillText(`${info.weekday.toUpperCase()}  ·  ${info.solar}`, cx, y);
      },
    });
  }
  return items;
}

const blockHeight = (items: BlockItem[]) => items.reduce((s, i) => s + i.h, 0);

function drawBlock(rc: RenderContext, lt: number, items: BlockItem[], top: number) {
  let y = top;
  for (const it of items) {
    const p = enter(lt, it.delay, it.dur ?? 1.1);
    const cy = y + it.h / 2;
    drawEntering(rc.ctx, p, it.dy, () => {
      center(rc.ctx);
      it.draw(cy, p);
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
    drawEntering(ctx, enter(lt, 0.1, 1.5), 40, () => tpl.photoFrame(ctx, photo, ...frame, rc));
    const items = introBlock(rc, tpl, { greeting: true, divider: true, date: true, pal, cx, maxW });
    const h = blockHeight(items);
    drawBlock(rc, lt, items, portrait ? 1070 + (560 - h) / 2 : (H - h) / 2);
    return;
  }

  if (mode === "emblem" && spec.emblem) {
    const emblem = spec.emblem;
    const cy = portrait ? 650 : 400;
    const r = portrait ? 240 : 175;
    const greet = data.greeting.trim().toUpperCase();
    if (greet) {
      drawEntering(ctx, enter(lt, 0.2), 20, () => {
        center(ctx);
        setSpacing(ctx, 14);
        fitFont(ctx, greet, (s) => `500 ${s}px ${rc.fonts.sans}`, portrait ? 900 : 1200, portrait ? 28 : 30);
        ctx.fillStyle = pal.accent;
        ctx.fillText(greet, W / 2, cy - r - (portrait ? 100 : 62));
      });
    }
    drawEntering(ctx, enter(lt, 0.3, 1.4), 30, () => emblem(rc, W / 2, cy, r, photo));
    const items = introBlock(rc, tpl, { greeting: false, divider: false, date: true, pal, cx: W / 2, maxW: portrait ? 920 : 1400 });
    drawBlock(rc, lt, items, cy + r + (portrait ? 80 : 40));
    return;
  }

  if (mode === "fullbleed" && photo) {
    drawEntering(ctx, enter(lt, 0, 1.2), 0, () => {
      drawPhoto(ctx, photo, 0, 0, W, H, rc, 0.03);
      const g = ctx.createLinearGradient(0, H * (portrait ? 0.45 : 0.35), 0, H);
      g.addColorStop(0, "rgba(18,20,16,0)");
      g.addColorStop(1, "rgba(18,20,16,0.8)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });
    const light: Theme = { ...LIGHT_ON_PHOTO, ...tpl.onPhoto };
    const items = introBlock(rc, tpl, { greeting: true, divider: true, date: true, pal: light, cx: W / 2, maxW: portrait ? 920 : 1500 });
    drawBlock(rc, lt, items, H - blockHeight(items) - (portrait ? 170 : 60));
    return;
  }

  if (mode === "faded" && photo) {
    drawEntering(ctx, enter(lt, 0, 1.6), 0, () => fadedPhoto(rc, photo));
    const left = data.photoSide === "left";
    const cx = portrait ? W / 2 : left ? 1400 : 520;
    const items = introBlock(rc, tpl, { greeting: true, divider: true, date: true, pal, cx, maxW: portrait ? 920 : 820 });
    const h = blockHeight(items);
    // dọc: chữ nằm ngay dưới ảnh, chừa ~350px đáy cho hoạ tiết của mẫu
    drawBlock(rc, lt, items, portrait ? 1020 + (540 - h) / 2 : (H - h) / 2);
    return;
  }

  const items = introBlock(rc, tpl, { greeting: true, divider: true, date: true, pal, cx: W / 2, maxW: portrait ? 920 : 1400 });
  drawBlock(rc, lt, items, (H - blockHeight(items)) / 2);
}

// =====================================================================
// Cảnh 2: Lời cảm ơn
// =====================================================================

export function messageScene(rc: RenderContext, lt: number, tpl: VideoTemplate) {
  const { ctx, W, H, data, portrait, fonts } = rc;
  const pal = rc.theme;
  const cx = W / 2;
  const mid = H / 2 + (portrait ? 40 : 100);
  center(ctx);

  const bf = bodyFontOf(rc, tpl);
  const font = (size: number) => `italic 500 ${size}px ${bf}`;
  const maxW = portrait ? 880 : 1320;
  let size = portrait ? 56 : 58;
  ctx.font = font(size);
  let lines = wrapText(ctx, data.message, maxW);
  if (lines.length > (portrait ? 8 : 5)) {
    size = portrait ? 46 : 46;
    ctx.font = font(size);
    lines = wrapText(ctx, data.message, maxW + 60).slice(0, portrait ? 11 : 7);
  }
  const lh = size * 1.45;
  const top = mid - ((lines.length - 1) * lh) / 2;
  const headY = top - (portrait ? 170 : 150);

  drawEntering(ctx, enter(lt, 0.1), 20, () => tpl.ornament?.(rc, cx, headY - 110));
  drawEntering(ctx, enter(lt, 0.3), 30, () => {
    center(ctx);
    ctx.font = `400 ${portrait ? 110 : 120}px ${fonts.script}`;
    ctx.fillStyle = paint(ctx, pal.heading, headY, 120);
    ctx.fillText("Lời cảm ơn", cx, headY);
  });
  lines.forEach((line, i) => {
    drawEntering(ctx, enter(lt, 0.7 + i * 0.22, 1.2), 24, () => {
      center(ctx);
      ctx.font = font(size);
      ctx.fillStyle = pal.body;
      ctx.fillText(line, cx, top + i * lh);
    });
  });
  drawEntering(ctx, enter(lt, 1.4 + lines.length * 0.2), 0, () =>
    drawDivider(ctx, cx, Math.min(H - 110, top + lines.length * lh + 30), 220, pal.line),
  );
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
  drawEntering(ctx, enter(lt, 0.2), 24, () => {
    center(ctx);
    ctx.font = `400 ${portrait ? 120 : 130}px ${fonts.script}`;
    ctx.fillStyle = paint(ctx, pal.heading, 0, 130);
    ctx.fillText("Khoảnh khắc", textCx, portrait ? 190 : 420);
  });
  if (!portrait) {
    drawEntering(ctx, enter(lt, 0.5), 0, () => drawDivider(ctx, textCx, 530, 200, pal.line));
    const [a, b] = fullNamePair(rc.data);
    drawEntering(ctx, enter(lt, 0.7), 20, () => {
      center(ctx);
      fitFont(ctx, `${a}  &  ${b}`, (z) => `italic 500 ${z}px ${bodyFontOf(rc, tpl)}`, 760, 54);
      ctx.fillStyle = pal.body;
      ctx.fillText(`${a}  &  ${b}`, textCx, 620);
    });
  }

  // ảnh chuyển lần lượt (cross-fade)
  const p0 = enter(lt, 0, 1.2);
  photos.forEach((ph, i) => {
    const a0 = i === 0 ? 1 : clamp((lt - (i * slot - fade / 2)) / fade);
    const a1 = i === n - 1 ? 1 : clamp(((i + 1) * slot + fade / 2 - lt) / fade);
    const v = Math.min(a0, a1);
    if (v <= 0.001) return;
    ctx.save();
    ctx.globalAlpha *= v;
    ctx.translate(0, (1 - p0) * 40);
    tpl.photoFrame(ctx, ph, ...frame, rc);
    ctx.restore();
  });

  // chấm chỉ số ảnh
  const cur = clamp(Math.floor(lt / slot), 0, n - 1);
  const dotsY = portrait ? 1490 : 720;
  drawEntering(ctx, enter(lt, 0.8), 0, () => {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i === cur ? pal.accent : pal.line;
      ctx.beginPath();
      ctx.arc(textCx + (i - (n - 1) / 2) * 30, dotsY, i === cur ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
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
) {
  const { ctx, fonts } = rc;
  const f = (sz: number) => `400 ${sz}px ${fonts.script}`;
  ctx.font = f(big);
  const one = `${a}  &  ${b}`;
  ctx.fillStyle = paint(ctx, fill, cy, 260);
  if (!forceStack && ctx.measureText(one).width <= maxW) {
    ctx.fillText(one, cx, cy);
    return;
  }
  const sz = Math.min(fitFont(ctx, a, f, maxW, Math.min(big, 124)), fitFont(ctx, b, f, maxW, Math.min(big, 124)));
  const gap = sz * 0.85;
  ctx.font = f(sz);
  ctx.fillText(a, cx, cy - gap);
  ctx.fillText(b, cx, cy + gap);
  ctx.font = f(Math.round(sz * 0.65));
  ctx.fillText("&", cx, cy);
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
  ctx.fillText(info.day, 0, 6);

  ctx.fillStyle = theme.accent;
  ctx.font = `500 36px ${fonts.sans}`;
  setSpacing(ctx, 6);
  ctx.textAlign = "right";
  ctx.fillText(info.weekday.toUpperCase(), -160, 0);

  ctx.textAlign = "left";
  ctx.fillText(`THÁNG ${info.month}`, 160, -24);
  ctx.font = `600 40px ${fonts.sans}`;
  ctx.fillText(info.year, 160, 28);
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
    drawEntering(ctx, enter(lt, 0.15, 1.4), 40, () => tpl.photoFrame(ctx, photo, ...f, rc));
  }

  drawEntering(ctx, enter(lt, 0.1), 20, () => {
    center(ctx);
    setSpacing(ctx, 14);
    fitFont(ctx, eventTitle(data).toUpperCase(), (s) => `500 ${s}px ${fonts.sans}`, maxW, 32);
    ctx.fillStyle = pal.accent;
    ctx.fillText(eventTitle(data).toUpperCase(), cx, y.label);
  });

  drawEntering(ctx, enter(lt, 0.4, 1.3), 30, () => {
    center(ctx);
    drawNames(rc, a, b, cx, y.names, maxW, photo && !portrait ? 130 : 150, pal.names, false);
  });

  if (info.valid) drawEntering(ctx, enter(lt, 1.0), 24, () => drawDateBlock(rc, cx, y.date, info, k));

  if (lunar) {
    drawEntering(ctx, enter(lt, 1.4), 20, () => {
      center(ctx);
      fitFont(ctx, `(${lunar})`, (z) => `italic 500 ${z}px ${bf}`, maxW, 42);
      ctx.fillStyle = pal.body;
      ctx.fillText(`(${lunar})`, cx, y.lunar);
    });
  }
  if (detail) {
    drawEntering(ctx, enter(lt, 1.7), 20, () => {
      center(ctx);
      setSpacing(ctx, 2);
      fitFont(ctx, detail, (sz) => `400 ${sz}px ${fonts.sans}`, maxW, 32);
      ctx.fillStyle = pal.accent;
      ctx.fillText(detail, cx, y.detail);
    });
  }
}
