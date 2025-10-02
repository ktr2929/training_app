import "./globals.css";
import Script from "next/script";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "geist/font";        // ← 修正
import AdBanner from "@/components/ui/AdBanner";        // ← 既にOK

// フォントのCSS変数名を globals.css と合わせる
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

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
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {/* ページ本体 */}
        <div className="min-h-[calc(100vh-60px)]">{children}</div>
        {/* フッター広告（枠を確保） */}
        <AdBanner slotId="5258884582" className="min-h-[60px]" />
      </body>
    </html>
  );
}
