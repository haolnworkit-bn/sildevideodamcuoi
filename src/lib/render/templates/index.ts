import type { ColorTag, VideoTemplate } from "../types";
import { camTuCau } from "./cam-tu-cau";
import { hoaDao } from "./hoa-dao";
import { hoangKim } from "./hoang-kim";
import { hySu } from "./hy-su";
import { mauDon } from "./mau-don";
import { ngocTrai } from "./ngoc-trai";
import { senNgoc } from "./sen-ngoc";
import { thanhLich } from "./thanh-lich";
import { thuVang } from "./thu-vang";
import { trauCau } from "./trau-cau";
import { tuDang } from "./tu-dang";

/** Đăng ký template mới: tạo file trong thư mục này rồi thêm vào mảng. */
export const TEMPLATES: VideoTemplate[] = [
  hoaDao,
  trauCau,
  hySu,
  senNgoc,
  mauDon,
  tuDang,
  camTuCau,
  thuVang,
  ngocTrai,
  thanhLich,
  hoangKim,
];

export function getTemplate(id: string | null | undefined): VideoTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

/** Nhóm màu để lọc theo màu trang trí rạp */
export const COLOR_TAGS: Array<{ id: ColorTag; label: string; dot: string }> = [
  { id: "do", label: "Đỏ", dot: "#b3121f" },
  { id: "hong", label: "Hồng", dot: "#f08aa4" },
  { id: "tim", label: "Tím", dot: "#8a62b8" },
  { id: "xanh-duong", label: "Xanh dương", dot: "#5f82c4" },
  { id: "xanh-la", label: "Xanh lá", dot: "#3f7a50" },
  { id: "vang", label: "Vàng", dot: "#e0b040" },
  { id: "trang", label: "Trắng / Kem", dot: "#f3ede2" },
];
