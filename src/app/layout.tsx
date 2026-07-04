import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrendBridge AI",
  description: "海外トレンドを日本向けコンテンツに再構成するAI編集部ツール",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
