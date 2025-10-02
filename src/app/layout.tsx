import "./globals.css";
import Script from "next/script";
import AdBanner from "@/components/AdBanner";

export const metadata = {
  title: "きんとれログ",
  description: "トレーニング記録アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      {/* フッター広告を最下部に固定しやすいように縦レイアウト */}
      <body className="min-h-screen flex flex-col">
        <main className="flex-grow">
          {children}
        </main>

        {/* === すべてのページ最下部に広告 === */}
        <AdBanner />

        {/* === AdSense公式スクリプト === */}
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8011536479332336"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
