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

const createGroupSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
    description: z.string().max(500, "Description must be less than 500 characters").optional(),
    privacy: z.nativeEnum(GroupPrivacy),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

interface CreateGroupDialogProps {
    children?: React.ReactNode;
}

export function CreateGroupDialog({ children }: CreateGroupDialogProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { createGroup, creating } = useGroupMutations();

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
                toast.success("Group created successfully!");
                setOpen(false);
                form.reset();
                // Redirect to the new group
                router.push(`/groups/${result.data.createGroup.slug}`);
            }
        } catch (error) {
            console.error("Failed to create group:", error);
            toast.error("Failed to create group. Please try again.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Group
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Group</DialogTitle>
                    <DialogDescription>
                        Create a new community for people to connect.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. React Developers" {...field} />
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
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="What is this group about?"
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
                                    <FormLabel>Privacy</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select privacy" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={GroupPrivacy.PUBLIC}>Public</SelectItem>
                                            <SelectItem value={GroupPrivacy.PRIVATE}>Private</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Public groups are visible to everyone. Private groups require approval to join.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={creating}>
                                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Group
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
