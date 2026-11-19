import { Suspense } from "react";
import Editor from "@/components/Editor";

export const metadata = { title: "Trình chỉnh sửa video" };

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="editor-loading">Đang tải…</div>}>
      <Editor />
    </Suspense>
  );
}
