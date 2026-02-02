"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDictionary } from "@/hooks/use-dictionary";

export default function PwaInstallPrompt() {
    const dict = useDictionary();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if it is iOS
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIosDevice);

        // Prevent Chrome 67 and earlier from automatically showing the prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsVisible(false);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    // Handle iOS visibility
    useEffect(() => {
        if (isIOS && !window.matchMedia("(display-mode: standalone)").matches) {
            const isDismissed = localStorage.getItem('pwa-prompt-dismissed');
            if (!isDismissed) {
                setIsVisible(true);
            }
        }
    }, [isIOS]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        if (isIOS) {
            localStorage.setItem('pwa-prompt-dismissed', 'true');
        }
    }

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
                        <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
