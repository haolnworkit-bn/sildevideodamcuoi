/**
 * Vùng an toàn + "đầu dò" bố cục chữ.
 *
 * - SAFE: khung chữ không được vượt ra ngoài (chừa mép cho TV overscan / viền màn hình).
 * - MIN_PX: cỡ chữ tối thiểu theo vai trò để còn đọc được trên TV.
 * - Khi `rc.probe` được bật (chỉ trang /dev/layout), mọi chữ vẽ qua `drawText` được ghi lại khung bao
 *   (đo bằng measureText, đã quy về toạ độ sân khấu) để kiểm tra tự động: tràn vùng an toàn, chữ quá nhỏ,
 *   chữ đè chữ, chữ đè khung ảnh. Không bật probe thì drawText chỉ là fillText.
 */
import { revealText } from "./motion";
import type { RenderContext } from "./types";

export type Box = { x0: number; y0: number; x1: number; y1: number };

/** Vai trò chữ — quyết định cỡ tối thiểu */
export type TextRole =
  | "greeting" // LỜI CHÀO
  | "title" // tiêu đề lễ (lớn)
  | "names" // tên cô dâu chú rể (lớn)
  | "namesLine" // dòng họ tên nhỏ dưới tiêu đề
  | "date" // dòng ngày / khối ngày
  | "lunar"
  | "detail" // giờ · địa điểm
  | "label" // nhãn nhỏ (tên lễ in hoa)
  | "heading" // "Lời cảm ơn", "Khoảnh khắc"
  | "message";

/** Mép an toàn: 5% mỗi cạnh */
export const SAFE_MARGIN = 0.05;

export function safeBox(W: number, H: number): Box {
  const m = SAFE_MARGIN;
  return { x0: W * m, y0: H * m, x1: W * (1 - m), y1: H * (1 - m) };
}

/** Cỡ chữ tối thiểu (px trên sân khấu 1920×1080 / 1080×1920) */
export const MIN_PX: Record<TextRole, number> = {
  greeting: 22,
  label: 22,
  date: 24,
  detail: 22,
  lunar: 28,
  namesLine: 30,
  message: 34,
  heading: 70,
  title: 60,
  names: 48,
};

export interface ProbeText extends Box {
  role: TextRole;
  text: string;
  px: number;
  scene: string;
}

export interface ProbeRect extends Box {
  kind: "photo" | "emblem";
  scene: string;
}

export interface LayoutProbe {
  /** tỉ lệ canvas thật / sân khấu (renderFrame điền) */
  scale: number;
  /** cảnh đang vẽ (runScenes điền) */
  scene: string;
  texts: ProbeText[];
  rects: ProbeRect[];
}

export function createProbe(): LayoutProbe {
  return { scale: 1, scene: "", texts: [], rects: [] };
}

function toStage(rc: RenderContext, x: number, y: number): [number, number] {
  const m = rc.ctx.getTransform();
  const s = rc.probe?.scale ?? 1;
  return [(m.a * x + m.c * y + m.e) / s, (m.b * x + m.d * y + m.f) / s];
}

function boxOf(rc: RenderContext, x0: number, y0: number, x1: number, y1: number): Box {
  const pts = [toStage(rc, x0, y0), toStage(rc, x1, y0), toStage(rc, x0, y1), toStage(rc, x1, y1)];
  return {
    x0: Math.min(...pts.map((p) => p[0])),
    y0: Math.min(...pts.map((p) => p[1])),
    x1: Math.max(...pts.map((p) => p[0])),
    y1: Math.max(...pts.map((p) => p[1])),
  };
}

/** fillText + (khi bật probe) ghi khung bao chữ */
export function drawText(rc: RenderContext, role: TextRole, text: string, x: number, y: number) {
  const { ctx } = rc;
  if (!revealText(rc, text, x, y)) ctx.fillText(text, x, y);
  const probe = rc.probe;
  if (!probe || !text.trim()) return;
  const m = ctx.measureText(text);
  const box = boxOf(rc, x - m.actualBoundingBoxLeft, y - m.actualBoundingBoxAscent, x + m.actualBoundingBoxRight, y + m.actualBoundingBoxDescent);
  const t = ctx.getTransform();
  const k = Math.hypot(t.a, t.b) / probe.scale;
  const size = Number(/([\d.]+)px/.exec(ctx.font)?.[1] ?? 0);
  probe.texts.push({ ...box, role, text, px: Math.round(size * k * 10) / 10, scene: probe.scene });
}

