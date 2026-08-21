"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { useMe } from "@/hooks/useData/useUserData";
import { useFcmToken } from "@/hooks/useData/index";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { resetPassword } from "@/graphql/betterAuth";
import { logoutUser } from "@/graphql/authActions";
import { AccountStatusGQL, UserTypeGQL } from "@/types/User";
import { cn } from "@/lib/utils";
import {
    ChevronRight,
    Lock,
    ShieldCheck,
    Languages,
    Bell,
    LogOut,
    Loader2,
} from "lucide-react";
import packageJson from "../../../package.json";

function Row({
    icon: Icon,
    label,
    value,
    onClick,
    danger,
    loading,
    disabled,
}: {
    icon?: React.ElementType;
    label: string;
    value?: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
    loading?: boolean;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className={cn(
                "flex w-full items-center gap-3 px-4 py-3.5 text-left border-t border-border first:border-t-0 disabled:opacity-60",
                danger ? "text-error" : "text-foreground"
            )}
        >
            {Icon && <Icon className={cn("size-[19px] shrink-0", danger ? "text-error" : "text-muted-foreground")} />}
            <span className="flex-1 text-[15px]">{label}</span>
            {loading ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
                <>
                    {value}
                    {onClick && !danger && <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
                </>
            )}
        </button>
    );
}

export default function SettingsViewMobile() {
    const dict = useDictionary();
    const router = useRouter();
    const { open } = useNotification();
    const { me, loading: meLoading } = useMe();
    const { requestPermission, permissionState } = useFcmToken();
    const [notifState, setNotifState] = useState(permissionState);
    const [sendingReset, setSendingReset] = useState(false);
    const currentLang = typeof window !== "undefined" && window.location.pathname.startsWith("/fr") ? "fr" : "en";

    if (meLoading || !me) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const isVerified = me.accountStatus === AccountStatusGQL.ACTIVE;

    const handlePasswordReset = async () => {
        setSendingReset(true);
        try {
            await resetPassword(me.email);
            open("success", dict.notifications.forgotPassword.success.title);
        } catch (e: unknown) {
            open("error", (e as Error).message || dict.globalErrors.default);
        } finally {
            setSendingReset(false);
        }
    };

    const handleToggleNotifications = async () => {
        if (notifState === "granted") return;
        const granted = await requestPermission();
        setNotifState(granted ? "granted" : "denied");
        open(granted ? "success" : "error", granted ? dict.settings.labels.enabledSuccess : dict.settings.labels.deniedError);
    };

    const handleLogout = async () => {
        await logoutUser();
        router.push("/login");
    };

    return (
        <div className="pb-6">
            <button
                type="button"
                onClick={() => router.push(`/profile/${me.slug}`)}
                className="flex w-full items-center gap-3 bg-card border-y border-border px-4 py-3.5 text-left"
            >
                <Avatar shape={me.userType === UserTypeGQL.LEGAL_ENTITY ? "establishment" : "person"} className="size-12 shrink-0">
                    <AvatarImage className="object-cover" src={me.profilePicUrl} alt={getUserDisplayName(me)} />
                    <AvatarFallback>{getUserInitials(me)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold truncate">{getUserDisplayName(me)}</p>
                    <p className="text-[13px] text-muted-foreground truncate">{me.email}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </button>

            <h2 className="px-4 pt-4 pb-1.5 font-mono text-2xs uppercase tracking-wider text-muted-foreground">
                {dict.settings.tabs.account}
            </h2>
            <div className="bg-card border-y border-border">
                <Row
                    icon={Lock}
                    label={dict.settings.labels.changePassword}
                    onClick={handlePasswordReset}
                    loading={sendingReset}
                />
                <Row
                    icon={ShieldCheck}
                    label={dict.settings.labels.verificationDocuments}
                    onClick={() => router.push(`/profile/${me.slug}`)}
                    value={
                        <span className={cn(
                            "text-[11.5px] font-semibold rounded-full px-2 py-0.5 mr-1",
                            isVerified ? "bg-secondary-100 text-secondary-800" : "bg-muted text-muted-foreground"
                        )}>
                            {isVerified ? dict.settings.labels.verified : dict.settings.labels.notVerified}
                        </span>
                    }
                />
                <Row
                    icon={Languages}
                    label={dict.settings.sections.language}
                    value={<span className="text-sm text-muted-foreground mr-1">{currentLang === "fr" ? "Français" : "English"}</span>}
                    onClick={() => { window.location.href = currentLang === "fr" ? "/en/settings" : "/fr/settings"; }}
                />
                <Row
                    icon={Bell}
                    label={dict.settings.labels.pushNotifications}
                    onClick={handleToggleNotifications}
                    disabled={notifState === "granted"}
                    value={
                        <span className="text-sm text-muted-foreground mr-1">
                            {notifState === "granted" ? dict.settings.labels.enabled : dict.settings.labels.enable}
                        </span>
                    }
                />
            </div>

            <div className="mt-4 bg-card border-y border-border">
                <Row icon={LogOut} label={dict.appSideBar.navUser.logout} onClick={handleLogout} danger />
            </div>

            <p className="px-4 pt-4 font-mono text-xs text-muted-foreground">
                {dict.settings.labels.version.replace("{version}", packageJson.version)}
            </p>
        </div>
    );
}
