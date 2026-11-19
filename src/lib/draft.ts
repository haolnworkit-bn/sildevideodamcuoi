"use client";

import { isEventType } from "./events";
import { normalizeProject, type ProjectData } from "./project";

const DRAFT_KEY = "tsv:draft";
const PHOTO_KEY = "tsv:draft-photo";

export function loadDraft(): ProjectData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as ProjectData;
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

export function loadDraftPhoto(): string | null {
  try {
    return localStorage.getItem(PHOTO_KEY);
  } catch {
    return null;
  }
}

export function saveDraftPhoto(dataUrl: string | null) {
  try {
    if (dataUrl) localStorage.setItem(PHOTO_KEY, dataUrl);
    else localStorage.removeItem(PHOTO_KEY);
  } catch {
    /* ảnh quá lớn cho localStorage → chỉ giữ trong phiên */
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Thu nhỏ ảnh tải lên (tối đa 1920px) & nén JPEG để nhẹ khi lưu và vẽ */
export async function prepareUpload(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, 1920 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}
