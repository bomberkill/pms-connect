"use client";

import React from "react";
import { CreateGroupDialog } from "@/components/groups/CreateGroupDialog";
import { useGroups } from "@/hooks/useData/useGroups";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GroupCardSkeletonList } from "@/components/skeletons/GroupCardSkeleton";
import { useDictionary } from "@/hooks/use-dictionary";

export default function GroupsPage() {
    const dict = useDictionary();
    const { groups, loading, error } = useGroups({ limit: 20 });

    if (error) {
        return (
            <div className="p-4 text-center text-red-500">
                {dict.globalErrors.default}
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto p-4 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{dict.groups.title}</h1>
                    <p className="text-muted-foreground">
                        {dict.groups.subtitle}
                    </p>
                </div>
                <CreateGroupDialog>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> {dict.groups.create}
                    </Button>
                </CreateGroupDialog>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <GroupCardSkeletonList count={6} />
                </div>
            ) : groups.length === 0 ? (
                <div className="text-center py-10 border rounded-lg bg-card/50">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">{dict.groups.noGroups}</h3>
                    <p className="text-muted-foreground mb-4">
                        {dict.groups.noGroupsDesc}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                        <Link key={group._id} href={`/groups/${group.slug}`} className="block h-full">
                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden group">
                                <div className="h-24 bg-muted relative">
                                    {group.coverImageUrl ? (
                                        <img src={group.coverImageUrl} alt={group.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500" />
                                    )}
                                </div>
                                <CardHeader className="relative pt-12 pb-2">
                                    <Avatar className="absolute -top-10 left-4 w-20 h-20 border-4 border-background shadow-sm">
                                        <AvatarImage src={group.profileImageUrl} />
                                        <AvatarFallback className="text-lg">{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <CardTitle className="line-clamp-1">{group.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                        {group.description || dict.profile.noBio}
                                    </p>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Users className="w-3 h-3 mr-1" />
                                        {dict.groups.members}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
