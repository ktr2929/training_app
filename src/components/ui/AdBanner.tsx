"use client";

import { useEffect, useRef } from "react";

// Google AdSense のグローバル配列を型で拡張
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

/**
 * 画面下部に出すレスポンシブ広告バナー
 * - layout.tsx で adsbygoogle の Script を読み込んでいる前提
 */
export default function AdBanner() {
  // <ins> 要素は HTMLModElement で表現される
  const insRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!insRef.current) return;
    try {
      // 配列を初期化して push
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // 広告ブロッカー等で例外が出てもアプリを止めない
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", width: "100%" }}
      data-ad-client="ca-pub-8011536479332336"
      data-ad-slot="5258884582"
      data-ad-format="auto"
      data-full-width-responsive="true"
      ref={insRef}
    />
  );
}
