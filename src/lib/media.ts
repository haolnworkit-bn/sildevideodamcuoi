"use client";

/**
 * Kho ảnh & nhạc trên trình duyệt (IndexedDB) — chứa được nhiều ảnh/nhạc mà localStorage không đủ.
 * Khi có server, thay bằng upload lên object storage.
 */
const DB_NAME = "tsv-media";
const STORE = "blobs";

let dbp: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbp;
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = fn(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const putBlob = (id: string, blob: Blob) => tx("readwrite", (s) => s.put(blob, id)).then(() => undefined);
export const getBlob = (id: string) => tx<Blob | undefined>("readonly", (s) => s.get(id)).catch(() => undefined);
export const deleteBlob = (id: string) => tx("readwrite", (s) => s.delete(id)).then(() => undefined).catch(() => undefined);

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    await img.decode().catch(() => undefined);
    return img;
  } finally {
    // giữ URL đến khi ảnh đã decode xong; trình duyệt vẫn giữ bitmap
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/** Thu nhỏ ảnh tải lên (tối đa 1920px) & nén JPEG để nhẹ khi lưu và vẽ */
export async function prepareUpload(file: Blob): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, 1920 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Không xử lý được ảnh"))), "image/jpeg", 0.88));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const musicKey = (projectId: string) => `music:${projectId}`;
