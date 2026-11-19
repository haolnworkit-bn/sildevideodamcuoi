import type { VideoTemplate } from "../types";
import { hoaDao } from "./hoa-dao";
import { hoangKim } from "./hoang-kim";
import { hySu } from "./hy-su";
import { mauDon } from "./mau-don";
import { senNgoc } from "./sen-ngoc";
import { thanhLich } from "./thanh-lich";
import { trauCau } from "./trau-cau";

/** Đăng ký template mới: tạo file trong thư mục này rồi thêm vào mảng. */
export const TEMPLATES: VideoTemplate[] = [hoaDao, trauCau, hySu, senNgoc, mauDon, thanhLich, hoangKim];

export function getTemplate(id: string | null | undefined): VideoTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
