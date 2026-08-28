"use client";

import React, { useState } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import { ImagePlus, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useGroupMutations } from "@/hooks/useData/useGroups";
import { GroupPrivacy } from "@/types/Group";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/hooks/use-dictionary";

interface CreateGroupFormValues {
    name: string;
    description: string;
    privacy: GroupPrivacy;
    postsRequireApproval: boolean;
    restrictToVerifiedTitles: boolean;
    rules: string;
}

interface CreateGroupDialogProps {
    children?: React.ReactNode;
}

function GroupForm({
    afterSubmit,
    className,
    formId,
    hideSubmit,
}: {
    afterSubmit: () => void;
    className?: string;
    formId?: string;
    hideSubmit?: boolean;
}) {
    const router = useRouter();
    const { createGroup, creating } = useGroupMutations();
    const dict = useDictionary();

    const createGroupSchema = yup.object({
        name: yup.string().min(3).max(100).required(),
        description: yup.string().max(500).optional(),
        privacy: yup.mixed<GroupPrivacy>().oneOf(Object.values(GroupPrivacy)).required(),
    });

    const formik = useFormik<CreateGroupFormValues>({
        initialValues: {
            name: "",
            description: "",
            privacy: GroupPrivacy.PUBLIC,
            postsRequireApproval: false,
            restrictToVerifiedTitles: false,
            rules: "",
        },
        validationSchema: createGroupSchema,
        onSubmit: async (values) => {
            try {
                const result = await createGroup({
                    variables: {
                        createGroupInput: {
                            name: values.name,
                            description: values.description,
                            privacy: values.privacy,
                            postsRequireApproval: values.postsRequireApproval,
                            restrictToVerifiedTitles: values.restrictToVerifiedTitles,
                            rules: values.rules
                                .split("\n")
                                .map((r) => r.trim())
                                .filter(Boolean),
                        }
                    },
                });

                if (result.data?.createGroup) {
                    toast.success(dict.groups.form.createSuccess);
                    formik.resetForm();
                    afterSubmit();
                    router.push(`/groups/${result.data.createGroup.slug}`);
                }
            } catch (error) {
                console.error("Failed to create group:", error);
                toast.error(dict.groups.form.createError);
            }
        },
    });

    const privacyDesc = formik.values.privacy === GroupPrivacy.PUBLIC
        ? dict.groups.form.publicDesc
        : formik.values.privacy === GroupPrivacy.PRIVATE
            ? dict.groups.form.privateDesc
            : dict.groups.form.secretDesc;

    return (
        <form id={formId} onSubmit={formik.handleSubmit} className={cn("space-y-4", className)}>
            <div className="rounded-[1.35rem] border border-dashed border-border bg-muted/45 p-4">
                <div className="flex h-24 items-center justify-center rounded-[1rem] bg-background/70 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2 text-xs font-semibold">
                        <ImagePlus className="h-5 w-5" />
                        {dict.groups.form.banner}
                    </div>
                </div>
            </div>
            <div className="grid gap-1">
                <Label htmlFor="name">{dict.groups.form.name}</Label>
                <Input id="name" className="h-11" placeholder={dict.groups.form.namePlaceholder} {...formik.getFieldProps("name")} />
                {formik.touched.name && formik.errors.name && (
                    <p className="text-destructive text-xs">{formik.errors.name}</p>
                )}
            </div>
            <div className="grid gap-1">
                <Label htmlFor="description">{dict.groups.form.description}</Label>
                <Textarea
                    id="description"
                    placeholder={dict.groups.form.descriptionPlaceholder}
                    className="min-h-28 resize-none"
                    {...formik.getFieldProps("description")}
                />
                {formik.touched.description && formik.errors.description && (
                    <p className="text-destructive text-xs">{formik.errors.description}</p>
                )}
            </div>
            <div className="grid gap-1">
                <Label htmlFor="privacy">{dict.groups.form.privacy}</Label>
                <div className="grid gap-2">
                    {[GroupPrivacy.PRIVATE, GroupPrivacy.PUBLIC, GroupPrivacy.SECRET].map((privacy) => (
                        <button
                            key={privacy}
                            type="button"
                            onClick={() => formik.setFieldValue("privacy", privacy)}
                            className={cn(
                                "rounded-[1.1rem] border p-3 text-left transition-colors",
                                formik.values.privacy === privacy
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-card"
                            )}
                        >
                            <span className="text-sm font-bold">
                                {privacy === GroupPrivacy.PUBLIC
                                    ? dict.groups.form.public
                                    : privacy === GroupPrivacy.PRIVATE
                                        ? dict.groups.form.private
                                        : dict.groups.form.secret}
                            </span>
                            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                                {privacy === GroupPrivacy.PUBLIC
                                    ? dict.groups.form.publicDesc
                                    : privacy === GroupPrivacy.PRIVATE
                                        ? dict.groups.form.privateDesc
                                        : dict.groups.form.secretDesc}
                            </span>
                        </button>
                    ))}
                </div>
                <p className="sr-only">{privacyDesc}</p>
            </div>
            <div className="flex items-start gap-2">
                <Checkbox
                    id="postsRequireApproval"
                    checked={formik.values.postsRequireApproval}
                    onCheckedChange={(checked) => formik.setFieldValue("postsRequireApproval", checked === true)}
                />
                <Label htmlFor="postsRequireApproval" className="font-normal leading-tight">
                    {dict.groups.form.postsRequireApproval}
                </Label>
            </div>
            <div className="flex items-start gap-2">
                <Checkbox
                    id="restrictToVerifiedTitles"
                    checked={formik.values.restrictToVerifiedTitles}
                    onCheckedChange={(checked) => formik.setFieldValue("restrictToVerifiedTitles", checked === true)}
                />
                <Label htmlFor="restrictToVerifiedTitles" className="font-normal leading-tight">
                    {dict.groups.form.restrictToVerifiedTitles}
                </Label>
            </div>
            <div className="grid gap-1">
                <Label htmlFor="rules">{dict.groups.form.rules}</Label>
                <Textarea
                    id="rules"
                    placeholder={dict.groups.form.rulesPlaceholder}
                    className="resize-none"
                    rows={4}
                    {...formik.getFieldProps("rules")}
                />
            </div>
            {!hideSubmit && (
                <Button type="submit" disabled={creating} className="w-full md:w-auto">
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {dict.groups.form.createBtn}
                </Button>
            )}
        </form>
    );
}

