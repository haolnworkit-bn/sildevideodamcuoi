import { MAX_PHOTOS, type ProjectData } from "../project";
import type { SceneType, Timeline } from "./types";

/** Độ dài mỗi ảnh trong cảnh "Khoảnh khắc" (giây) */
export const ALBUM_SLOT = 2.6;

/** Độ dài khi video chỉ có 1 cảnh (chữ đứng yên, chỉ nền/hạt chuyển động) */
export const SINGLE_SCENE = 8;

/** Số cảnh chữ (không tính Khoảnh khắc): 1 = Tên & ngày, 2 = + Giới thiệu, 3 = + Lời cảm ơn */
export function textSceneCount(scenes: ProjectData["scenes"]): 1 | 2 | 3 {
  if (!scenes.intro) return 1;
  return scenes.message ? 3 : 2;
}

export function scenesForCount(scenes: ProjectData["scenes"], n: 1 | 2 | 3): ProjectData["scenes"] {
  return { ...scenes, intro: n >= 2, message: n === 3 };
}

/**
 * Dựng dòng thời gian theo nội dung: luôn có Tên & ngày; tuỳ chọn Giới thiệu, Lời cảm ơn,
 * và cảnh Khoảnh khắc khi có từ 2 ảnh.
 */
export function computeTimeline(data: ProjectData, photoCount: number): Timeline {
  const parts: Array<[SceneType, string, number]> = [];
  if (data.scenes.intro) parts.push(["intro", "Giới thiệu", 6.6]);
  if (data.scenes.intro && data.scenes.message) parts.push(["message", "Lời cảm ơn", 6.7]);
  const n = Math.min(photoCount, MAX_PHOTOS);
  if (data.scenes.album && n >= 2) parts.push(["album", "Khoảnh khắc", n * ALBUM_SLOT]);
  parts.push(["names", "Tên & ngày lễ", parts.length ? 6.7 : SINGLE_SCENE]);

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
