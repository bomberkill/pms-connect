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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { useReportActions } from "@/hooks/useData/useReportData";
import { ReportReason } from "@/types/Report";

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

    const handleSubmit = async () => {
        if (!reason) return;
        try {
            await createReport({
                variables: {
                    input: {
                        postId,
                        commentId,
                        reportedUserId,
                        reason,
                        details: reason === ReportReason.OTHER ? details.trim() || undefined : undefined,
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

    const canSubmit = !!reason && (reason !== ReportReason.OTHER || details.trim().length > 0);

    return (
        <Drawer open={open} onOpenChange={handleOpenChange}>
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>{dict.report.title}</DrawerTitle>
                    <DrawerDescription>{dict.report.description}</DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-4 space-y-4">
                    <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)} className="gap-2">
                        {REASONS.map((r) => (
                            <label
                                key={r}
                                htmlFor={`reason-${r}`}
                                className="flex cursor-pointer items-center gap-3 rounded-field border border-border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-50"
                            >
                                <RadioGroupItem value={r} id={`reason-${r}`} />
                                <span className="text-sm">{reasonLabels[r]}</span>
                            </label>
                        ))}
                    </RadioGroup>
                    {reason === ReportReason.OTHER && (
                        <Textarea
                            placeholder={dict.report.detailsPlaceholder}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    )}
                </div>
                <DrawerFooter className="pt-0">
                    <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {dict.report.submit}
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
