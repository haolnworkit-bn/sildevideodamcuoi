import { NextResponse } from "next/server";
import { TEMPLATES } from "@/lib/render/templates";

/**
 * Tạo phiên thanh toán cho 1 video.
 * - PAYMENT_PROVIDER=mock : trả về "paid" ngay (để test luồng).
 * - Tích hợp thật (PayOS/VNPay/MoMo): tạo đơn → trả { status: "redirect", url },
 *   rồi xác nhận qua webhook /api/payment/webhook và lưu quyền vào DB.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { projectId?: string; templateId?: string } | null;
  if (!body?.projectId || !TEMPLATES.some((t) => t.id === body.templateId)) {
    return NextResponse.json({ status: "error", message: "Yêu cầu không hợp lệ" }, { status: 400 });
  }

  // Không cấu hình gì thì chỉ cho mock ở môi trường dev, tránh lỡ "miễn phí" trên production
  const provider = process.env.PAYMENT_PROVIDER ?? (process.env.NODE_ENV === "production" ? "none" : "mock");
  if (provider === "mock" && process.env.NODE_ENV !== "production") {
    return NextResponse.json({ status: "paid" });
  }

  return NextResponse.json(
    { status: "error", message: `Chưa cấu hình cổng thanh toán đã xác minh phía server (${provider}). Không cấp quyền xuất sạch.` },
    { status: 501 },
  );
}