export function CreateGroupDialog({ children }: CreateGroupDialogProps) {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();
    const dict = useDictionary();

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    {children || (
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> {dict.groups.form.createBtn}
                        </Button>
                    )}
                </DrawerTrigger>
                <DrawerContent className="h-[100svh] rounded-none">
                    <DrawerHeader className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <button type="button" className="text-sm font-semibold text-primary" onClick={() => setOpen(false)}>
                                {dict.common.cancel}
                            </button>
                            <DrawerTitle className="text-base font-black tracking-[-0.02em]">{dict.groups.form.newGroup}</DrawerTitle>
                            <Button type="submit" form="create-group-mobile-form" size="sm" className="h-8 rounded-full px-4 text-xs">
                                {dict.groups.form.createAction}
                            </Button>
                        </div>
                        <DrawerDescription className="sr-only">
                            {dict.groups.form.dialogDesc}
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4">
                        <GroupForm
                            formId="create-group-mobile-form"
                            afterSubmit={() => setOpen(false)}
                            hideSubmit
                        />
                    </div>
                    <DrawerFooter className="hidden" />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> {dict.groups.form.createBtn}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{dict.groups.form.dialogTitle}</DialogTitle>
                    <DialogDescription>
                        {dict.groups.form.dialogDesc}
                    </DialogDescription>
                </DialogHeader>
                <GroupForm afterSubmit={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
