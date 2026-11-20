import { notFound } from "next/navigation";
import LayoutAudit from "./LayoutAudit";

/** Kiểm tra bố cục chữ tự động cho mọi mẫu (vùng an toàn, cỡ chữ, chữ đè). Tắt trên production. */
export default function DevLayoutPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <LayoutAudit />;
}
