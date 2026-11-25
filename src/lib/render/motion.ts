/**
 * CHUYỂN ĐỘNG CHỮ (motion v2, 2026-11-25) — áp cho MỌI mẫu, không mẫu nào phải tự viết.
 *
 * Mọi chữ trong cảnh đều vẽ qua `drawText` (layout.ts). Trước khi vẽ một phần tử, cảnh gọi
 * `drawReveal(rc, r, { mode }, fn)`: hàm này ghi trạng thái hiện chữ vào `rc.reveal`, và `drawText`
 * dựa vào đó để biết vẽ thế nào — vì nó biết CHÍNH XÁC chữ, vị trí, độ rộng.
 *
 *   wipe  : hiện như viết tay — quét từ trái sang phải, mép mềm (tiêu đề script, tên). Sau đó có vệt sáng lướt qua.
 *   chars : từng ký tự lần lượt hiện + nhô lên (chữ in hoa giãn cách: lời chào, "LỄ ĂN HỎI", ngày).
 *   words : từng từ lần lượt hiện (dòng họ tên nghiêng, lời cảm ơn, chú thích).
 *   grow  : đường kẻ/hoạ tiết mọc từ giữa ra hai bên.
 *   photo : khung ảnh phóng nhẹ vào chỗ (0.94 → 1) + hiện dần.
 *   plain : mờ dần + trượt lên (kiểu cũ).
 *
 * Tất định theo thời gian (không random) → preview, trình chiếu, MP4 giống hệt nhau và lặp liền mạch.
 */
import type { RenderContext } from "./types";

// (định nghĩa lại cục bộ để helpers.ts import được file này mà không vòng lặp import)
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

export type RevealMode = "plain" | "wipe" | "chars" | "words" | "grow" | "photo";

export interface RevealState {
  mode: RevealMode;
  /** Tiến độ THÔ 0..1 của phần tử (chưa ease) */
  r: number;
}

