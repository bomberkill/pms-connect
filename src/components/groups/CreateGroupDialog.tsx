"use client";

import React, { useState } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import { Loader2, Plus } from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

function GroupForm({ afterSubmit, className }: { afterSubmit: () => void, className?: string }) {
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
        <form onSubmit={formik.handleSubmit} className={cn("space-y-4", className)}>
            <div className="grid gap-1">
                <Label htmlFor="name">{dict.groups.form.name}</Label>
                <Input id="name" placeholder={dict.groups.form.namePlaceholder} {...formik.getFieldProps("name")} />
                {formik.touched.name && formik.errors.name && (
                    <p className="text-destructive text-xs">{formik.errors.name}</p>
                )}
            </div>
            <div className="grid gap-1">
                <Label htmlFor="description">{dict.groups.form.description}</Label>
                <Textarea
                    id="description"
                    placeholder={dict.groups.form.descriptionPlaceholder}
                    className="resize-none"
                    {...formik.getFieldProps("description")}
                />
                {formik.touched.description && formik.errors.description && (
                    <p className="text-destructive text-xs">{formik.errors.description}</p>
                )}
            </div>
            <div className="grid gap-1">
                <Label htmlFor="privacy">{dict.groups.form.privacy}</Label>
                <Select
                    value={formik.values.privacy}
                    onValueChange={(value) => formik.setFieldValue("privacy", value)}
                >
                    <SelectTrigger id="privacy">
                        <SelectValue placeholder={dict.groups.form.selectPrivacy} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={GroupPrivacy.PUBLIC}>{dict.groups.form.public}</SelectItem>
                        <SelectItem value={GroupPrivacy.PRIVATE}>{dict.groups.form.private}</SelectItem>
                        <SelectItem value={GroupPrivacy.SECRET}>{dict.groups.form.secret}</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">{privacyDesc}</p>
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
            <Button type="submit" disabled={creating} className="w-full md:w-auto">
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {dict.groups.form.createBtn}
            </Button>
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
                <DrawerContent>
                    <DrawerHeader className="text-left">
                        <DrawerTitle>{dict.groups.form.dialogTitle}</DrawerTitle>
                        <DrawerDescription>
                            {dict.groups.form.dialogDesc}
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-4">
                        <GroupForm afterSubmit={() => setOpen(false)} />
                    </div>
                    <DrawerFooter className="pt-2" />
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
