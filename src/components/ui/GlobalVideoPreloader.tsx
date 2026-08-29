"use client";

import { useEffect } from "react";

const videosToPreload = [
  "/new assests/Vedios/NOC APRROVED VIDEO.mp4",
  "/new assests/Vedios/PM HIGHLIGHTS.mp4",
  "/new assests/Vedios/PM BLUE WATER.mp4",
  "/new assests/Vedios/low qual vedio drone shoot.mp4",
];

export const GlobalVideoPreloader = () => {
  useEffect(() => {
    // Wait until the main page is completely idle before silently downloading videos
    const preloadVideos = () => {
      videosToPreload.forEach((src) => {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "video";
        link.href = src;
        // @ts-ignore - fetchpriority is relatively new and might not be in standard TS types yet
        link.fetchpriority = "low";
        document.head.appendChild(link);
      });
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(preloadVideos, { timeout: 3000 });
    } else {
      setTimeout(preloadVideos, 3000);
    }
  }, []);

  return null;
};