/** Ghi vùng ảnh cưới / biểu tượng mà chữ không được đè lên */
export function probeRect(rc: RenderContext, kind: ProbeRect["kind"], x: number, y: number, w: number, h: number) {
  if (!rc.probe) return;
  rc.probe.rects.push({ ...boxOf(rc, x, y, x + w, y + h), kind, scene: rc.probe.scene });
}

// ---------------------------------------------------------------------
// Xếp chữ: thu nhỏ tới ngưỡng → xuống 2 dòng → (bất đắc dĩ) thu tiếp
// ---------------------------------------------------------------------

export interface FitLines {
  lines: string[];
  size: number;
}

/** Chiều rộng thật của chữ (khung glyph, gồm cả nét nghiêng/nét uốn chồm ra ngoài advance) */
export function inkWidth(ctx: CanvasRenderingContext2D, text: string): number {
  const m = ctx.measureText(text);
  // chữ căn giữa: letterSpacing thêm khoảng trống sau ký tự cuối → glyph lệch khỏi tâm;
  // bề rộng cần dành = 2 × nửa lớn hơn (tính từ điểm neo)
  if (ctx.textAlign === "center") return Math.max(m.width, 2 * Math.max(m.actualBoundingBoxLeft, m.actualBoundingBoxRight));
  return Math.max(m.width, m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
}

/** Như fitFont nhưng đo theo khung glyph thật (nét uốn của font script không lố khỏi maxW) */
export function fitInk(ctx: CanvasRenderingContext2D, text: string, font: (size: number) => string, maxW: number, size: number, min = size * 0.35): number {
  let s = size;
  ctx.font = font(s);
  while (s > min && inkWidth(ctx, text) > maxW) {
    s -= 2;
    ctx.font = font(s);
  }
  return s;
}

/** Ngắt 1 chuỗi thành 2 dòng cân nhau nhất (theo từ). `joiner` = vị trí ưu tiên (vd " & ") */
function splitBalanced(ctx: CanvasRenderingContext2D, text: string, joiner?: string): [string, string] | null {
  if (joiner && text.includes(joiner)) {
    const i = text.indexOf(joiner);
    return [text.slice(0, i).trim(), text.slice(i).trim()];
  }
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return null;
  let best: [string, string] | null = null;
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const w = Math.max(inkWidth(ctx, a), inkWidth(ctx, b));
    if (w < bestW) {
      bestW = w;
      best = [a, b];
    }
  }
  return best;
}

/**
 * Xếp 1 dòng chữ vào maxW: giảm cỡ từ `size` tới `min`; vẫn tràn → 2 dòng (ở cỡ lớn nhất vừa, ≤ size);
 * 2 dòng vẫn tràn ở `min` → tiếp tục giảm (tối đa tới min×0.6) — tránh tràn khỏi màn hình.
 * Đặt ctx.font = font(size trả về) trước khi return.
 */
export function fitLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: (size: number) => string,
  maxW: number,
  size: number,
  min: number,
  joiner?: string,
): FitLines {
  const fits = (lines: string[], s: number) => {
    ctx.font = font(s);
    return lines.every((l) => inkWidth(ctx, l) <= maxW);
  };
  for (let s = size; s >= min; s -= 2) if (fits([text], s)) return { lines: [text], size: s };
  ctx.font = font(min);
  const two = splitBalanced(ctx, text, joiner);
  if (!two) {
    let s = min;
    while (s > min * 0.6 && !fits([text], s)) s -= 2;
    ctx.font = font(s);
    return { lines: [text], size: s };
  }
  for (let s = size; s >= min * 0.6; s -= 2) if (fits(two, s)) return { lines: two, size: s };
  const s = Math.round(min * 0.6);
  ctx.font = font(s);
  return { lines: two, size: s };
}

/**
 * Đoạn chữ nhiều dòng: tách theo `sep` (vd "  ·  ") rồi ngắt theo từ, giảm cỡ từ size tới min
 * cho tới khi ≤ maxLines dòng; không được thì ở cỡ min cho phép nhiều dòng hơn (không bao giờ tràn ngang).
 */
