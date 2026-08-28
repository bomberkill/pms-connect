"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, ChevronRight, Clock3, Loader2, Mail, MessageCircle, ShieldAlert, Users, Zap } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/hooks/useData/useNotificationData";
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

function PreferenceSwitch({
    checked,
    disabled,
    onChange,
}: {
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                checked ? "bg-primary" : "bg-muted",
                disabled && "opacity-60"
            )}
        >
            <span
                className={cn(
                    "absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform",
                    checked ? "translate-x-6" : "translate-x-1"
                )}
            />
        </button>
    );
}

function PreferenceRow({
    title,
    subtitle,
    icon: Icon,
    checked,
    onCheckedChange,
    disabled,
    chevron,
}: {
    title: string;
    subtitle?: string;
    icon: typeof Bell;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    chevron?: boolean;
}) {
    return (
        <div className="flex w-full items-center gap-3 px-4 py-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary dark:bg-primary-950">
                <Icon className="size-4.5" strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1">
                <span className={cn("block text-[15px] font-semibold leading-tight", disabled && "text-muted-foreground")}>{title}</span>
                {subtitle && <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">{subtitle}</span>}
            </span>
            {typeof checked === "boolean" && onCheckedChange ? (
                <PreferenceSwitch checked={checked} onChange={onCheckedChange} disabled={disabled} />
            ) : chevron ? (
                <ChevronRight className="size-4 text-muted-foreground" />
            ) : null}
        </div>
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
        <div className="min-h-dvh bg-[#F6F8FA] pb-8 text-foreground dark:bg-background">
            <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
                <button onClick={() => router.back()} className="-ml-2 flex size-10 items-center justify-center rounded-full hover:bg-muted transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <span className="font-heading text-[18px] font-semibold tracking-[-0.02em]">{dict.notificationPreferences.title}</span>
                {updating && <Loader2 className="size-4 animate-spin text-muted-foreground ml-auto" />}
            </div>

            <h2 className="px-4 pt-5 pb-2 text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {dict.notificationPreferences.typesSection}
            </h2>
            <div className="mx-4 overflow-hidden rounded-[24px] border border-border bg-card shadow-xs divide-y divide-border">
                <PreferenceRow icon={MessageCircle} title={dict.notificationPreferences.notifyReplies} checked={preferences.notifyReplies} onCheckedChange={toggle("notifyReplies")} />
                <PreferenceRow icon={Bell} title={dict.notificationPreferences.notifyMentions} checked={preferences.notifyMentions} onCheckedChange={toggle("notifyMentions")} />
                <PreferenceRow icon={Users} title={dict.notificationPreferences.notifyConnectionRequests} checked={preferences.notifyConnectionRequests} onCheckedChange={toggle("notifyConnectionRequests")} />
                <PreferenceRow icon={Zap} title={dict.notificationPreferences.notifyReactions} subtitle={dict.notificationPreferences.notifyReactionsDesc} checked={preferences.notifyReactions} onCheckedChange={toggle("notifyReactions")} />
                <PreferenceRow icon={ShieldAlert} title={dict.notificationPreferences.notifyGroupActivity} subtitle={dict.notificationPreferences.notifyGroupActivityDesc} checked={preferences.notifyGroupActivity} onCheckedChange={toggle("notifyGroupActivity")} />
                <PreferenceRow icon={Bell} title={dict.notificationPreferences.notifyEstablishmentAnnouncements} checked={preferences.notifyEstablishmentAnnouncements} onCheckedChange={toggle("notifyEstablishmentAnnouncements")} />
            </div>

            <h2 className="px-4 pt-5 pb-2 text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {dict.notificationPreferences.quietHoursSection}
            </h2>
            <div className="mx-4 overflow-hidden rounded-[24px] border border-border bg-card shadow-xs">
                <PreferenceRow
                    icon={Clock3}
                    title={dict.notificationPreferences.quietHoursEnabled}
                    subtitle={dict.notificationPreferences.quietHoursSummary
                        .replace("{start}", String(preferences.quietHoursStart ?? 20))
                        .replace("{end}", String(preferences.quietHoursEnd ?? 7))}
                    checked={preferences.quietHoursEnabled}
                    onCheckedChange={toggle("quietHoursEnabled")}
                />
                {preferences.quietHoursEnabled && (
                    <div className="flex items-center gap-3 border-t border-border px-4 py-3.5">
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
                <p className="border-t border-border px-4 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
                    {dict.notificationPreferences.quietHoursDescription}
                </p>
            </div>

            <h2 className="px-4 pt-5 pb-2 text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {dict.notificationPreferences.emailSection}
            </h2>
            <div className="mx-4 overflow-hidden rounded-[24px] border border-border bg-card shadow-xs">
                <PreferenceRow
                    icon={Mail}
                    title={dict.notificationPreferences.weeklyEmailDigest}
                    subtitle={dict.notificationPreferences.weeklyEmailDigestDesc}
                    checked={preferences.weeklyEmailDigest}
                    onCheckedChange={toggle("weeklyEmailDigest")}
                />
            </div>
        </div>
    );
}
