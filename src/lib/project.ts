import { EVENT_TYPES, type EventTypeId } from "./events";
import { solarToLunar, canChiYear } from "./lunar";

export type Aspect = "16:9" | "9:16";

export interface PhotoMeta {
  /** khoá ảnh trong IndexedDB */
  id: string;
  /** Vị trí lấy nét theo chiều dọc 0..1 */
  focusY: number;
}

/** Người dùng tuỳ chỉnh màu/font; bỏ trống = theo mẫu */
export interface StyleOverrides {
  titleFont?: string;
  bodyFont?: string;
  headingColor?: string;
  textColor?: string;
  accentColor?: string;
}

export interface FxSettings {
  /** Mật độ hạt (cánh hoa, lấp lánh…): 0 = tắt, 1 = mặc định, 1.5 = nhiều */
  particles: number;
  transition: "fade" | "zoom" | "slide";
}

export interface MusicSettings {
  enabled: boolean;
  volume: number;
  /** tên file hiển thị; dữ liệu nằm trong IndexedDB */
  name: string;
}

/** Toàn bộ dữ liệu người dùng nhập cho một video. Đây cũng là schema sẽ lưu vào DB sau này. */
export interface ProjectData {
  id: string;
  templateId: string;
  eventType: EventTypeId;
  aspect: Aspect;
  /** Tiêu đề tuỳ chỉnh; rỗng = dùng tiêu đề mặc định của loại lễ */
  title: string;
  groomName: string;
  brideName: string;
  nameOrder: "groom-first" | "bride-first";
  /** short: chỉ tên gọi ("Quân & Hà") ở cảnh lớn; full: họ tên đầy đủ */
  nameStyle: "short" | "full";
  /** Dòng chào nhỏ ở cảnh mở đầu, rỗng = ẩn */
  greeting: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, rỗng = không hiển thị */
  time: string;
  showLunar: boolean;
  venue: string;
  message: string;
  /** Ảnh: ảnh đầu tiên là ảnh chính; từ 2 ảnh trở lên có thêm cảnh "Khoảnh khắc" */
  photos: PhotoMeta[];
  photoSide: "left" | "right";
  /** Cảnh chữ: intro (Giới thiệu) và message (Lời cảm ơn) tắt được; "Tên & ngày" luôn có. album = Khoảnh khắc (≥2 ảnh) */
  scenes: { intro: boolean; message: boolean; album: boolean };
  style: StyleOverrides;
  fx: FxSettings;
  music: MusicSettings;
}

export const MAX_PHOTOS = 6;

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function createDefaultProject(templateId: string, eventType: EventTypeId): ProjectData {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return {
    id: uid(),
    templateId,
    eventType,
    aspect: "16:9",
    title: "",
    groomName: "Nguyễn Minh Quân",
    brideName: "Trần Thu Hà",
    nameOrder: "groom-first",
    nameStyle: "short",
    greeting: "Kính chào quý khách",
    date: isoDate(d),
    time: "09:00",
    showLunar: true,
    venue: "Tư gia nhà gái",
    message: EVENT_TYPES[eventType].defaultMessage,
    photos: [],
    photoSide: "left",
    scenes: { intro: true, message: true, album: true },
    style: {},
    fx: { particles: 1, transition: "fade" },
    music: { enabled: false, volume: 0.8, name: "" },
  };
}

/** Bổ sung trường mới cho bản nháp cũ */
export function normalizeProject(d: Partial<ProjectData> & Pick<ProjectData, "id" | "eventType">): ProjectData {
  const base = createDefaultProject(d.templateId ?? "", d.eventType);
  return {
    ...base,
    ...d,
    nameStyle: d.nameStyle ?? "full",
    greeting: d.greeting ?? base.greeting,
    photos: Array.isArray(d.photos) ? d.photos : [],
    scenes: { ...base.scenes, ...d.scenes },
    style: { ...d.style },
    fx: { ...base.fx, ...d.fx },
    music: { ...base.music, ...d.music },
  };
}

// ---------- Dữ liệu dẫn xuất để hiển thị ----------

export function eventTitle(d: ProjectData): string {
  return d.title.trim() || EVENT_TYPES[d.eventType].title;
}

/** Họ tên đầy đủ theo thứ tự đã chọn */
export function fullNamePair(d: ProjectData): [string, string] {
  const g = d.groomName.trim() || "Chú rể";
  const b = d.brideName.trim() || "Cô dâu";
  return d.nameOrder === "groom-first" ? [g, b] : [b, g];
}

/** Tên gọi = từ cuối của họ tên ("Nguyễn Minh Quân" → "Quân") */
export function givenName(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] || full;
}

/** Tên cho cảnh lớn: theo tuỳ chọn nameStyle */
export function namePair(d: ProjectData): [string, string] {
  const [a, b] = fullNamePair(d);
  return d.nameStyle === "short" ? [givenName(a), givenName(b)] : [a, b];
}

/** Chữ cái đầu của tên gọi, dùng cho monogram */
export function initials(d: ProjectData): [string, string] {
  const [a, b] = fullNamePair(d);
  return [givenName(a).charAt(0).toUpperCase(), givenName(b).charAt(0).toUpperCase()];
}

const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export interface DateInfo {
  valid: boolean;
  weekday: string;
  day: string;
  month: string;
  year: string;
  /** 21.11.2026 */
  solar: string;
  /** Tức ngày 12 tháng 10 năm Bính Ngọ */
  lunar: string;
  /** Vào lúc 9 giờ 30 */
  time: string;
}

export function dateInfo(d: ProjectData): DateInfo {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.date);
  const time = formatTime(d.time);
  if (!m) {
    return { valid: false, weekday: "", day: "", month: "", year: "", solar: "", lunar: "", time };
  }
  const yy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  const dt = new Date(yy, mm - 1, dd);
  if (yy < 1900 || yy > 2100 || dt.getFullYear() !== yy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) {
    return { valid: false, weekday: "", day: "", month: "", year: "", solar: "", lunar: "", time };
  }
  const l = solarToLunar(dd, mm, yy);
  const lunar = d.showLunar
    ? `Tức ngày ${l.day} tháng ${l.month}${l.leap ? " nhuận" : ""} năm ${canChiYear(l.year)}`
    : "";
  return {
    valid: true,
    weekday: WEEKDAYS[dt.getDay()],
    day: String(dd).padStart(2, "0"),
    month: String(mm).padStart(2, "0"),
    year: String(yy),
    solar: `${String(dd).padStart(2, "0")}.${String(mm).padStart(2, "0")}.${yy}`,
    lunar,
    time,
  };
}

function formatTime(t: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return "";
  const h = Number(m[1]);
  const minutes = Number(m[2]);
  if (h > 23 || minutes > 59) return "";
  return m[2] === "00" ? `Vào lúc ${h} giờ` : `Vào lúc ${h} giờ ${m[2]}`;
}

/** Dòng phụ: giờ + địa điểm */
export function detailLine(d: ProjectData): string {
  const info = dateInfo(d);
  return [info.time, d.venue.trim() ? `Tại ${d.venue.trim()}` : ""].filter(Boolean).join("  ·  ");
}
