"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Non-standard event Chrome/Android fires when the PWA becomes installable.
 * Not part of the DOM lib types, declared locally rather than as a global
 * ambient type since this hook is the only consumer.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own (non-standard) flag for "launched from home screen".
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Single source of truth for "can/should we offer to install the PWA" —
 * replaces three independent, inconsistent reimplementations of the same
 * beforeinstallprompt/standalone-detection logic (PwaInstallPrompt.tsx,
 * the now-deleted dead PWABanner.tsx, and the new permanent Settings/
 * Sidebar entry points).
 */
export function usePwaInstall() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canPromptNatively, setCanPromptNatively] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandalone());
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanPromptNatively(true);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanPromptNatively(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    const deferredPrompt = deferredPromptRef.current;
    if (!deferredPrompt) return "unavailable";

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      deferredPromptRef.current = null;
      setCanPromptNatively(false);
    }
    return outcome;
  }, []);

  return { isInstalled, isIOS, canPromptNatively, promptInstall };
}
