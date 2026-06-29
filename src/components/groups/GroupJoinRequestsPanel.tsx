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
        <Card>
            <CardHeader className="pb-0">
                <CardTitle>{dict.groups.joinRequests}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
                {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{dict.groups.noJoinRequests}</p>
                ) : (
                    requests.map((request) => {
                        const requesterName = getRequesterName(
                            request,
                            dict.groups.unknownMember,
                        );
                        const requester = request.user as { profilePicUrl?: string };

                        return (
                            <div key={request.id} className="rounded-lg border p-3 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={requester.profilePicUrl} />
                                        <AvatarFallback>
                                            {requesterName.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{requesterName}</p>
                                        <p className="text-xs text-muted-foreground">{request.status}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => onApprove(request.id)}
                                        disabled={actionLoading}
                                    >
                                        {dict.groups.approveRequest}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
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
