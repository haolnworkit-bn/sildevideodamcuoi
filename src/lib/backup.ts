"use client";

import { isEventType } from "./events";
import { getBlob, musicKey, putBlob } from "./media";
import { normalizeProject, uid, type ProjectData } from "./project";
import { TEMPLATES } from "./render/templates";

type Attachment = { name: string; mime: string; base64: string };
type Archive = { format: "taoslidevideo-backup"; version: 1; project: ProjectData; photos: Record<string, Attachment>; music?: Attachment };
const MAX_ARCHIVE_BYTES = 60 * 1024 * 1024;

async function encodeBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function decodeBlob(a: Attachment): Blob {
  if (!a || typeof a.base64 !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(a.base64)) throw new Error("Tệp đính kèm không hợp lệ");
  const binary = atob(a.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes.buffer as ArrayBuffer], { type: a.mime || "application/octet-stream" });
}

export async function createProjectBackup(project: ProjectData): Promise<Blob> {
  const photos: Record<string, Attachment> = {};
  for (const item of project.photos) {
    const blob = await getBlob(item.id);
    if (!blob) throw new Error("Không tìm thấy ảnh trong trình duyệt: " + item.id);
    photos[item.id] = { name: item.id, mime: blob.type, base64: await encodeBlob(blob) };
  }
  const song = await getBlob(musicKey(project.id));
  const music = song ? { name: project.music.name, mime: song.type, base64: await encodeBlob(song) } : undefined;
  const archive: Archive = { format: "taoslidevideo-backup", version: 1, project, photos, music };
  return new Blob([JSON.stringify(archive)], { type: "application/json" });
}

export async function restoreProjectBackup(file: File): Promise<ProjectData> {
  if (file.size > MAX_ARCHIVE_BYTES) throw new Error("Bản sao lưu vượt quá giới hạn 60 MB");
  const archive = JSON.parse(await file.text()) as Archive;
  const raw = archive?.project;
  if (archive?.format !== "taoslidevideo-backup" || archive.version !== 1 ||
      !raw || !isEventType(raw.eventType) || !TEMPLATES.some(t => t.id === raw.templateId) ||
      !Array.isArray(raw.photos) || raw.photos.length > 6 || !archive.photos ||
      raw.photos.some(p => !p || typeof p.id !== "string" || !archive.photos[p.id])) {
    throw new Error("Bản sao lưu không đúng định dạng hoặc có dữ liệu không hợp lệ");
  }
  const project = normalizeProject({ ...raw, id: uid() });
  const written: string[] = [];
  try {
    const photos = [];
    for (const p of project.photos) {
      const id = uid();
      const blob = decodeBlob(archive.photos[p.id]);
      if (!blob.type.startsWith("image/")) throw new Error("Dữ liệu ảnh không hợp lệ");
      await putBlob(id, blob);
      written.push(id);
      photos.push({ id, focusY: Number.isFinite(p.focusY) ? Math.max(0, Math.min(1, p.focusY)) : 0.4 });
    }
    if (archive.music) {
      const blob = decodeBlob(archive.music);
      if (!blob.type.startsWith("audio/")) throw new Error("Dữ liệu âm thanh không hợp lệ");
      await putBlob(musicKey(project.id), blob);
      written.push(musicKey(project.id));
    } else project.music.enabled = false;
    return { ...project, photos };
  } catch (err) {
    const { deleteBlob } = await import("./media");
    await Promise.all(written.map(id => deleteBlob(id)));
    throw err;
  }
}
