"use client";

import { useEffect, useState } from "react";

/** Optional background-image enhancement; never use it to hide SSR content. */
export function useImageReveal(url: string | null | undefined): boolean {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    void image.decode().then(() => {
      if (!cancelled) setLoadedUrl(url);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [url]);
  return Boolean(url && loadedUrl === url);
}
