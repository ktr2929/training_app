"use client";
import React, { useEffect } from "react";

type AdBannerProps = {
  slotId: string;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdBanner({ slotId, className }: AdBannerProps) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, [slotId]);

  return (
    <ins
      className={`adsbygoogle block w-full ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client="ca-pub-8011536479332336"
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
