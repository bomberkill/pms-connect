"use client";

import { Briefcase } from "lucide-react";
import WorkInProgress from "@/components/WorkInProgress";
import { useDictionary } from "@/hooks/use-dictionary";

export default function JobsPage() {
    const dict = useDictionary();
    return (
        <WorkInProgress
            icon={Briefcase}
            title={dict.comingSoon.jobs.title}
            description={dict.comingSoon.jobs.description}
            notifyKey="pmsconnect-notify-marketplace"
        />
    )
}
