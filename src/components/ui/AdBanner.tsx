"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdBanner() {
  const adRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // 同じ <ins> に二重で push しないための防御
    const el = adRef.current as any;
    if (!el) return;
    // 既にレンダ済みならスキップ
    if (el.getAttribute("data-adsbygoogle-status") === "done") return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // devのStrictMode等で二重実行時に出ることがあるので握りつぶす
      // console.warn("Adsense render error", e);
    }
  }, []);

  return (
    <div className="w-full flex justify-center py-6 border-t bg-white">
      <ins
        ref={adRef as any}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-8011536479332336"
        data-ad-slot="5258884582"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
