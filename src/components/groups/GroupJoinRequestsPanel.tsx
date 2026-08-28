"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDictionary } from "@/hooks/use-dictionary";
import { GroupJoinRequest } from "@/types/Group";

interface GroupJoinRequestsPanelProps {
    requests: GroupJoinRequest[];
    actionLoading: boolean;
    onApprove: (requestId: string) => Promise<void>;
    onReject: (requestId: string) => Promise<void>;
}

function getRequesterName(request: GroupJoinRequest, fallback: string) {
    const user = request.user as {
        firstName?: string;
        lastName?: string;
        entityName?: string;
    };

    if (user.firstName || user.lastName) {
        return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    }

    return user.entityName || fallback;
}

export default function GroupJoinRequestsPanel({
    requests,
    actionLoading,
    onApprove,
    onReject,
}: GroupJoinRequestsPanelProps) {
    const dict = useDictionary();

    return (
        <Card className="rounded-none border-0 shadow-none">
            <CardHeader className="sr-only">
                <CardTitle>{dict.groups.joinRequests}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
                {requests.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">{dict.groups.noJoinRequests}</p>
                ) : (
                    requests.map((request) => {
                        const requesterName = getRequesterName(
                            request,
                            dict.groups.unknownMember,
                        );
                        const requester = request.user as { profilePicUrl?: string };

                        return (
                            <div key={request.id} className="space-y-3 border-b border-border/70 p-4 last:border-b-0">
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-11 w-11">
                                        <AvatarImage src={requester.profilePicUrl} />
                                        <AvatarFallback>
                                            {requesterName.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[14.5px] font-semibold">{requesterName}</p>
                                        <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{request.status}</p>
                                        <p className="mt-2 rounded-[10px] bg-muted/45 px-3 py-2 text-[13px] leading-relaxed text-muted-foreground dark:bg-muted/20">
                                            {dict.groups.joinRequestNoMessage}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 pl-14">
                                    <Button
                                        size="sm"
                                        className="h-[38px] flex-1 rounded-[11px]"
                                        onClick={() => onApprove(request.id)}
                                        disabled={actionLoading}
                                    >
                                        {dict.groups.approveRequest}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-[38px] flex-1 rounded-[11px]"
                                        onClick={() => onReject(request.id)}
                                        disabled={actionLoading}
                                    >
                                        {dict.groups.rejectRequest}
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
