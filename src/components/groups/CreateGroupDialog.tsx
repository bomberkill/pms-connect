"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { useGroupMutations } from "@/hooks/useData/useGroups";
import { GroupPrivacy } from "@/types/Group";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/hooks/use-dictionary";

const createGroupSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
    description: z.string().max(500, "Description must be less than 500 characters").optional(),
    privacy: z.nativeEnum(GroupPrivacy),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

interface CreateGroupDialogProps {
    children?: React.ReactNode;
}

function GroupForm({ afterSubmit, className }: { afterSubmit: () => void, className?: string }) {
    const router = useRouter();
    const { createGroup, creating } = useGroupMutations();
    const dict = useDictionary();

    const form = useForm<CreateGroupFormValues>({
        resolver: zodResolver(createGroupSchema),
        defaultValues: {
            name: "",
            description: "",
            privacy: GroupPrivacy.PUBLIC,
        },
    });

    const onSubmit = async (data: CreateGroupFormValues) => {
        try {
            const result = await createGroup({
                variables: {
                    createGroupInput: {
                        name: data.name,
                        description: data.description,
                        privacy: data.privacy,
                    }
                },
            });

            if (result.data?.createGroup) {
                toast.success(dict.groups.form.createSuccess);
                form.reset();
                afterSubmit();
                // Redirect to the new group
                router.push(`/groups/${result.data.createGroup.slug}`);
            }
        } catch (error) {
            console.error("Failed to create group:", error);
            toast.error(dict.groups.form.createError);
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
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={dict.groups.form.selectPrivacy} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={GroupPrivacy.PUBLIC}>{dict.groups.form.public}</SelectItem>
                                    <SelectItem value={GroupPrivacy.PRIVATE}>{dict.groups.form.private}</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {form.watch("privacy") === GroupPrivacy.PUBLIC
                                    ? dict.groups.form.publicDesc
                                    : dict.groups.form.privateDesc}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={creating} className="w-full md:w-auto">
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {dict.groups.form.createBtn}
                </Button>
            </form>
        </Form>
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
                    <DrawerFooter className="pt-2">
                        {/* <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose> */}
                    </DrawerFooter>
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
