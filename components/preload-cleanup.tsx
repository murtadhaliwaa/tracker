"use client";

import { useEffect } from "react";

function cleanupRedundantStylePreloads() {
  for (const preload of document.querySelectorAll('link[rel="preload"][as="style"]')) {
    const href = preload.getAttribute("href");
    if (!href) continue;

    const resource = href.split("?")[0];
    const origin = window.location.origin;
    const pathname = resource.startsWith(origin) ? resource.slice(origin.length) : resource;
    const selectors = [
      `link[rel="stylesheet"][href^="${resource}"]`,
      `link[rel="stylesheet"][href^="${pathname}"]`,
    ];

    for (const selector of selectors) {
      if (document.querySelector(selector)) {
        preload.remove();
        break;
      }
    }
  }
}

export function PreloadCleanup() {
  useEffect(() => {
    cleanupRedundantStylePreloads();

    const observer = new MutationObserver(() => {
      cleanupRedundantStylePreloads();
    });

    observer.observe(document.head, { childList: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
