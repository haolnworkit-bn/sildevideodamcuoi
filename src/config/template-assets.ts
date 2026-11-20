/**
 * ĐỊNH NGHĨA ẢNH TRANG TRÍ CHO TỪNG MẪU  (một nơi duy nhất)
 *
 * - Ảnh để trong  public/assets/<id-mẫu>/   (id = trường `id` của mẫu, vd "hoa-dao-xuan").
 * - Khai báo ở đây: ảnh nào, đặt ở đâu, chuyển động ra sao. KHÔNG cần sửa code vẽ.
 * - Engine (src/lib/render/layers.ts) tự vẽ theo thứ tự:
 *     code nền của mẫu → ảnh nền → lớp "back" → các cảnh chữ/ảnh → lớp "front" → ảnh rơi → hạt của mẫu
 * - Thiếu file ảnh (chưa có / 404) → bỏ qua lớp đó, mẫu vẫn chạy.
 * - Hướng dẫn chi tiết: public/assets/README.md
 *
 * Toạ độ là TỈ LỆ của khung hình: x,y ∈ [0,1] (0,0 = góc trên trái; 1,1 = góc dưới phải).
 * Cỡ ảnh: `height` = tỉ lệ so với chiều cao khung, hoặc `width` = tỉ lệ so với chiều rộng (chọn một).
 * Chuyển động lặp liền mạch theo vòng video: `cycles` là SỐ NGUYÊN lần lặp mỗi vòng.
 */

export interface Motion {
  /** Số lần lặp mỗi vòng video (nguyên). Mặc định 2 */
  cycles?: number;
  /** Đung đưa quanh điểm neo, đơn vị radian (~0.02 = nhẹ) */
  sway?: number;
  /** Nhấp nhô lên xuống, tỉ lệ chiều cao khung (~0.004 = nhẹ) */
  bob?: number;
  /** Trôi ngang, tỉ lệ chiều rộng khung */
  driftX?: number;
  /** "Thở": phóng to thu nhỏ nhẹ (~0.012) */
  breathe?: number;
  /** Lệch pha để các lớp không chuyển động giống hệt nhau */
  phase?: number;
}

/** Điểm neo của ảnh: ghép 1 chữ dọc (t/c/b) + 1 chữ ngang (l/c/r); "c" = chính giữa */
export type Anchor = "tl" | "tc" | "tr" | "cl" | "c" | "cr" | "bl" | "bc" | "br";

export interface ImageLayer {
  /** Đường dẫn dưới /assets/..., vd "/assets/quan-ho-kinh-bac/decorations/sen-bong.webp" */
  src: string;
  anchor: Anchor;
  x: number;
  y: number;
  height?: number;
  width?: number;
  flip?: boolean;
  alpha?: number;
  /** Xoay cố định (radian) */
  rotate?: number;
  motion?: Motion;
  /** Chỉ hiện ở một hướng khung hình */
  only?: "landscape" | "portrait";
  /** Ghi đè riêng cho khung dọc 9:16 (x, y, height, width, anchor, flip…); `hide: true` để ẩn ở khung dọc */
  portrait?: Partial<Omit<ImageLayer, "src" | "portrait" | "only">> & { hide?: boolean };
}

/** Ảnh rơi (cánh hoa, lá…): nhiều bản sao rơi và xoay, lặp liền mạch */
export interface FallingSpec {
  src: string;
  /** Số lượng (mật độ sẽ theo tuỳ chọn "mật độ hạt" của người dùng) */
  count: number;
  /** Cỡ ảnh tối thiểu/tối đa, tỉ lệ so với cạnh ngắn của khung (vd [0.03, 0.06]) */
  size: [number, number];
  /** Số vòng rơi tối đa mỗi vòng video (nguyên, mặc định 1) */
  loops?: number;
  /** Độ lệch ngang khi rơi, px (mặc định 100) */
  drift?: number;
  seed?: number;
}

export interface TemplateAssets {
  /** Ảnh nền phủ kín khung (cover). Cần RIÊNG cho từng hướng; thiếu hướng nào thì hướng đó dùng nền vẽ bằng code của mẫu */
  background?: {
    landscape?: string; // 16:9, từ 1920×1080
    portrait?: string; // 9:16, từ 1080×1920
    /** Phóng to nhẹ theo vòng lặp (vd 0.03). Mặc định 0 */
    zoom?: number;
  };
  /** Lớp ở PHÍA SAU chữ/ảnh cưới */
  back?: ImageLayer[];
  /** Lớp ở PHÍA TRƯỚC chữ/ảnh cưới (dùng tiết chế, tránh che chữ) */
  front?: ImageLayer[];
  falling?: FallingSpec[];
  /** Ảnh mà CODE của mẫu tự vẽ (vd ornament, khung) — khai báo để được tải trước khi preview/xuất */
  preload?: string[];
}

export const TEMPLATE_ASSETS: Record<string, TemplateAssets> = {
  /** Thử nghiệm: ảnh nền màu nước hoa đào (chỉ có bản ngang). Bản dọc: còn dùng nền vẽ bằng code. */
  "hoa-dao-xuan": {
    background: { landscape: "/assets/hoa-dao-xuan/backgrounds/landscape.webp", zoom: 0.02 },
  },

  /** Bông sen màu nước đứng trong ao, đung đưa và "thở" nhẹ */
  "quan-ho-kinh-bac": {
    back: [
      {
        src: "/assets/quan-ho-kinh-bac/decorations/sen-bong.webp",
        anchor: "bc",
        x: 0.205,
        y: 0.95,
        height: 0.3,
        motion: { sway: 0.018, breathe: 0.012, cycles: 2 },
        portrait: { x: 0.5, height: 0.2 },
      },
      {
        src: "/assets/quan-ho-kinh-bac/decorations/sen-bong.webp",
        anchor: "bc",
        x: 0.795,
        y: 0.95,
        height: 0.3,
        flip: true,
        motion: { sway: 0.018, breathe: 0.012, cycles: 2, phase: 2.1 },
        portrait: { hide: true },
      },
    ],
  },

  /** Hồng Phượng 2026: nền riêng ngang/dọc và artwork màu nước. */
  "hong-phuong": {
    preload: ["/assets/hong-phuong/decorations/silk-ribbon.webp"],
    background: {
      landscape: "/assets/hong-phuong/backgrounds/landscape.webp",
      portrait: "/assets/hong-phuong/backgrounds/portrait.webp",
      zoom: 0.012,
    },
    back: [
      // Phượng hoàng mờ ở rìa phải, không đè lên chữ; ẩn trên khung dọc.
      {
        src: "/assets/hong-phuong/decorations/phoenix-pink.webp",
        anchor: "tr", x: 0.98, y: 0.10, height: 0.3, alpha: 0.20,
        motion: { sway: 0.008, breathe: 0.005, cycles: 2 },
        portrait: { hide: true },
      },
    ],
    falling: [
      { src: "/assets/hong-phuong/particles/petal-pink-01.webp", count: 8, size: [0.014, 0.027], drift: 36, loops: 1, seed: 73 },
    ],
  },
};
