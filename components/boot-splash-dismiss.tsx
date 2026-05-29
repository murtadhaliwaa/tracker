"use client";

import { useEffect } from "react";

export function BootSplashDismiss() {
  useEffect(() => {
    const el = document.getElementById("app-boot-splash");
    if (!el) return;

    el.style.opacity = "0";
    el.style.transition = "opacity 180ms ease-out";
    const timer = window.setTimeout(() => el.remove(), 200);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
