"use client";

import React, { useEffect, useState } from "react";
import { useFcmToken, useMe } from "@/hooks/useData/index";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";

export function NotificationPermissionModal() {
    const dict = useDictionary();
    const { me } = useMe();
    const { requestPermission, permissionState } = useFcmToken();
    const [isOpen, setIsOpen] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        // Only show if:
        // 1. User is logged in
        // 2. Permission is 'default' (not granted, not denied)
        // 3. User hasn't dismissed it permanently
        // 4. We are on client side (window check implicit in useFcmToken/useEffect)

        if (!me) return;

        if (permissionState === "default") {
            const dismissed = localStorage.getItem("pms_notification_prompt_dismissed");
            if (!dismissed) {
                // Small delay to not be intrusive immediately on load
                const timer = setTimeout(() => setIsOpen(true), 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [me, permissionState]);

    const handleEnable = async () => {
        const granted = await requestPermission();
        setIsOpen(false);
        if (granted) {
            // success handling if needed (toast handled in hook or component)
        }
    };

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem("pms_notification_prompt_dismissed", "true");
        }
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        {dict.settings.labels.pushNotifications || "Notifications"}
                    </DialogTitle>
                    <DialogDescription>
                        {dict.settings?.labels?.notificationsDisabled || "Enable notifications to stay updated with likes, comments, and messages."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center space-x-2 my-4">
                    <Checkbox
                        id="dontShow"
                        checked={dontShowAgain}
                        onCheckedChange={(checked: boolean | string) => setDontShowAgain(checked === true)}
                    />
                    <label
                        htmlFor="dontShow"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        {dict.common?.notNow || "Don't ask again"}
                    </label>
                </div>

                <DialogFooter className="sm:justify-start">
                    <Button type="button" variant="default" onClick={handleEnable} className="w-full sm:w-auto">
                        {dict.settings.labels.enable || "Enable"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleClose} className="w-full sm:w-auto mt-2 sm:mt-0">
                        {dict.common.cancel || "Later"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
