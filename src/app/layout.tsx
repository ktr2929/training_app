import "./globals.css";
import Script from "next/script";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import AdBanner from "@/components/ui/AdBanner";  // ✅ パス修正（ui/AdBanner）

export const metadata: Metadata = {
  title: "きんとれログ",
  description: "トレーニング記録・統計・カレンダーをまとめるアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={GeistSans.className}>
      <head>
        {/* ✅ Google AdSense のスクリプト */}
        <Script
          id="adsense-init"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8011536479332336"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>

        {/* ✅ サイト全体フッター広告 */}
        <footer className="border-t bg-neutral-50">
          <div className="max-w-6xl mx-auto px-3 py-2 min-h-[60px] flex items-center justify-center">
            <AdBanner />
          </div>
          <div className="text-center text-xs text-neutral-500 py-2">
            <a href="/privacy" className="hover:underline">
              プライバシーポリシー
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
