import { notFound } from "next/navigation";
import PerfProbe from "./PerfProbe";

/** Đo thời gian vẽ từng khung hình (tìm chỗ giật khi xem trước). Tắt trên production. */
export default function DevPerfPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PerfProbe />;
}