export function fitParagraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: (size: number) => string,
  maxW: number,
  size: number,
  min: number,
  maxLines: number,
  sep?: string,
): FitLines {
  const wrap = () => {
    const out: string[] = [];
    for (const seg of sep ? text.split(sep) : [text]) {
      let line = "";
      for (const w of seg.trim().split(/\s+/).filter(Boolean)) {
        const test = line ? `${line} ${w}` : w;
        if (line && inkWidth(ctx, test) > maxW) {
          out.push(line);
          line = w;
        } else line = test;
      }
      if (line) out.push(line);
    }
    return out;
  };
  for (let s = size; s >= min; s -= 2) {
    ctx.font = font(s);
    // vừa 1 dòng thì giữ nguyên, không tách ở `sep`
    if (inkWidth(ctx, text) <= maxW) return { lines: [text], size: s };
    if (s > min) continue;
  }
  for (let s = size; s >= min; s -= 2) {
    ctx.font = font(s);
    const lines = wrap();
    if (lines.length <= maxLines && lines.every((l) => inkWidth(ctx, l) <= maxW)) return { lines, size: s };
  }
  ctx.font = font(min);
  return { lines: wrap(), size: min };
}

/** Toạ độ y tương đối (so với tâm khối) của từng dòng khi xếp chồng, khoảng cách theo khung glyph thật */
export function stackLines(ctx: CanvasRenderingContext2D, lines: string[], gap: number): { offsets: number[]; height: number } {
  const ms = lines.map((l) => ctx.measureText(l));
  const ys: number[] = [0];
  for (let i = 1; i < lines.length; i++) {
    const step = Math.max(ms[i - 1].actualBoundingBoxDescent + ms[i].actualBoundingBoxAscent + gap, gap * 4);
    ys.push(ys[i - 1] + step);
  }
  const top = ys[0] - ms[0].actualBoundingBoxAscent;
  const bottom = ys[ys.length - 1] + ms[ms.length - 1].actualBoundingBoxDescent;
  const mid = (top + bottom) / 2;
  return { offsets: ys.map((y) => y - mid), height: bottom - top };
}

// ---------------------------------------------------------------------
// Kiểm tra
// ---------------------------------------------------------------------

export interface LayoutIssue {
  kind: "outside-safe" | "too-small" | "text-overlap" | "photo-overlap";
  scene: string;
  detail: string;
}

const area = (a: Box, b: Box) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

export function auditProbe(probe: LayoutProbe, W: number, H: number): LayoutIssue[] {
  const out: LayoutIssue[] = [];
  const safe = safeBox(W, H);
  const short = (s: string) => (s.length > 28 ? `${s.slice(0, 26)}…` : s);
  for (const t of probe.texts) {
    const over = Math.max(safe.x0 - t.x0, t.x1 - safe.x1, safe.y0 - t.y0, t.y1 - safe.y1);
    if (over > 1) out.push({ kind: "outside-safe", scene: t.scene, detail: `${t.role} "${short(t.text)}" lố ${Math.round(over)}px` });
    if (t.px < MIN_PX[t.role]) out.push({ kind: "too-small", scene: t.scene, detail: `${t.role} "${short(t.text)}" ${t.px}px < ${MIN_PX[t.role]}px` });
  }
  for (let i = 0; i < probe.texts.length; i++) {
    const a = probe.texts[i];
    for (let j = i + 1; j < probe.texts.length; j++) {
      const b = probe.texts[j];
      if (a.scene !== b.scene) continue;
      // chấp nhận chạm nhẹ (dấu tiếng Việt / nét script chồm lên vài px)
      const ov = area(a, b);
      const minH = Math.min(a.y1 - a.y0, b.y1 - b.y0);
      if (ov > minH * 6 && ov > 0.04 * Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0)))
        out.push({ kind: "text-overlap", scene: a.scene, detail: `${a.role} "${short(a.text)}" ↔ ${b.role} "${short(b.text)}"` });
    }
    for (const r of probe.rects) {
      if (r.scene !== a.scene) continue;
      if (area(a, r) > 0.02 * (a.x1 - a.x0) * (a.y1 - a.y0))
        out.push({ kind: "photo-overlap", scene: a.scene, detail: `${a.role} "${short(a.text)}" đè ${r.kind}` });
    }
  }
  return out;
}
