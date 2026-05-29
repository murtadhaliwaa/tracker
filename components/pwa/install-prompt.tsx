"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "life-rpg-pwa-dismissed-until";
const DISMISS_DAYS = 7;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isDismissed() {
  const until = localStorage.getItem(DISMISS_KEY);
  if (!until) return false;
  return Date.now() < Number(until);
}

function dismissForAWhile() {
  localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 86400000));
}

export function PwaInstallPrompt() {
  const t = useTranslations("pwa");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [hostname, setHostname] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    setHostname(window.location.hostname);

    if (isIos()) {
      setVisible(true);
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      setInstalling(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    dismissForAWhile();
    setVisible(false);
  }, []);

  if (!visible || isStandalone()) return null;

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-[60] border-b border-white/10 bg-[#1a1a24]/95 px-3 py-2.5 shadow-lg backdrop-blur-md md:hidden",
          "animate-in slide-in-from-top duration-300",
        )}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Image
            src="/icons/apple-touch-icon.png"
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-xl"
            priority
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {t("installApp")} <span className="font-normal text-white/70">{t("install")}</span>
            </p>
            <p className="truncate text-xs text-white/50">{hostname}</p>
            {isIos() && !deferredPrompt ? (
              <p className="mt-0.5 text-[11px] leading-tight text-rpg-gold">{t("iosHint")}</p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {!isIos() && deferredPrompt ? (
              <button
                type="button"
                onClick={() => void handleInstall()}
                disabled={installing}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
              >
                {t("install")}
              </button>
            ) : null}
            <button
              type="button"
              aria-label={t("dismiss")}
              onClick={handleDismiss}
              className="flex size-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {installing ? (
        <div className="fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-sm animate-in slide-in-from-bottom duration-200 md:bottom-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1a24]/95 px-4 py-3 shadow-2xl backdrop-blur-md">
            <Image
              src="/icons/apple-touch-icon.png"
              alt=""
              width={32}
              height={32}
              className="size-8 shrink-0 rounded-lg"
              priority
            />
            <p className="text-sm font-medium text-white">{t("installing")}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
