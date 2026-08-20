"use client";

import { MessageCircle } from "lucide-react";
import WorkInProgress from "@/components/WorkInProgress";
import { useDictionary } from "@/hooks/use-dictionary";

export default function ChatPage() {
    const dict = useDictionary();
    return (
        <WorkInProgress
            icon={MessageCircle}
            title={dict.comingSoon.chat.title}
            description={dict.comingSoon.chat.description}
            notifyKey="pmsconnect-notify-chat"
        />
    )
}
