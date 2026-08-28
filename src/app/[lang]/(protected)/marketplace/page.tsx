"use client";

import { Store } from "lucide-react";
import WorkInProgress from "@/components/WorkInProgress";
import { useDictionary } from "@/hooks/use-dictionary";

export default function MarketplacePage() {
    const dict = useDictionary();
    return (
        <WorkInProgress
            icon={Store}
            title={dict.comingSoon.marketplace.title}
            description={dict.comingSoon.marketplace.description}
            notifyKey="pmsconnect-notify-marketplace"
            footer={
                <div className="max-w-xs rounded-[1.25rem] border border-border bg-card p-4 text-left">
                    <p className="text-sm font-black tracking-[-0.02em]">{dict.comingSoon.jobs.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{dict.comingSoon.jobs.description}</p>
                </div>
            }
        />
    )
}
