"use client";

import React, { useState } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertTriangle, BadgeAlert, FileWarning, Loader2, Megaphone, ShieldAlert } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { useReportActions } from "@/hooks/useData/useReportData";
import { ReportReason } from "@/types/Report";
import { cn } from "@/lib/utils";

interface ReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    postId?: string;
    commentId?: string;
    reportedUserId?: string;
}

const REASONS = [
    ReportReason.PATIENT_DATA,
    ReportReason.MEDICAL_MISINFORMATION,
    ReportReason.ADVERTISING,
    ReportReason.TITLE_IMPERSONATION,
    ReportReason.OTHER,
];

const REASON_ICONS: Record<ReportReason, typeof ShieldAlert> = {
    [ReportReason.PATIENT_DATA]: ShieldAlert,
    [ReportReason.MEDICAL_MISINFORMATION]: FileWarning,
    [ReportReason.ADVERTISING]: Megaphone,
    [ReportReason.TITLE_IMPERSONATION]: BadgeAlert,
    [ReportReason.OTHER]: AlertTriangle,
};

export default function ReportDialog({ open, onOpenChange, postId, commentId, reportedUserId }: ReportDialogProps) {
    const dict = useDictionary();
    const { open: notify } = useNotification();
    const { createReport, submitting } = useReportActions();
    const [reason, setReason] = useState<ReportReason | undefined>(undefined);
    const [details, setDetails] = useState("");

    const reasonLabels: Record<ReportReason, string> = {
        [ReportReason.PATIENT_DATA]: dict.report.reasons.patientData,
        [ReportReason.MEDICAL_MISINFORMATION]: dict.report.reasons.medicalMisinformation,
        [ReportReason.ADVERTISING]: dict.report.reasons.advertising,
        [ReportReason.TITLE_IMPERSONATION]: dict.report.reasons.titleImpersonation,
        [ReportReason.OTHER]: dict.report.reasons.other,
    };

    const reset = () => {
        setReason(undefined);
        setDetails("");
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    const submitReport = async (selectedReason: ReportReason, selectedDetails?: string) => {
        try {
            await createReport({
                variables: {
                    input: {
                        postId,
                        commentId,
                        reportedUserId,
                        reason: selectedReason,
                        details: selectedReason === ReportReason.OTHER ? selectedDetails?.trim() || undefined : undefined,
                    },
                },
            });
            notify("success", dict.report.successTitle, { message: dict.report.successMessage });
            handleOpenChange(false);
        } catch (error) {
            notify("error", dict.report.errorTitle, {
                message: error instanceof Error ? error.message : dict.report.errorTitle,
            });
        }
    };

    const handleReasonSelect = (selectedReason: ReportReason) => {
        setReason(selectedReason);
        if (selectedReason !== ReportReason.OTHER) {
            void submitReport(selectedReason);
        }
    };

    const handleSubmit = () => {
        if (!reason) return;
        void submitReport(reason, details);
    };

    const canSubmit = !!reason && (reason !== ReportReason.OTHER || details.trim().length > 0);

    return (
        <Drawer open={open} onOpenChange={handleOpenChange}>
            <DrawerContent className="rounded-t-[28px]">
                <DrawerHeader className="px-5 pb-2 text-left">
                    <DrawerTitle className="text-[20px]">{dict.report.title}</DrawerTitle>
                    <DrawerDescription className="text-[13.5px] leading-relaxed">{dict.report.description}</DrawerDescription>
                </DrawerHeader>
                <div className="px-3 pb-4">
                    <div className="overflow-hidden rounded-[22px] border border-border bg-card shadow-xs">
                        {REASONS.map((r) => {
                            const Icon = REASON_ICONS[r];
                            const selected = reason === r;

                            return (
                                <button
                                    key={r}
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => handleReasonSelect(r)}
                                    className={cn(
                                        "flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-b-0 transition-colors hover:bg-muted/60",
                                        selected && "bg-primary-50 text-primary dark:bg-primary-950"
                                    )}
                                >
                                    <span className={cn(
                                        "flex size-10 shrink-0 items-center justify-center rounded-full",
                                        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        {submitting && selected ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Icon className="size-4.5" strokeWidth={1.9} />
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1 text-[15px] font-semibold leading-tight">{reasonLabels[r]}</span>
                                </button>
                            );
                        })}
                    </div>
                    {reason === ReportReason.OTHER && (
                        <div className="mt-4 space-y-3">
                            <Textarea
                                placeholder={dict.report.detailsPlaceholder}
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                className="min-h-24 resize-none rounded-[18px] border-border bg-background text-[14px]"
                                rows={3}
                            />
                            <Button
                                onClick={handleSubmit}
                                disabled={!canSubmit || submitting}
                                className="h-11 w-full rounded-full"
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {dict.report.submit}
                            </Button>
                        </div>
                    )}
                </div>
                <DrawerFooter className="hidden" />
            </DrawerContent>
        </Drawer>
    );
}
