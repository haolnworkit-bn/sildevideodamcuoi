/**
 * Ảnh rời (PNG/WebP nền trong suốt) dùng làm lớp trang trí cho mẫu.
 * - Ảnh khai báo trong src/config/template-assets.ts (kể cả ảnh mẫu dùng trong code, qua trường `preload`)
 *   được đăng ký khi import templates/index.ts → trình duyệt bắt đầu tải ngay.
 * - `getAsset(url)` trả ảnh khi đã sẵn sàng; chưa có/lỗi/404 → null (mẫu tự vẽ phương án thay thế).
 *   Nếu url CHƯA được khai báo, getAsset tự đăng ký để lần vẽ sau có ảnh, và cảnh báo ở môi trường dev
 *   (vì khi xuất video, khung đầu có thể thiếu ảnh — hãy thêm url vào `preload` của mẫu).
 * - `ensureAssetsLoaded()` được `ensureFontsLoaded()` gọi kèm → preview/xuất video đợi ảnh tải xong.
 */
type Entry = { img: HTMLImageElement | null; ready: Promise<void>; failed: boolean };
const cache = new Map<string, Entry>();

export function registerAsset(url: string): void {
  if (typeof window === "undefined" || cache.has(url)) return;
  const e: Entry = { img: null, ready: Promise.resolve(), failed: false };
  const img = new Image();
  e.ready = new Promise<void>((resolve) => {
    img.onload = () => {
      e.img = img;
      resolve();
    };
    img.onerror = () => {
      e.failed = true;
      if (process.env.NODE_ENV !== "production") console.warn(`[assets] Không tải được ảnh: ${url}`);
      resolve(); // thiếu file → dùng phương án thay thế
    };
  });
  img.src = url;
  cache.set(url, e);
}

export function getAsset(url: string): HTMLImageElement | null {
  const e = cache.get(url);
  if (!e) {
    if (typeof window === "undefined") return null;
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[assets] Ảnh chưa khai báo trong template-assets.ts (thêm vào "preload"): ${url}`);
    }
    registerAsset(url);
    return null;
  }
  return e.img;
}

export function ensureAssetsLoaded(): Promise<void> {
  return Promise.all([...cache.values()].map((e) => e.ready)).then(() => undefined);
}

/** Danh sách ảnh đã đăng ký và trạng thái (dùng cho trang kiểm thử / chẩn đoán) */
export function assetStatus(): Array<{ url: string; state: "ready" | "loading" | "missing" }> {
  return [...cache.entries()].map(([url, e]) => ({ url, state: e.img ? "ready" : e.failed ? "missing" : "loading" }));
}
