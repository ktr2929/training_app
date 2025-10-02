import "./globals.css";
import Script from "next/script";
import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font"; // ← 呼び出さない
import AdBanner from "@/components/ui/AdBanner";

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
      {/* globals.css の CSS 変数名に合わせて: --font-geist-sans / --font-geist-mono */}
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        {/* 本体（フッター広告ぶんの余白は AdBanner 側の最小高さで吸収） */}
        <div className="min-h-[calc(100vh-60px)]">{children}</div>

        {/* フッター広告 */}
        <AdBanner slotId="5258884582" className="min-h-[60px]" />
      </body>
    </html>
  );
}
