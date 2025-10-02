import "./globals.css";
import Script from "next/script";
import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font"; // ← ここを修正
import AdBanner from "@/components/ui/AdBanner";

// globals.css の CSS 変数名に合わせて variable を設定
const geistSans = GeistSans({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = GeistMono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "きんとれログ",
  description: "シンプルな筋トレ記録アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* AdSense ローダー（site-wide） */}
        <Script
          id="adsbygoogle-init"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8011536479332336"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      {/* Tailwind の font-sans を Geist に差し替え、等幅は GeistMono */}
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {/* ページ本体（フッター広告ぶんの余白は AdBanner 側で確保） */}
        <div className="min-h-[calc(100vh-60px)]">{children}</div>

        {/* フッター広告（下部固定ではなくコンテンツ直下） */}
        <AdBanner slotId="5258884582" className="min-h-[60px]" />
      </body>
    </html>
  );
}
