import type { Metadata } from "next";
import { FEATURES } from "@/config/features";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${FEATURES.brandName} · Video lễ dạm ngõ, ăn hỏi`, template: `%s · ${FEATURES.brandName}` },
  description: "Tạo video nền chiếu TV cho lễ dạm ngõ, ăn hỏi, đính hôn, vu quy trong 2 phút. Xuất MP4 Full HD.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
