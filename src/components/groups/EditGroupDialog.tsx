"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const editGroupSchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    privacy: z.nativeEnum(GroupPrivacy),
});

type EditGroupFormValues = z.infer<typeof editGroupSchema>;

interface EditGroupDialogProps {
    group: Group;
    children?: React.ReactNode;
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

    const form = useForm<EditGroupFormValues>({
        resolver: zodResolver(editGroupSchema),
        defaultValues: {
            name: group.name,
            description: group.description || "",
            privacy: group.privacy,
        },
    });

    useEffect(() => {
        form.reset({
            name: group.name,
            description: group.description || "",
            privacy: group.privacy,
        });
    }, [form, group]);

    const onSubmit = async (data: EditGroupFormValues) => {
        try {
            const result = await updateGroup({
                variables: {
                    groupId: group._id,
                    updateGroupInput: {
                        name: data.name,
                        description: data.description,
                        privacy: data.privacy,
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
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{dict.groups.form.name}</FormLabel>
                            <FormControl>
                                <Input placeholder={dict.groups.form.namePlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{dict.groups.form.description}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={dict.groups.form.descriptionPlaceholder}
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="privacy"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{dict.groups.form.privacy}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={dict.groups.form.selectPrivacy} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={GroupPrivacy.PUBLIC}>{dict.groups.form.public}</SelectItem>
                                    <SelectItem value={GroupPrivacy.PRIVATE}>{dict.groups.form.private}</SelectItem>
                                    <SelectItem value={GroupPrivacy.SECRET}>{dict.groups.form.secret}</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {form.watch("privacy") === GroupPrivacy.PUBLIC
                                    ? dict.groups.form.publicDesc
                                    : form.watch("privacy") === GroupPrivacy.PRIVATE
                                        ? dict.groups.form.privateDesc
                                        : dict.groups.form.secretDesc}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={updating} className="w-full md:w-auto">
                    {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {dict.groups.form.updateBtn}
                </Button>
            </form>
        </Form>
    );
}

export default function EditGroupDialog({ group, children }: EditGroupDialogProps) {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();
    const dict = useDictionary();

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
