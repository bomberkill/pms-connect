"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useGroupMutations } from "@/hooks/useData/useGroups";
import { useDictionary } from "@/hooks/use-dictionary";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Group, GroupPrivacy } from "@/types/Group";
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

interface EditGroupFormValues {
    name: string;
    description: string;
    privacy: GroupPrivacy;
    postsRequireApproval: boolean;
    restrictToVerifiedTitles: boolean;
    rules: string;
}

interface EditGroupDialogProps {
    group: Group;
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

function EditGroupForm({
    group,
    afterSubmit,
    className,
}: {
    group: Group;
    afterSubmit: () => void;
    className?: string;
}) {
    const router = useRouter();
    const dict = useDictionary();
    const { updateGroup, updating } = useGroupMutations();

    const editGroupSchema = yup.object({
        name: yup.string().min(3).max(100).required(),
        description: yup.string().max(500).optional(),
        privacy: yup.mixed<GroupPrivacy>().oneOf(Object.values(GroupPrivacy)).required(),
    });

    const formik = useFormik<EditGroupFormValues>({
        initialValues: {
            name: group.name,
            description: group.description || "",
            privacy: group.privacy,
            postsRequireApproval: group.postsRequireApproval,
            restrictToVerifiedTitles: group.restrictToVerifiedTitles,
            rules: (group.rules || []).join("\n"),
        },
        validationSchema: editGroupSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                const result = await updateGroup({
                    variables: {
                        groupId: group._id,
                        updateGroupInput: {
                            name: values.name,
                            description: values.description,
                            privacy: values.privacy,
                            postsRequireApproval: values.postsRequireApproval,
                            restrictToVerifiedTitles: values.restrictToVerifiedTitles,
                            rules: values.rules
                                .split("\n")
                                .map((r) => r.trim())
                                .filter(Boolean),
                        },
                    },
                });

                if (result.data?.updateGroup) {
                    toast.success(dict.groups.form.updateSuccess);
                    afterSubmit();
                    router.push(`/groups/${result.data.updateGroup.slug}`);
                    router.refresh();
                }
            } catch {
                toast.error(dict.groups.form.updateError);
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
            <Button type="submit" disabled={updating} className="w-full md:w-auto">
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {dict.groups.form.updateBtn}
            </Button>
        </form>
    );
}

export default function EditGroupDialog({ group, children, open: controlledOpen, onOpenChange }: EditGroupDialogProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const isMobile = useIsMobile();
    const dict = useDictionary();
    const open = controlledOpen ?? uncontrolledOpen;
    const setOpen = onOpenChange ?? setUncontrolledOpen;

    const trigger = children || (
        <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" /> {dict.groups.edit}
        </Button>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>{trigger}</DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader className="text-left">
                        <DrawerTitle>{dict.groups.form.editDialogTitle}</DrawerTitle>
                        <DrawerDescription>{dict.groups.form.editDialogDesc}</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-4">
                        <EditGroupForm group={group} afterSubmit={() => setOpen(false)} />
                    </div>
                    <DrawerFooter className="pt-2" />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{dict.groups.form.editDialogTitle}</DialogTitle>
                    <DialogDescription>{dict.groups.form.editDialogDesc}</DialogDescription>
                </DialogHeader>
                <EditGroupForm group={group} afterSubmit={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
