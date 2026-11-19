import { notFound } from "next/navigation";
import FrameSheet from "./FrameSheet";

/** Công cụ cho người làm template: xem mọi template ở nhiều thời điểm. Tắt trên production. */
export default function DevFramesPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <FrameSheet />;
}