const easeOutBack = (x: number) => {
  const c = 1.4;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

/** Tiến độ thô (tuyến tính) của phần tử bắt đầu ở `delay`, kéo dài `dur` giây */
export function enterRaw(lt: number, delay: number, dur = 1.1): number {
  return clamp((lt - delay) / dur);
}

/** Thời lượng hợp lý theo kiểu hiện (chữ từng ký tự cần lâu hơn mờ dần) */
export function revealDur(mode: RevealMode, base = 1.1): number {
  if (mode === "wipe") return Math.max(base, 1.5);
  if (mode === "chars") return Math.max(base, 1.4);
  if (mode === "words") return Math.max(base, 1.3);
  return base;
}

interface RevealOpts {
  mode: RevealMode;
  /** Dịch lên khi hiện (px) — chỉ áp cho plain/wipe/grow/photo */
  dy?: number;
  /** "Chạy vào" theo chiều ngang: bắt đầu lệch dx px rồi lướt về chỗ (áp cho mọi kiểu) */
  dx?: number;
  /** Tâm của phần tử (grow, photo) */
  cx?: number;
  cy?: number;
  /** Nửa bề rộng tối đa (grow) */
  half?: number;
}

/** Vẽ một phần tử cảnh với hiệu ứng hiện tương ứng. `r` = tiến độ thô 0..1 */
export function drawReveal(rc: RenderContext, r: number, o: RevealOpts, fn: () => void) {
  if (r <= 0.001) return;
  const { ctx } = rc;
  const e = easeOutCubic(r);
  const prev = rc.reveal;
  rc.reveal = { mode: o.mode, r };
  ctx.save();
  if (o.dx) ctx.translate(o.dx * Math.pow(1 - clamp(r * 1.15), 4), 0);
  switch (o.mode) {
    case "plain":
      ctx.globalAlpha *= e;
      ctx.translate(0, (1 - e) * (o.dy ?? 20));
      break;
    case "wipe":
      // mép quét lo phần hiện chữ; phần không phải chữ (dải lụa, vạch kẻ…) mờ vào nhanh; thêm chút nhô lên
      ctx.globalAlpha *= clamp(r * 2.5);
      ctx.translate(0, (1 - e) * Math.min(14, o.dy ?? 14));
      break;
    case "chars":
    case "words":
      // từng ký tự/từ tự hiện trong drawText; phần không phải chữ mờ vào nhanh
      ctx.globalAlpha *= clamp(r * 2.5);
      break;
    case "grow": {
      const half = (o.half ?? rc.W / 2) * easeOutCubic(r) + 2;
      const cx = o.cx ?? rc.W / 2;
      ctx.globalAlpha *= clamp(r * 3);
      ctx.beginPath();
      ctx.rect(cx - half, -rc.H, half * 2, rc.H * 3);
      ctx.clip();
      break;
    }
    case "photo": {
      const s = 0.94 + 0.06 * easeOutBack(clamp(r * 1.05));
      const cx = o.cx ?? rc.W / 2;
      const cy = o.cy ?? rc.H / 2;
      ctx.globalAlpha *= clamp(r * 1.6);
      ctx.translate(cx, cy + (1 - e) * (o.dy ?? 24));
      ctx.scale(s, s);
      ctx.translate(-cx, -cy);
      break;
    }
  }
  fn();
  ctx.restore();
  rc.reveal = prev;
}

// ----------------------------------------------------------------------------------------
// Vẽ chữ có hiệu ứng (gọi từ drawText). Trả về true nếu đã tự vẽ.
// ----------------------------------------------------------------------------------------

/** Mép trái (theo advance) của chữ với textAlign hiện tại */
function startX(ctx: CanvasRenderingContext2D, x: number, width: number): number {
  const a = ctx.textAlign;
  const rtl = ctx.direction === "rtl";
  if (a === "center") return x - width / 2;
  if (a === "right" || (a === "end" && !rtl) || (a === "start" && rtl)) return x - width;
  return x;
}

/** Vẽ chữ trong dải [x0, x1] với độ đậm `a` */
function bandFill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, x0: number, x1: number, top: number, h: number, a: number) {
  if (a <= 0.002 || x1 <= x0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.beginPath();
  ctx.rect(x0, top, x1 - x0, h);
  ctx.clip();
  ctx.fillText(text, x, y);
  ctx.restore();
}

const FEATHER_BANDS = 3; // ít dải = ít lần fillText mỗi khung (mỗi dải 1 lần vẽ lại chữ)

/** Quét từ trái sang phải với mép mềm (giả lập viết tay) */
function wipeText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, r: number) {
  const m = ctx.measureText(text);
  const left = x - m.actualBoundingBoxLeft - 4;
  const right = x + m.actualBoundingBoxRight + 4;
  const top = y - m.actualBoundingBoxAscent - 12;
  const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + 24;
  const w = right - left;
  const F = Math.max(40, w * 0.18); // độ mềm của mép
  // mép đi từ left - F tới right + F (ease-in-out cho giống nét bút)
  const k = r < 0.5 ? 2 * r * r : 1 - Math.pow(-2 * r + 2, 2) / 2;
  const edge = left - F + k * (w + 2 * F);
  bandFill(ctx, text, x, y, left - 2, edge - F, top, h, 1);
  const bw = F / FEATHER_BANDS;
  for (let i = 0; i < FEATHER_BANDS; i++) {
    const a = 1 - (i + 0.5) / FEATHER_BANDS;
    bandFill(ctx, text, x, y, Math.max(left - 2, edge - F + i * bw), edge - F + (i + 1) * bw + 0.5, top, h, a);
  }
}

/** Chia chữ thành đơn vị (ký tự hoặc từ, giữ khoảng trắng đi kèm) */
function unitsOf(text: string, byWord: boolean): string[] {
  if (!byWord) return Array.from(text.normalize("NFC"));
  return text.match(/\S+\s*|\s+/g) ?? [text];
}

