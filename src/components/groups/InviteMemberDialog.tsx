"use client";

import React, { useMemo, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserListItem } from "@/components/UserListItem";
import { useDictionary } from "@/hooks/use-dictionary";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUsers } from "@/hooks/useData/useUserData";
import { useGroupMutations } from "@/hooks/useData/useGroups";
import { getUserDisplayName } from "@/lib/user-utils";

interface InviteMemberDialogProps {
    groupId: string;
    existingMemberIds: string[];
    children?: React.ReactNode;
}

function InviteMemberList({ groupId, existingMemberIds }: { groupId: string; existingMemberIds: string[] }) {
    const dict = useDictionary();
    const [searchQuery, setSearchQuery] = useState("");
    const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
    const { suggestions, loading } = useUsers({ limit: 100 });
    const { addOrInviteGroupMember, inviting } = useGroupMutations();

    const candidates = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return suggestions.filter((user) => {
            if (existingMemberIds.includes(user.id) || invitedIds.has(user.id)) return false;
            if (!q) return true;
            return getUserDisplayName(user).toLowerCase().includes(q);
        });
    }, [suggestions, existingMemberIds, invitedIds, searchQuery]);

    const handleInvite = async (userId: string) => {
        try {
            await addOrInviteGroupMember({ variables: { groupId, userId } });
            setInvitedIds((prev) => new Set(prev).add(userId));
            toast.success(dict.groups.form.inviteSentSuccess);
        } catch {
            toast.error(dict.groups.form.inviteSentError);
        }
    };

    return (
        <div className="space-y-3">
            <Input
                placeholder={dict.friends.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                ) : candidates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">{dict.groups.form.noInviteCandidates}</p>
                ) : (
                    candidates.map((user) => (
                        <UserListItem
                            key={user.id}
                            user={user}
                            action={
                                <Button size="sm" onClick={() => handleInvite(user.id)} disabled={inviting}>
                                    {dict.groups.form.invite}
                                </Button>
                            }
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default function InviteMemberDialog({ groupId, existingMemberIds, children }: InviteMemberDialogProps) {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();
    const dict = useDictionary();

    const trigger = children || (
        <Button variant="outline">
            <UserPlus className="mr-2 h-4 w-4" /> {dict.groups.form.invite}
        </Button>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>{trigger}</DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader className="text-left">
                        <DrawerTitle>{dict.groups.form.inviteDialogTitle}</DrawerTitle>
                        <DrawerDescription>{dict.groups.form.inviteDialogDesc}</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-4">
                        {open && <InviteMemberList groupId={groupId} existingMemberIds={existingMemberIds} />}
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
                    <DialogTitle>{dict.groups.form.inviteDialogTitle}</DialogTitle>
                    <DialogDescription>{dict.groups.form.inviteDialogDesc}</DialogDescription>
                </DialogHeader>
                {open && <InviteMemberList groupId={groupId} existingMemberIds={existingMemberIds} />}
            </DialogContent>
        </Dialog>
    );
}
