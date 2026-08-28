"use client";

import { useEffect, useState } from "react";
import { RotateCcw, WifiOff } from "lucide-react";

import { useDictionary } from "@/hooks/use-dictionary";

export default function OfflineStatusBanner() {
    const dict = useDictionary();
    const [mounted, setMounted] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const syncStatus = () => setIsOffline(!navigator.onLine);

        setMounted(true);
        syncStatus();
        window.addEventListener("online", syncStatus);
        window.addEventListener("offline", syncStatus);

        return () => {
            window.removeEventListener("online", syncStatus);
            window.removeEventListener("offline", syncStatus);
        };
    }, []);

    if (!mounted || !isOffline) return null;

    return (
        <div className="fixed inset-x-0 top-0 z-[80] bg-neutral-950 px-4 py-2.5 text-white shadow-lg">
            <div className="mx-auto flex max-w-screen-sm items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <WifiOff className="size-4" strokeWidth={2} />
                </span>
                <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug">
                    {dict.offlineStatus.title}
                    <span className="ml-1 font-medium text-white/70">{dict.offlineStatus.description}</span>
                </p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-neutral-950"
                >
                    <RotateCcw className="size-3.5" strokeWidth={2.1} />
                    {dict.offlineStatus.retry}
                </button>
            </div>
        </div>
    );
}
