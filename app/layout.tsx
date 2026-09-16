import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "도시 경관 이미지 실험",
  description: "도시 경관 이미지 인식 실험 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-gray-50">{children}</body>
    </html>
  );
}
