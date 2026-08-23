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
        />
    )
}
