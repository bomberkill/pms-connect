"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDictionary } from "@/hooks/use-dictionary";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const DISMISS_KEY = "pwa-prompt-dismissed-at";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — reappears after a while rather than "never again" or "every page load"

function wasRecentlyDismissed(): boolean {
  const dismissedAt = Number(localStorage.getItem(DISMISS_KEY));
  return Number.isFinite(dismissedAt) && dismissedAt > 0 && Date.now() - dismissedAt < SNOOZE_MS;
}

export default function PwaInstallPrompt() {
  const dict = useDictionary();
  const { isInstalled, isIOS, canPromptNatively, promptInstall } = usePwaInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInstalled || wasRecentlyDismissed()) {
      setIsVisible(false);
      return;
    }
    // iOS has no beforeinstallprompt — show the manual-instructions banner
    // as soon as we know it's iOS and not already installed/dismissed.
    // Non-iOS waits for canPromptNatively (native install becomes offerable).
    if (isIOS || canPromptNatively) {
      setIsVisible(true);
    }
  }, [isInstalled, isIOS, canPromptNatively]);

  const handleInstallClick = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      setIsVisible(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <div className="bg-background/95 backdrop-blur-sm border shadow-lg rounded-xl p-4 flex items-start gap-4 ring-1 ring-border">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{dict.pwa.installTitle}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isIOS ? (
                  <span>
                    {dict.pwa.iosTapShare} <Share className="w-3 h-3 inline mx-1" /> {dict.pwa.iosAndSelect} <strong>&quot;{dict.pwa.iosAddHome}&quot;</strong>
                  </span>
                ) : (
                  dict.pwa.installDesc
                )}
              </p>
              {!isIOS && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleInstallClick} className="h-8 text-xs">
                    {dict.common.install}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleClose} className="h-8 text-xs">
                    {dict.common.notNow}
                  </Button>
                </div>
              )}
            </div>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground" aria-label={dict.common.notNow}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
