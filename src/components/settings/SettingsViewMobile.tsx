"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { useMe } from "@/hooks/useData/useUserData";
import { useFcmToken } from "@/hooks/useData/index";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { resetPassword } from "@/graphql/betterAuth";
import { logoutUser, deactivateAccount } from "@/graphql/authActions";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { AccountStatusGQL, UserTypeGQL } from "@/types/User";
import { cn } from "@/lib/utils";
import {
    ChevronRight,
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
    const params = useParams<{ lang?: string }>();
    const { open } = useNotification();
    const { me, loading: meLoading } = useMe();
    const { requestPermission, permissionState } = useFcmToken();
    const [notifState, setNotifState] = useState(permissionState);
    const { isInstalled, isIOS, canPromptNatively, promptInstall } = usePwaInstall();
    const [sendingReset, setSendingReset] = useState(false);
    const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
    const [deactivating, setDeactivating] = useState(false);
    const currentLang = params?.lang === "fr" ? "fr" : "en";

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

    const handleInstallClick = async () => {
        if (isIOS) {
            open("info", dict.pwa.installTitle, {
                message: `${dict.pwa.iosTapShare} ${dict.pwa.iosAndSelect} "${dict.pwa.iosAddHome}"`,
            });
            return;
        }
        if (canPromptNatively) {
            await promptInstall();
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

    const handleDeactivate = async () => {
        setDeactivating(true);
        try {
            await deactivateAccount();
            router.push("/login");
        } catch (e: unknown) {
            open("error", (e as Error).message || dict.globalErrors.default);
        } finally {
            setDeactivating(false);
            setDeactivateDialogOpen(false);
        }
    };

    return (
        <div className="pb-24">
            <div className="sticky top-0 z-20 border-b border-border/70 bg-background/90 px-4 py-4 backdrop-blur-xl">
                <h1 className="text-[1.65rem] font-black tracking-[-0.04em]">{dict.settings.title}</h1>
            </div>

            <button
                type="button"
                onClick={() => router.push(`/profile/${me.slug}`)}
                className="mt-3 flex w-full items-center gap-3 border-y border-border bg-card px-4 py-3.5 text-left"
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
                    label={dict.settings.labels.changePassword}
                    onClick={handlePasswordReset}
                    loading={sendingReset}
                />
                <Row
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
                    label={dict.settings.sections.language}
                    value={<span className="text-sm text-muted-foreground mr-1">{currentLang === "fr" ? "Français" : "English"}</span>}
                    onClick={() => { window.location.href = currentLang === "fr" ? "/en/settings" : "/fr/settings"; }}
                />
            </div>

            <h2 className="px-4 pt-4 pb-1.5 font-mono text-2xs uppercase tracking-wider text-muted-foreground">
                {dict.settings.sections.privacy}
            </h2>
            <div className="bg-card border-y border-border">
                <Row
                    label={dict.settings.labels.publicProfileVisibility}
                    value={<span className="max-w-[11rem] text-right text-sm leading-snug text-muted-foreground">{dict.settings.labels.nameAndSpecialtyOnly}</span>}
                />
                <Row
                    label={dict.settings.labels.whoCanRequest}
                    value={<span className="max-w-[11rem] text-right text-sm leading-snug text-muted-foreground">{dict.settings.labels.verifiedMembersOnly}</span>}
                />
                <Row
                    label={dict.settings.labels.emailNotifications}
                    onClick={() => router.push("/settings/notifications")}
                    value={<span className="text-sm text-muted-foreground mr-1">{dict.settings.labels.manage}</span>}
                />
            </div>

            <h2 className="px-4 pt-4 pb-1.5 font-mono text-2xs uppercase tracking-wider text-muted-foreground">
                {dict.settings.tabs.preferences}
            </h2>
            <div className="bg-card border-y border-border">
                <Row
                    label={dict.settings.labels.pushNotifications}
                    onClick={handleToggleNotifications}
                    disabled={notifState === "granted"}
                    value={
                        <span className="text-sm text-muted-foreground mr-1">
                            {notifState === "granted" ? dict.settings.labels.enabled : dict.settings.labels.enable}
                        </span>
                    }
                />
                <Row
                    label={dict.settings.labels.notificationPreferences}
                    onClick={() => router.push("/settings/notifications")}
                />
                {!isInstalled && (
                    <Row
                        label={dict.settings.labels.installApp}
                        onClick={handleInstallClick}
                        value={<span className="text-sm text-muted-foreground mr-1">{dict.common.install}</span>}
                    />
                )}
            </div>

            <div className="mt-4 bg-card border-y border-border">
                <Row label={dict.appSideBar.navUser.logout} onClick={handleLogout} danger />
                <Row
                    label={dict.settings.labels.deactivateAccount}
                    onClick={() => setDeactivateDialogOpen(true)}
                    danger
                />
            </div>

            <ConfirmationDialog
                open={deactivateDialogOpen}
                onOpenChange={setDeactivateDialogOpen}
                onConfirm={handleDeactivate}
                title={dict.settings.labels.deactivateAccount}
                message={dict.settings.labels.deactivateAccountConfirm}
                confirmText={deactivating ? dict.settings.labels.deactivating : dict.settings.labels.deactivateAccount}
                cancelText={dict.button.cancel}
            />

            <p className="px-4 pt-4 font-mono text-xs text-muted-foreground">
                {dict.settings.labels.version.replace("{version}", packageJson.version)}
            </p>
        </div>
    );
}
