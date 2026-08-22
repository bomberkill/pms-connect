"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/hooks/useData/useNotificationData";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { NotificationPreference, UpdateNotificationPreferencesInput } from "@/types/Notification";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function ToggleRow({
    label,
    checked,
    onCheckedChange,
    disabled,
}: {
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <label className="flex w-full items-center gap-3 px-4 py-3.5 border-t border-border first:border-t-0 cursor-pointer">
            <span className={cn("flex-1 text-[15px]", disabled && "text-muted-foreground")}>{label}</span>
            <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} disabled={disabled} />
        </label>
    );
}

export default function NotificationPreferencesView() {
    const dict = useDictionary();
    const router = useRouter();
    const { preferences, loading } = useNotificationPreferences();
    const { updateNotificationPreferences, updating } = useUpdateNotificationPreferences();

    const save = (patch: UpdateNotificationPreferencesInput) => {
        updateNotificationPreferences({ variables: { input: patch } }).catch(() => {});
    };

    if (loading || !preferences) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const toggle = (key: keyof NotificationPreference) => (checked: boolean) => save({ [key]: checked });

    return (
        <div className="pb-6">
            <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <span className="font-semibold text-lg">{dict.notificationPreferences.title}</span>
                {updating && <Loader2 className="size-4 animate-spin text-muted-foreground ml-auto" />}
            </div>

            <h2 className="px-4 pt-4 pb-1.5 font-mono text-2xs uppercase tracking-wider text-muted-foreground">
                {dict.notificationPreferences.typesSection}
            </h2>
            <div className="bg-card border-y border-border">
                <ToggleRow label={dict.notificationPreferences.notifyReplies} checked={preferences.notifyReplies} onCheckedChange={toggle("notifyReplies")} />
                <ToggleRow label={dict.notificationPreferences.notifyMentions} checked={preferences.notifyMentions} onCheckedChange={toggle("notifyMentions")} />
                <ToggleRow label={dict.notificationPreferences.notifyConnectionRequests} checked={preferences.notifyConnectionRequests} onCheckedChange={toggle("notifyConnectionRequests")} />
                <ToggleRow label={dict.notificationPreferences.notifyReactions} checked={preferences.notifyReactions} onCheckedChange={toggle("notifyReactions")} />
                <ToggleRow label={dict.notificationPreferences.notifyGroupActivity} checked={preferences.notifyGroupActivity} onCheckedChange={toggle("notifyGroupActivity")} />
                <ToggleRow label={dict.notificationPreferences.notifyEstablishmentAnnouncements} checked={preferences.notifyEstablishmentAnnouncements} onCheckedChange={toggle("notifyEstablishmentAnnouncements")} />
            </div>

            <h2 className="px-4 pt-4 pb-1.5 font-mono text-2xs uppercase tracking-wider text-muted-foreground">
                {dict.notificationPreferences.quietHoursSection}
            </h2>
            <div className="bg-card border-y border-border">
                <ToggleRow
                    label={dict.notificationPreferences.quietHoursEnabled}
                    checked={preferences.quietHoursEnabled}
                    onCheckedChange={toggle("quietHoursEnabled")}
                />
                {preferences.quietHoursEnabled && (
                    <div className="flex items-center gap-3 px-4 py-3.5 border-t border-border">
                        <div className="flex-1 grid gap-1">
                            <Label className="text-xs text-muted-foreground">{dict.notificationPreferences.quietHoursStart}</Label>
                            <Select
                                value={String(preferences.quietHoursStart ?? 20)}
                                onValueChange={(v) => save({ quietHoursStart: Number(v) })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {HOURS.map((h) => <SelectItem key={h} value={String(h)}>{h}h</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 grid gap-1">
                            <Label className="text-xs text-muted-foreground">{dict.notificationPreferences.quietHoursEnd}</Label>
                            <Select
                                value={String(preferences.quietHoursEnd ?? 7)}
                                onValueChange={(v) => save({ quietHoursEnd: Number(v) })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {HOURS.map((h) => <SelectItem key={h} value={String(h)}>{h}h</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>

            <h2 className="px-4 pt-4 pb-1.5 font-mono text-2xs uppercase tracking-wider text-muted-foreground">
                {dict.notificationPreferences.emailSection}
            </h2>
            <div className="bg-card border-y border-border">
                <ToggleRow
                    label={dict.notificationPreferences.weeklyEmailDigest}
                    checked={preferences.weeklyEmailDigest}
                    onCheckedChange={toggle("weeklyEmailDigest")}
                />
            </div>
        </div>
    );
}
