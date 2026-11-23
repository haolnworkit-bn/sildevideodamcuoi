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
  /** Đường dẫn dưới /assets/..., vd "/assets/hong-phuong/decorations/goc-tren-trai.webp" */
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
    /** Ghi đè `zoom` riêng cho khung dọc (vd 0 = nền dọc đứng yên) */
    portraitZoom?: number;
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
  /** Hoa Đào Xuân — màu nước Tết miền Bắc: nền vẽ liền riêng ngang/dọc, cánh đào + bông đào rơi. */
  "hoa-dao-xuan": {
    background: {
      landscape: "/assets/hoa-dao-xuan/backgrounds/landscape.webp",
      portrait: "/assets/hoa-dao-xuan/backgrounds/portrait.webp",
      zoom: 0.015,
    },
    falling: [
      { src: "/assets/hoa-dao-xuan/particles/canh-dao-01.webp", count: 6, size: [0.016, 0.03], drift: 60, loops: 1, seed: 11 },
      { src: "/assets/hoa-dao-xuan/particles/canh-dao-02.webp", count: 6, size: [0.016, 0.03], drift: 50, loops: 1, seed: 29 },
      { src: "/assets/hoa-dao-xuan/particles/bong-dao-01.webp", count: 1, size: [0.03, 0.04], drift: 36, loops: 1, seed: 87 },
    ],
  },

  /** Bông sen màu nước đứng trong ao, đung đưa và "thở" nhẹ */
  /** Quan Họ — màu nước: nền vẽ liền riêng ngang/dọc (quy cách §6-D), chỉ tách cánh sen rơi. */
  "quan-ho-kinh-bac": {
    background: {
      landscape: "/assets/quan-ho-kinh-bac/backgrounds/landscape.webp",
      portrait: "/assets/quan-ho-kinh-bac/backgrounds/portrait.webp",
      zoom: 0.01,
    },
    falling: [
      { src: "/assets/quan-ho-kinh-bac/particles/canh-sen-01.webp", count: 4, size: [0.02, 0.036], drift: 50, loops: 1, seed: 41 },
      { src: "/assets/quan-ho-kinh-bac/particles/canh-sen-02.webp", count: 4, size: [0.02, 0.036], drift: 44, loops: 1, seed: 67 },
      { src: "/assets/quan-ho-kinh-bac/particles/canh-sen-03.webp", count: 3, size: [0.022, 0.04], drift: 38, loops: 1, seed: 103 },
    ],
  },

  /** Hồng Phượng 2026: nền riêng ngang/dọc và artwork màu nước. */
  "hong-phuong": {
    preload: ["/assets/hong-phuong/decorations/silk-ribbon.webp"],
    background: {
      landscape: "/assets/hong-phuong/backgrounds/landscape.webp",
      portrait: "/assets/hong-phuong/backgrounds/portrait.webp",
      zoom: 0.01,
      portraitZoom: 0, // HP-02 đứng yên (hồ sơ B1.1)
    },
    // Vị trí/cỡ theo bảng đặt asset B1.1 (docs hồ sơ hong-phuong). Cỡ = tỉ lệ khung: ngang H=1080, dọc H=1920.
    back: [
      // HP-03 cành đào trên trái — 400×280 ngang, 260×182 dọc
      {
        src: "/assets/hong-phuong/decorations/goc-tren-trai.webp",
        anchor: "tl", x: 0, y: 0, height: 280 / 1080,
        motion: { sway: 0.008, cycles: 2 },
        portrait: { height: 182 / 1920 },
      },
      // HP-06 cành đào trên phải — 320×180 ngang, 204×115 dọc; lệch pha với HP-03
      {
        src: "/assets/hong-phuong/decorations/canh-tren-phai.webp",
        anchor: "tr", x: 1, y: 0, height: 180 / 1080,
        motion: { sway: 0.008, cycles: 2, phase: 2.2 },
        portrait: { height: 115 / 1920 },
      },
      // HP-04 mẫu đơn + nón lá dưới trái (ngang) — 410×280
      {
        src: "/assets/hong-phuong/decorations/goc-duoi-trai.webp",
        anchor: "bl", x: 0, y: 1, height: 280 / 1080, only: "landscape",
        motion: { breathe: 0.005, cycles: 2 },
      },
      // HP-05 mẫu đơn + đào dưới phải (ngang) — 410×290
      {
        src: "/assets/hong-phuong/decorations/goc-duoi-phai.webp",
        anchor: "br", x: 1, y: 1, height: 290 / 1080, only: "landscape",
        motion: { breathe: 0.005, cycles: 2, phase: 3.1 },
      },
      // HP-04-P / HP-05-P cụm đáy khổ dọc — ~482×380 / ~477×390 (phóng to so với B1.1 để lấp dải đáy; phần cao nằm sát mép ngoài)
      {
        src: "/assets/hong-phuong/decorations/goc-duoi-trai-portrait.webp",
        anchor: "bl", x: 0, y: 1, height: 380 / 1920, only: "portrait",
        motion: { breathe: 0.004, cycles: 2 },
      },
      {
        src: "/assets/hong-phuong/decorations/goc-duoi-phai-portrait.webp",
        anchor: "br", x: 1, y: 1, height: 390 / 1920, only: "portrait",
        motion: { breathe: 0.004, cycles: 2, phase: 3.1 },
      },
      // HP-07 đèn lồng — chỉ khổ dọc, treo tại x=970, cao 230
      {
        src: "/assets/hong-phuong/decorations/den-long.webp",
        anchor: "tc", x: 970 / 1080, y: 0, height: 230 / 1920, only: "portrait",
        motion: { sway: 0.012, cycles: 2, phase: 1.3 },
      },
    ],
    front: [
      // HP-08 dải lụa đáy — 980×80 ngang (y 1000–1080), 940×77 dọc
      {
        src: "/assets/hong-phuong/decorations/dai-lua-day.webp",
        anchor: "bc", x: 0.5, y: 1, width: 980 / 1920,
        motion: { driftX: 0.003, cycles: 1 },
        portrait: { width: 940 / 1080 },
      },
    ],
    falling: [
      { src: "/assets/hong-phuong/particles/petal-pink-01.webp", count: 5, size: [0.015, 0.03], drift: 36, loops: 1, seed: 73 },
      { src: "/assets/hong-phuong/particles/canh-hong-02.webp", count: 4, size: [0.015, 0.03], drift: 40, loops: 1, seed: 91 },
      { src: "/assets/hong-phuong/particles/canh-hong-03.webp", count: 3, size: [0.018, 0.034], drift: 32, loops: 1, seed: 117 },
    ],
  },
};
