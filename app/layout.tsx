import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

// 한글 글리프가 많아 미리 불러오지 않고 필요한 범위만 내려받게 한다.
const notoSansKr = Noto_Sans_KR({ preload: false, display: "swap" });

export const metadata: Metadata = {
  title: "도시 경관 이미지 실험",
  description: "도시 경관 이미지 인식 실험 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`h-full ${notoSansKr.className}`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
