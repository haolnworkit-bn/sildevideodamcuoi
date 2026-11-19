"use client";

import { isEventType } from "./events";
import { normalizeProject, type ProjectData } from "./project";

const DRAFT_KEY = "tsv:draft";
/** Bản cũ lưu 1 ảnh dạng dataURL trong localStorage — chỉ còn dùng để chuyển sang IndexedDB */
export const LEGACY_PHOTO_KEY = "tsv:draft-photo";

export function loadDraft(): ProjectData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as ProjectData & { photoFocusY?: number };
    return d && typeof d.id === "string" && isEventType(d.eventType) ? normalizeProject(d) : null;
  } catch {
    return null;
  }
}

export function saveDraft(d: ProjectData) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* bộ nhớ đầy / chế độ ẩn danh */
  }
}

export function takeLegacyPhoto(): string | null {
  try {
    const v = localStorage.getItem(LEGACY_PHOTO_KEY);
    if (v) localStorage.removeItem(LEGACY_PHOTO_KEY);
    return v;
  } catch {
    return null;
  }
}
