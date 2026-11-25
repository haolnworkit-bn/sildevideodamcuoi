/**
 * Hiện phần tử trong cảnh. Đã THỬ hiệu ứng chữ nâng cao (viết tay, từng ký tự/từ, vệt sáng, chữ chạy vào,
 * camera tiến chậm — 2026-11-25) nhưng chủ dự án thấy giật → đưa về kiểu cũ: mờ dần + nhô lên.
 * Giữ tên RevealMode để scenes.ts không phải đổi nhiều; mọi kiểu hiện giờ vẽ giống nhau.
 */
import type { RenderContext } from "./types";

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

export type RevealMode = "plain" | "wipe" | "chars" | "words" | "grow" | "photo";

/** Tiến độ thô (tuyến tính) của phần tử bắt đầu ở `delay`, kéo dài `dur` giây */
export function enterRaw(lt: number, delay: number, dur = 1.1): number {
  return clamp((lt - delay) / dur);
}

/** Thời lượng hiện (kiểu cũ: như nhau cho mọi phần tử) */
export function revealDur(_mode: RevealMode, base = 1.1): number {
  return base;
}

interface RevealOpts {
  mode: RevealMode;
  /** Dịch lên khi hiện (px) */
  dy?: number;
  dx?: number;
  cx?: number;
  cy?: number;
  half?: number;
}

/** Vẽ một phần tử: mờ dần vào + nhô lên `dy` px. `r` = tiến độ thô 0..1 */
export function drawReveal(rc: RenderContext, r: number, o: RevealOpts, fn: () => void) {
  if (r <= 0.001) return;
  const { ctx } = rc;
  const e = easeOutCubic(r);
  ctx.save();
  ctx.globalAlpha *= e;
  ctx.translate(0, (1 - e) * (o.dy ?? 20));
  fn();
  ctx.restore();
}
