"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDictionary } from "@/hooks/use-dictionary";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { Post } from "@/types/Post";

interface PendingGroupPostsPanelProps {
    posts: Post[];
    actionLoading: boolean;
    onApprove: (postId: string) => Promise<void>;
    onReject: (postId: string) => Promise<void>;
}

export default function PendingGroupPostsPanel({
    posts,
    actionLoading,
    onApprove,
    onReject,
}: PendingGroupPostsPanelProps) {
    const dict = useDictionary();

    return (
        <Card>
            <CardHeader className="pb-0">
                <CardTitle>{dict.groups.pendingPosts}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
                {posts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{dict.groups.noPendingPosts}</p>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="rounded-lg border p-3 space-y-3">
                            <div className="flex items-start gap-3">
                                <Avatar className="w-10 h-10 shrink-0">
                                    <AvatarImage src={post.author.profilePicUrl} />
                                    <AvatarFallback>{getUserInitials(post.author)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{getUserDisplayName(post.author)}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{post.content}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => onApprove(post.id)} disabled={actionLoading}>
                                    {dict.groups.approvePost}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => onReject(post.id)} disabled={actionLoading}>
                                    {dict.groups.rejectPost}
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
