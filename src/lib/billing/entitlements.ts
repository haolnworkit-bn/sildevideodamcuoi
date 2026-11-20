"use client";

import { FEATURES } from "@/config/features";
import type { VideoTemplate } from "../render/types";

/**
 * Quyền của người dùng với 1 video. Mọi chỗ trong UI chỉ hỏi object này,
 * nên bật/tắt kiếm tiền hay đổi mô hình giá (gói tháng, credit...) chỉ sửa ở đây.
 */
export interface Entitlement {
  /** Chữ watermark hiển thị trên preview, null = không */
  previewWatermark: string | null;
  /** Được xuất bản sạch (không watermark) */
  cleanExport: boolean;
  /** Được tải bản có watermark miễn phí */
  watermarkedExport: boolean;
  /** Giá mở khoá video này (0 nếu miễn phí) */
  price: number;
}

const KEY = (id: string) => `tsv:unlocked:${id}`;

export function priceFor(t: VideoTemplate): number {
  return t.tier === "premium" ? FEATURES.pricePremium : FEATURES.pricePerVideo;
}

export function computeEntitlement(template: VideoTemplate, unlocked: boolean): Entitlement {
  if (!FEATURES.monetization || unlocked) {
    return { previewWatermark: null, cleanExport: true, watermarkedExport: false, price: 0 };
  }
  return {
    previewWatermark: FEATURES.watermarkText,
    cleanExport: false,
    watermarkedExport: FEATURES.freeExportWithWatermark,
    price: priceFor(template),
  };
}

// MVP: trạng thái đã mua lưu trên trình duyệt. Khi có tài khoản + DB, thay 2 hàm này bằng API.
export function isUnlocked(projectId: string): boolean {
  if (process.env.NODE_ENV === "production") return false;
  try {
    return localStorage.getItem(KEY(projectId)) === "1";
  } catch {
    return false;
  }
}

function markUnlocked(projectId: string) {
  try {
    localStorage.setItem(KEY(projectId), "1");
  } catch {
    /* bỏ qua */
  }
}

export type CheckoutResult =
  | { status: "paid" }
  | { status: "redirect"; url: string }
  | { status: "error"; message: string };

export async function startCheckout(projectId: string, templateId: string): Promise<CheckoutResult> {
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, templateId }),
    });
    const json = (await res.json()) as CheckoutResult;
    // Only the local dev mock may grant browser-local entitlements.
    // Production must use server-verified purchase receipts and enforce exports server-side.
    if (json.status === "paid" && process.env.NODE_ENV !== "production") markUnlocked(projectId);
    return json;
  } catch {
    return { status: "error", message: "Không kết nối được máy chủ thanh toán" };
  }
}
