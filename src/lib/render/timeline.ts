import { MAX_PHOTOS, type ProjectData } from "../project";
import type { SceneType, Timeline } from "./types";

/** Độ dài mỗi ảnh trong cảnh "Khoảnh khắc" (giây) */
export const ALBUM_SLOT = 2.6;

/**
 * Dựng dòng thời gian theo nội dung: luôn có Giới thiệu + Tên & ngày,
 * tuỳ chọn Lời cảm ơn, và cảnh Khoảnh khắc khi có từ 2 ảnh.
 */
export function computeTimeline(data: ProjectData, photoCount: number): Timeline {
  const parts: Array<[SceneType, string, number]> = [["intro", "Giới thiệu", 6.6]];
  if (data.scenes.message) parts.push(["message", "Lời cảm ơn", 6.7]);
  const n = Math.min(photoCount, MAX_PHOTOS);
  if (data.scenes.album && n >= 2) parts.push(["album", "Khoảnh khắc", n * ALBUM_SLOT]);
  parts.push(["names", "Tên & ngày lễ", 6.7]);

  let t = 0;
  const scenes = parts.map(([type, label, len]) => {
    const s = { type, label, start: t, end: t + len };
    t += len;
    return s;
  });
  return { duration: Math.round(t * 30) / 30, scenes };
}

export function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, "0")}`;
}
