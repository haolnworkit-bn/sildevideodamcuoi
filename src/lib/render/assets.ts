/**
 * Ảnh rời (PNG/WebP nền trong suốt) dùng làm lớp trang trí cho mẫu.
 * - Mẫu gọi `registerAsset(url)` ở cấp module → trình duyệt bắt đầu tải ngay.
 * - `getAsset(url)` trả ảnh khi đã sẵn sàng, chưa có/lỗi/404 → null (mẫu tự vẽ bằng code thay thế).
 * - `ensureAssetsLoaded()` được `ensureFontsLoaded()` gọi kèm → preview/xuất video luôn đợi ảnh tải xong.
 */
type Entry = { img: HTMLImageElement | null; ready: Promise<void> };
const cache = new Map<string, Entry>();

export function registerAsset(url: string): void {
  if (typeof window === "undefined" || cache.has(url)) return;
  const e: Entry = { img: null, ready: Promise.resolve() };
  const img = new Image();
  e.ready = new Promise<void>((resolve) => {
    img.onload = () => {
      e.img = img;
      resolve();
    };
    img.onerror = () => resolve(); // thiếu file → dùng bản vẽ code
  });
  img.src = url;
  cache.set(url, e);
}

export function getAsset(url: string): HTMLImageElement | null {
  return cache.get(url)?.img ?? null;
}

export function ensureAssetsLoaded(): Promise<void> {
  return Promise.all([...cache.values()].map((e) => e.ready)).then(() => undefined);
}