/** Từng đơn vị lần lượt hiện + nhô lên */
function staggerText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, r: number, byWord: boolean) {
  const units = unitsOf(text, byWord);
  const n = units.filter((u) => u.trim()).length || 1;
  const full = ctx.measureText(text).width;
  const x0 = startX(ctx, x, full);
  const size = Number(/([\d.]+)px/.exec(ctx.font)?.[1] ?? 32);
  const rise = size * (byWord ? 0.35 : 0.45);
  const spread = byWord ? 0.55 : 0.6; // phần thời gian dành cho so le
  const align = ctx.textAlign;
  ctx.save();
  ctx.textAlign = "left";
  let prefix = "";
  let idx = 0;
  for (const u of units) {
    const ux = x0 + (prefix ? ctx.measureText(prefix).width : 0);
    prefix += u;
    if (!u.trim()) continue;
    const st = (idx / Math.max(1, n - 1)) * spread;
    idx++;
    const p = clamp((r - st) / (1 - spread));
    if (p <= 0.001) continue;
    const e = easeOutCubic(p);
    ctx.save();
    ctx.globalAlpha *= e;
    ctx.fillText(u, ux, y + (1 - e) * rise);
    ctx.restore();
  }
  ctx.restore();
  ctx.textAlign = align;
}

/** Vệt sáng lướt qua chữ (sau khi chữ đã hiện xong). s = 0..1 vị trí vệt */
function shineText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, s: number) {
  const m = ctx.measureText(text);
  const left = x - m.actualBoundingBoxLeft;
  const right = x + m.actualBoundingBoxRight;
  const top = y - m.actualBoundingBoxAscent - 10;
  const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + 20;
  const B = Math.max(50, h * 0.9); // nửa bề rộng vệt
  const c = left - B + s * (right - left + 2 * B);
  // KHÔNG dùng ctx.filter (brightness) — bộ lọc canvas rất chậm, làm preview giật. Phủ chữ màu sáng trong vài dải.
  const K = 2;
  ctx.save();
  ctx.fillStyle = "rgba(255,250,232,1)";
  for (let i = -K; i < K; i++) {
    const a = 1 - Math.abs(i + 0.5) / K;
    bandFill(ctx, text, x, y, c + (i * B) / K, c + ((i + 1) * B) / K + 0.5, top, h, a * 0.5);
  }
  ctx.restore();
}

/**
 * Vẽ chữ theo trạng thái `rc.reveal`. Trả về false nếu không có hiệu ứng (drawText tự fillText).
 */
export function revealText(rc: RenderContext, text: string, x: number, y: number): boolean {
  const st = rc.reveal;
  if (!st || rc.probe) return false;
  const { ctx } = rc;
  if (st.r < 1) {
    if (st.mode === "wipe") wipeText(ctx, text, x, y, st.r);
    else if (st.mode === "chars") staggerText(ctx, text, x, y, st.r, false);
    else if (st.mode === "words") staggerText(ctx, text, x, y, st.r, true);
    else return false;
    return true;
  }
  ctx.fillText(text, x, y);
  // vệt sáng chỉ trên chữ lớn (tiêu đề, tên) và chỉ khi cảnh đang ở pha "lướt sáng"
  const s = rc.shine ?? -1;
  if (st.mode === "wipe" && s > 0 && s < 1) shineText(ctx, text, x, y, s);
  return true;
}

// ----------------------------------------------------------------------------------------
// Chuyển cảnh & "hơi thở" của cảnh (gọi từ runScenes)
// ----------------------------------------------------------------------------------------

/** Pha vệt sáng 0..1 (ngoài khoảng = không vẽ). Nhiều cảnh: lướt 1 lần ở giây 2.5–3.7 của cảnh.
 *  1 cảnh (chữ đứng yên): lướt theo thời gian toàn cục, 2 lần mỗi vòng → vẫn lặp liền mạch. */
export function shinePhase(lt: number, single: boolean, t: number, D: number): number {
  if (single) {
    const f = ((t / D) * 2) % 1; // 2 lần / vòng
    return f / 0.3; // lướt trong 30% đầu mỗi nửa vòng
  }
  return (lt - 2.5) / 1.2;
}
