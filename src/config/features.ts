/**
 * Cờ tính năng: bật/tắt kiếm tiền mà không phải sửa code.
 * Lưu ý: Next.js chỉ nhúng biến NEXT_PUBLIC_* khi được tham chiếu trực tiếp như dưới đây.
 */
export const FEATURES = {
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME || "TaoSlideVideo",

  /** Bật chế độ kiếm tiền: watermark + khoá xuất video sạch */
  monetization: process.env.NEXT_PUBLIC_MONETIZATION === "on",

  pricePerVideo: Number(process.env.NEXT_PUBLIC_PRICE_PER_VIDEO || 49000),
  pricePremium: Number(process.env.NEXT_PUBLIC_PRICE_PREMIUM || 79000),

  /** Khi bật kiếm tiền, vẫn cho tải bản có watermark miễn phí */
  freeExportWithWatermark: process.env.NEXT_PUBLIC_FREE_EXPORT_WATERMARK !== "off",
  watermarkText: process.env.NEXT_PUBLIC_WATERMARK_TEXT || "BẢN XEM THỬ",
} as const;

export function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}
