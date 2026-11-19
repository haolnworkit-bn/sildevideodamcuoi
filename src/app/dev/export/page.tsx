import { notFound } from "next/navigation";
import ExportProbe from "./ExportProbe";

/** Kiểm tra nhanh khả năng xuất video của trình duyệt. Tắt trên production. */
export default function DevExportPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ExportProbe />;
}
