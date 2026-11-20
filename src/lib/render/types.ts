import type { Aspect, FxSettings, ProjectData } from "../project";
import type { Paint } from "./helpers";
import type { LayoutProbe } from "./layout";

export type PhotoSource = HTMLImageElement | ImageBitmap | HTMLCanvasElement;

export interface Photo {
  img: PhotoSource;
  focusY: number;
}

/** Kích thước sân khấu logic. Template vẽ theo W/H này, engine tự scale ra canvas thật. */
export const STAGE: Record<Aspect, { W: number; H: number }> = {
  "16:9": { W: 1920, H: 1080 },
  "9:16": { W: 1080, H: 1920 },
};

/** Vai trò font. Engine điền family thật (đã áp tuỳ chỉnh của người dùng). */
export interface FontSet {
  /** chữ viết tay: tiêu đề kiểu script, tên */
  script: string;
  /** chữ in cho tiêu đề IN HOA */
  caps: string;
  display: string;
  serif: string;
  sans: string;
}

export interface FontLibrary {
  base: Omit<FontSet, "caps">;
  byKey: Record<string, string>;
}

/** Màu chữ của template (người dùng có thể ghi đè) */
export interface Theme {
  /** tiêu đề */
  heading: Paint;
  /** tên cô dâu chú rể, số ngày */
  names: Paint;
  /** lời nhắn, dòng âm lịch, họ tên nhỏ */
  body: string;
  /** dòng chào, nhãn, ngày tháng nhỏ */
  accent: string;
  /** đường kẻ trang trí */
  line: string;
}

export type SceneType = "intro" | "message" | "album" | "names";

export interface TimelineScene {
  type: SceneType;
  label: string;
  start: number;
  end: number;
}

export interface Timeline {
  duration: number;
  scenes: TimelineScene[];
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  portrait: boolean;
  /** Thời điểm (giây), 0 ≤ t < D */
  t: number;
  /** Độ dài vòng lặp (giây) — thay đổi theo số cảnh/ảnh */
  D: number;
  timeline: Timeline;
  data: ProjectData;
  photos: Photo[];
  /** ảnh chính (ảnh đầu tiên) */
  photo: Photo | null;
  fonts: FontSet;
  theme: Theme;
  fx: FxSettings;
  /** Chỉ bật ở trang kiểm tra bố cục: ghi khung bao chữ/ảnh (xem layout.ts) */
  probe?: LayoutProbe;
}

export type PhotoFrame = (
  ctx: CanvasRenderingContext2D,
  photo: Photo,
  x: number,
  y: number,
  w: number,
  h: number,
  rc: RenderContext,
) => void;

export interface IntroSpec {
  /** script: tiêu đề chữ viết tay lớn; caps: chữ in hoa giãn cách */
  title: "script" | "caps";
  /** Dòng họ tên dưới tiêu đề: chữ nghiêng (họ tên đầy đủ) hoặc chữ viết tay (tên gọi) */
  namesLine: "italic" | "script";
  /**
   * Cách hiện ảnh chính ở cảnh mở đầu:
   * - frame: khung ảnh một bên, chữ bên kia
   * - emblem: ảnh nằm trong biểu tượng ở giữa (huy chương, monogram…)
   * - fullbleed: ảnh tràn màn hình, chữ đè phía dưới
   * - faded: ảnh tràn nửa màn hình, mờ dần vào nền
   */
  photoMode: "frame" | "emblem" | "fullbleed" | "faded";
  /** Biểu tượng giữa màn hình (khi không có ảnh, hoặc chứa ảnh nếu photoMode = emblem) */
  emblem?: (rc: RenderContext, cx: number, cy: number, r: number, photo: Photo | null) => void;
  /** Vẽ phía sau tiêu đề (vd dải lụa). p = tiến độ xuất hiện 0..1 */
  titleBacking?: (rc: RenderContext, cx: number, cy: number, w: number, h: number, p: number) => void;
}

export type Tier = "free" | "premium";

/** Nhóm màu để lọc mẫu theo màu trang trí rạp */
export type ColorTag = "do" | "hong" | "tim" | "xanh-duong" | "xanh-la" | "vang" | "trang";

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  tier: Tier;
  /** Màu đại diện cho giao diện chọn mẫu */
  swatch: string[];
  colors: ColorTag[];
  theme: Theme;
  /** Font lời nhắn/số: "serif" (Cormorant…) hoặc "display" (Playfair…) */
  bodyFont?: "serif" | "display";
  /** Font cho tiêu đề IN HOA */
  capsFont?: "serif" | "display";
  intro: IntroSpec;
  /** Nền: vẽ đầu tiên. Phải là hàm thuần theo rc.t để lặp liền mạch. */
  background: (rc: RenderContext) => void;
  /** Lớp hạt/hiệu ứng phía trước chữ */
  foreground?: (rc: RenderContext) => void;
  /** Lớp nằm TRÊN ảnh nền nhưng DƯỚI ảnh trang trí đã khai báo (layers back/front) và dưới chữ/ảnh cưới
   *  (vd viền khung, chữ 囍 chìm ở giữa) — nhờ vậy viền không đè lên vật thể trang trí */
  backdrop?: (rc: RenderContext) => void;
  /** Hoạ tiết nhỏ phía trên tiêu đề "Lời cảm ơn" */
  ornament?: (rc: RenderContext, cx: number, cy: number) => void;
  /** Khung ảnh theo phong cách mẫu */
  photoFrame: PhotoFrame;
  /** Màu chữ khi đặt trên ảnh tràn màn hình */
  onPhoto?: Partial<Theme>;
}
