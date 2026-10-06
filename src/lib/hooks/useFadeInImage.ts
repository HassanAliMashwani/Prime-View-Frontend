"use client";

import { useState, useRef, useLayoutEffect, useEffect, useCallback } from "react";

// Global session cache of loaded image URLs so that each photo fades only once
export const loadedImageSrcs = new Set<string>();

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Hook to fade in an image only on its first load.
 * - Starts at opacity 0
 * - Fades to opacity 1 over ~400ms ease-out on load
 * - If the image is already decoded/cached, immediately renders at opacity 1 via useLayoutEffect
 * - Remembers loaded URLs so CMS refetches never cause re-fading or blinking
 */
export function useFadeInImage(src: string | undefined | null) {
  const imgRef = useRef<HTMLImageElement>(null);
  const srcStr = src || "";
  const [isLoaded, setIsLoaded] = useState<boolean>(() =>
    srcStr ? loadedImageSrcs.has(srcStr) : false
  );
  const prevSrcRef = useRef(srcStr);

  // Sync state if src changes
  if (prevSrcRef.current !== srcStr) {
    prevSrcRef.current = srcStr;
    const cached = srcStr ? loadedImageSrcs.has(srcStr) : false;
    if (isLoaded !== cached) {
      setIsLoaded(cached);
    }
  }

  // Synchronously check if the image is already decoded before paint
  useIsomorphicLayoutEffect(() => {
    if (!srcStr) return;
    if (loadedImageSrcs.has(srcStr)) {
      if (!isLoaded) setIsLoaded(true);
      return;
    }
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      loadedImageSrcs.add(srcStr);
      setIsLoaded(true);
    }
  }, [srcStr, isLoaded]);

  const handleLoad = useCallback(() => {
    if (srcStr) loadedImageSrcs.add(srcStr);
    setIsLoaded(true);
  }, [srcStr]);

  return { imgRef, isLoaded, handleLoad };
}
